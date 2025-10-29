from accounts.services import StartdateTokenAuthentication, IntegrationKeyAuthentication
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework.response import Response
from candidate.aws import upload_to_aws
from candidate.services import reformat_dates_in_candidate_data
from job_posting.serializers import (
    OfferSerializer,
    SkillSerializer,
    JobPostingSkillSerializer,
    OfferAdminSerializer,
    CandidateAppliedJobsSerializer, OtherCandidatesGetSerializer, JobPostingWeightsSerializer
)
from candidate.models import Candidate, UnmaskedCandidateJobPosting
from job_posting.models import (
    JobPosting,
    JobPostingSkill,
    Skill,
    JobPostingCandidate,
    JobPostingTemplate,
    OtherCandidates,
    JobPostingReveals,
    JobPostingLabelWeight,
    MLTrainingData
)
# from job_posting.validators import validate_candidate_ids, validate_job_ids
from company.models import Location, KanbanBoard, Subscription, Industry
from company.serializers import IndustrySerializer
import pandas as pd
from machine_learning.models import MLProcess
from .permissions import (
    EmployerPermission,
    EmployerSpecificObjectPermission,
    JobSeekerSpecificObjectPermission, AdminPermission
)
from rest_framework.permissions import IsAuthenticated
from .services import (
    is_valid_employer,
    is_valid_company,
    job_posting_search_query_in_multiple_tables,
    top_job_posting_candidate_pics,
    send_full_service_mail,
    job_posting_template,
    create_job_posting_template,
    update_job_posting_template,
    fetch_other_candidates,
    other_candidates_csv_read,
    complete_candidate_data,
    get_job_posting_data_for_other_candidates,
    add_to_ranker_queue,
    get_imprimis_specific_job,
    job_posting,
    job_posting_skills,
    clean_html,
    get_industry_id
)
from decouple import config
from django.core.paginator import Paginator
import requests
from django.conf import settings
from uuid import uuid4
from django.db.models import Count
from django.db.models import OuterRef, Exists

from django.db.models import Exists, OuterRef

class LocationJobPostingBaseView(APIView):
    authentication_classes = (
        StartdateTokenAuthentication,
        IntegrationKeyAuthentication,
    )
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request, location_id):
        try:
            data = request.data["job"]
            location = Location.objects.get(id=location_id)
            company = location.company_id
            data.update({"company_id": company.id, "location_id": location_id})
            if hasattr(request, "user"):
                data.update({"created_by": request.user.id})
                data.update({"updated_by": request.user.id})
            offer_serializer = OfferSerializer(data=data)
            if offer_serializer.is_valid():
                offer_instance = offer_serializer.save()
                data.update({"job_posting_id": offer_instance.id})
            else:
                raise Exception(offer_serializer.errors)
            for skill in data["skills"]:
                skill_object = Skill.objects.get_or_create(name=skill)[0]
                data.update({"skill_id": skill_object.id})
                job_posting_skill_serializer = JobPostingSkillSerializer(data=data)
                if job_posting_skill_serializer.is_valid():
                    job_posting_skill_serializer.save()
            MLProcess.objects.create(status="pending", job_posting_id=offer_instance)
            if company.subscription_type == "full_service":
                Subscription.objects.create(
                    company_id_id=company.id,
                    type="full_service",
                    job_posting_id=offer_instance,
                )
            return Response(offer_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"Error": e}, status=status.HTTP_400_BAD_REQUEST)


class JobPostingSerializerView(APIView):
    authentication_classes = (
        StartdateTokenAuthentication,
        IntegrationKeyAuthentication,
    )
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request):
        status = request.query_params.get("status")
        page_number = request.query_params.get("page", 1)
        per_page = int(request.query_params.get("per_page", 50))

        user_company = getattr(request, "company", request.user.location_id.company_id)

        company_locations = Location.objects.filter(company_id=user_company).values_list("id", flat=True)

        active_jobs_count = JobPosting.objects.filter(location_id_id__in=company_locations, status="active").count()
        inactive_jobs_count = JobPosting.objects.filter(location_id_id__in=company_locations, status="inactive").count()

        job_queryset = JobPosting.objects.filter(location_id_id__in=company_locations).order_by("-created_at")
        subscription_type = None  

        if status == "inactive":
            job_queryset = job_queryset.filter(status="inactive")
        elif status == "active":
            job_queryset = job_queryset.filter(status="active")
        elif status == "fullService":
            full_service_jobs = Subscription.objects.filter(job_posting_id=OuterRef("id"), type="full_service")
            job_queryset = job_queryset.filter(Exists(full_service_jobs))
            subscription_type = "full_service"  

        paginator = Paginator(job_queryset, per_page)
        paginated_jobs = paginator.get_page(page_number)

        serializer = OfferSerializer(paginated_jobs, many=True)

        job_ids = [job["id"] for job in serializer.data]
        
        subscriptions = {}  
        if status != "fullService":
            subscriptions = {
                str(sub.job_posting_id_id): sub.type for sub in Subscription.objects.filter(job_posting_id_id__in=job_ids)
            }

        for item in serializer.data:
            job = JobPosting.objects.only("id").get(id=item["id"])
            pictures, total_matches = top_job_posting_candidate_pics(job)

            item.update({
                "company_name": user_company.name,
                "subscription_type": subscriptions.get(item["id"], None),
                "top_profile_pictures": pictures,
                "total_matches": total_matches,
                "company_id": user_company.id,
            })

        context = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": int(page_number),
            "per_page": per_page,
            "job_postings": serializer.data,
            "active_jobs_count": active_jobs_count,
            "inactive_jobs_count": inactive_jobs_count,
        }
        return Response(context, content_type="application/json")

    def patch(self, request, job_posting_id):
        try:
            data = request.data["job"]
            job = JobPosting.objects.filter(id=job_posting_id).first()
            if hasattr(request, "user") and request.user.role == "admin":
                serializer = OfferAdminSerializer(job, data=data, partial=False)
            else:
                serializer = OfferSerializer(job, data=data, partial=False)
            if serializer.is_valid():
                serializer.save()
            else:
                raise Exception(serializer.errors)
            job_posting_skill_data = JobPostingSkill.objects.filter(job_posting_id=job)
            old_skill_id_list = []
            old_skill_list = []
            for job_posting_skill in job_posting_skill_data:
                skill_id = job_posting_skill.skill_id_id
                skill = Skill.objects.get(id=skill_id)
                old_skill_id_list.append({"name": skill.name, "id": skill.id})
                old_skill_list.append(skill.name)

            new_skill_list = data["skills"]

            # delete
            for skill in old_skill_id_list:
                if skill["name"] not in new_skill_list:
                    JobPostingSkill.objects.filter(
                        job_posting_id=job, skill_id=skill["id"]
                    ).delete()

            # create
            for skill_updated in new_skill_list:
                if skill_updated not in old_skill_list:
                    skill_data = Skill.objects.get_or_create(name=skill_updated)[0]
                    JobPostingSkill.objects.create(
                        job_posting_id=job, skill_id=skill_data
                    )

            # Entry in ML Process table
            MLProcess.objects.create(status="pending", job_posting_id=job)

            # sending mail to Admin for confirmation
            subscription = Subscription.objects.filter(job_posting_id=job)
            if subscription.exists() and subscription[0].type == "full_service":
                send_full_service_mail(id, job.location_id.company_id, job.title)
            return Response(
                {"status": "success", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"status": "error", "data": e}, status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, job_posting_id):
        job = JobPosting.objects.get(id=job_posting_id)
        job.status = "inactive"
        job.save()
        return Response({"status": "success"}, status=status.HTTP_200_OK)

class JobDataFetchingSerializer(APIView):
    authentication_classes = (
        StartdateTokenAuthentication,
        IntegrationKeyAuthentication,
    )
    permission_classes = (IsAuthenticated,)

    def get(self, request, id):
        data = JobPosting.objects.filter(id=id).first()
        if not data:
            return Response(
                {"Error": "Job Posting Not Available"}, status=status.HTTP_404_NOT_FOUND
            )
        company = data.location_id.company_id
        serializer = OfferSerializer(data)
        if not hasattr(request, "company"):
            if request.user.role == "employer":
                is_valid = is_valid_employer(request, data)
                if not is_valid:
                    return Response(
                        {"Message": "Trying to Access Wrong Job Posting"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

        elif hasattr(request, "company"):
            is_valid = is_valid_company(request, data)
            if not is_valid:
                return Response(
                    {"Message": "Trying to Access Wrong Job Posting"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        job_posting_skill_data = JobPostingSkill.objects.filter(job_posting_id=id)
        skills = []
        skills_list = ""
        for job_posting_skill in job_posting_skill_data:
            skill_id = job_posting_skill.skill_id_id
            skill = Skill.objects.get(id=skill_id)
            skill_serializer = SkillSerializer(skill)
            skills.append(skill_serializer.data["name"])
            if skills_list != "":
                skills_list = skills_list + "," + skill_serializer.data["name"]
            elif skills_list == "":
                skills_list = skills_list + skill_serializer.data["name"]

        context = {
            "id": id,
            "title": serializer.data["title"],
            "compensation": serializer.data["compensation"],
            "description": serializer.data["description"],
            "skills": skills,
            "workLocation": serializer.data["work_location_type"],
            "city": serializer.data["city"] or "",
            "country": serializer.data["country"] or "",
            "state": serializer.data["state"] or "",
            "zip": serializer.data["zip"],
            "companyName": company.name,
            "status": serializer.data["status"],
            "job_industry": serializer.data["job_industry"],
            "skillsList": skills_list,
            "remoteType": serializer.data["remote_type"],
        }
        if hasattr(request, "user") and request.user.role == "admin":
            context.update({"minimum_match": data.minimum_match})
        if hasattr(request, "company") or request.user.role == "employer" or request.user.role == "hiring_manager":
            subscription_type = None
            subscription = Subscription.objects.filter(job_posting_id=data).first()
            if subscription:
                subscription_type = subscription.type
            context.update({"subscription_type": subscription_type})
        return Response(context, content_type="application/json")


class JobPostingMultipleImportView(generics.UpdateAPIView):
    authentication_classes = (
        StartdateTokenAuthentication,
        IntegrationKeyAuthentication,
    )
    permission_classes = (EmployerPermission,)

    def post(self, request):
        if hasattr(request, "company"):
            company_id = request.company
            location = Location.objects.filter(company_id=company_id).first()
            if not Location:
                return Response(
                    {"Error": "No Location Found for Company to Create Jobs"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            location = request.user.location_id
            company_id = location.company_id
        excel_file = request.FILES.get("file")
        allowed_extensions = ["xls", "xlsx"]
        file_extension = excel_file.name.split(".")[-1].lower()
        if file_extension not in allowed_extensions:
            return Response(
                {"Error": "Invalid file extension. Must be a 'xls' or 'xlsx' "},
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )

        df_test = pd.read_excel(excel_file)
        df = df_test.fillna("")
        if len(df) == 0:
            return Response(
                {"Error": "Excel File is Empty"}, status=status.HTTP_400_BAD_REQUEST
            )
        for i, row in df.iterrows():
            try:
                job_posting_object = JobPosting.objects.create(
                    state=row["locationTypeId"],
                    title=row["title"],
                    compensation=row["compensation"],
                    description=row["description"],
                    location_id=location,
                    status="active",
                    work_location_type=row["modalityTypeId"],
                )
                skill_counter = 0
                while True:
                    if row[f"Skill-{skill_counter}"] == "":
                        break
                    skill_obj, skill_flag = Skill.objects.get_or_create(
                        name=row[f"Skill-{skill_counter}"]
                    )
                    skill_obj_id = skill_obj.id
                    JobPostingSkill.objects.get_or_create(
                        skill_id_id=skill_obj_id, job_posting_id=job_posting_object
                    )
                    skill_counter = skill_counter + 1
                MLProcess.objects.create(
                    status="pending", job_posting_id=job_posting_object
                )
                if company_id.subscription_type == "full_service":
                    Subscription.objects.create(
                        company_id=company_id,
                        type="full_service",
                        job_posting_id=job_posting_object,
                    )
            except:
                pass
        return Response(status=status.HTTP_200_OK)


class KanbanBoardCandidate(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def put(self, request, job_posting_id):
        try:
            data = request.data
            board_stage = KanbanBoard.objects.filter(id=data["hiring_stage_id"]).first()
            if not board_stage:
                return Response(
                    {"Message": "Hiring Stage Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            elif (
                board_stage.stage_name == "Revealed Candidates"
                or board_stage.stage_name == "Sourced"
            ):
                return Response(
                    {
                        "Message": "Cannot Move Cards to Revealed Candidates Or Sourced Stage"
                    },
                    status=status.HTTP_405_METHOD_NOT_ALLOWED,
                )
            jp_candidate = JobPostingCandidate.objects.get(
                id=data["job_posting_candidate_id"]
            )
            jp_candidate.hiring_stage_id_id = board_stage.id
            jp_candidate.save()
            return Response(
                {"Message": "Hiring Stage Changed Successfully"},
                status=status.HTTP_200_OK,
            )
        except:
            return Response(
                {"Error": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST
            )


class AllJobPostingView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        title = request.query_params.get("title")
        location = request.query_params.get("location")
        min_salary = request.query_params.get("min_salary")
        max_salary = request.query_params.get("max_salary")
        source = request.query_params.get("source")

        if title or location or min_salary or max_salary:
            job_posting_dataset = job_posting_search_query_in_multiple_tables(
                title, location, min_salary, max_salary
            )
        else:
            job_posting_dataset = (
                JobPosting.objects.all()
                .exclude(status="inactive")
                .order_by("-created_at")
            )
        if source:
            job_posting_dataset = job_posting_dataset.filter(source=source)
        page_number = request.query_params.get("page")
        per_page = request.query_params.get("per_page")
        if not per_page:
            per_page = 50
        paginator = Paginator(job_posting_dataset, per_page)
        job_postings = paginator.get_page(page_number)
        jobs_list = []
        for job in job_postings:
            location = job.location_id
            company = location.company_id
            pictures, total_matches = top_job_posting_candidate_pics(job)
            job_data = {
                "id": str(job.id),
                "company_id": str(company.id),
                "company_name": company.name,
                "company_logo": company.logo,
                "location_id": str(location.id),
                "city": location.city,
                "state": location.state,
                "job_id": str(job.id),
                "title": job.title,
                "compensation": job.compensation,
                "work_location_type": job.work_location_type,
                "remote_type": job.remote_type,
                "created_at": job.created_at,
                "source": job.source,
                "top_profile_pictures": pictures,
            }
            subscription_type = None
            if request.user.role == "admin":
                subscription = Subscription.objects.filter(job_posting_id=job).first()
                subscription_type = subscription.type if subscription else None
                if subscription_type:
                    job_data.update({"subscription_type": subscription_type})
                jobs_list.append(job_data)
        context = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "jobs_data": jobs_list,
        }
        return Response(context, content_type="application/json")
   
class JobPostingTemplateView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request):
        user = request.user
        industry_id = request.query_params.get("industry_id", None)
        title_query = request.query_params.get("title", None)
        page = request.query_params.get("page", 1)
        per_page = request.query_params.get("per_page", 50)
        filter = request.query_params.get("filter", "all")

        if user.role in ["employer","hiring_manager"]:
            response = job_posting_template(
                industry_id, title_query, user.location_id.company_id, page, per_page, filter
            )
        elif user.role == "admin":
            response = job_posting_template(industry_id, title_query, "all", page, per_page, filter)

        if isinstance(response, Response):
            return response
        else:
            return Response(
                response.get("Error"),
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )

    def post(self, request):
        user = request.user
        data = request.data
        category = data.get("category", None)
        if data.get("is_category", None):
            try:
                templates = data.get("templatePayload", [])
                for template in templates:
                    if user and user.is_authenticated and user.role == "employer" or user.role == "hiring_manager":
                        template["company_id"] = user.location_id.company_id.id
                    industry_name = template.get("industry_name", None)
                    job_title = template.get("job_title", None)
                    skill = template.get("skill", None)
                    description = template.get("description", None)
                    industry_id = template.get("industry_id", None)
                    response = create_job_posting_template(
                        job_title, skill, description, industry_id, template["company_id"]
                    )
                return Response({"Message": "Templates added successfully"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"Message": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)
        data["company_id"] = None
        if user and user.is_authenticated and user.role == "employer" or user.role == "hiring_manager":
            data["company_id"] = user.location_id.company_id.id

        industry_name = data.get("industry_name", None)
        job_title = data.get("job_title", None)
        skill = data.get("skill", None)
        description = data.get("description", None)
        industry_id = data.get("industry_id", None)

        if not all([industry_name, job_title, skill, description]):
            response = {"Error": "Keys missing"}
            return Response(
                response,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_obj, created_flag = Industry.objects.get_or_create(title=industry_name)
        industry_id = str(response_obj.id)

        response = create_job_posting_template(
            job_title, skill, description, industry_id, data["company_id"]
        )

        if isinstance(response, Response):
            return response
        else:
            response = {"Error": "Something went wrong"}
            return Response(
                response,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request):
        try:
            template_id = request.query_params.get("template_id")
            if template_id is None:
                return Response(
                    {"Error": "template_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            delete_obj = JobPostingTemplate.objects.filter(id=template_id)
            if not delete_obj.exists():
                return Response(
                    {"Error": "Job template does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            else:
                delete_obj.delete()
                return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"Error": f"Exception : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request):
        data = request.data
        response = update_job_posting_template(data)
        
        if isinstance(response, Response):
            return response
        else:
            return Response({"Error": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)


class IndustryView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request):
        query = request.query_params.get("name", None)
        page = request.query_params.get("page", None)
        per_page = request.query_params.get("per_page", None)
        _query = {}
        
        if query:
            _query["title__icontains"] = query
            
        industry_query_obj = Industry.objects.filter(**_query).order_by("-updated_at")
        
        if page and per_page:
            paginator = Paginator(industry_query_obj, per_page)
            industry_query_obj = paginator.get_page(page)
            serializer = IndustrySerializer(instance=industry_query_obj, many=True)
            
            data = {
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page,
                "per_page": per_page,
                "data": serializer.data,
            }
        else:
            serializer = IndustrySerializer(instance=industry_query_obj, many=True)
            data = serializer.data
        
        return Response(data, content_type="application/json")

    def post(self, request):
        try:
            data = request.data
            title = data.get("title")
            filter = {"title": title}
            
            try:
                industry = Industry.objects.filter(**filter)

                if industry.exists():
                    return Response(
                        {"Error": "An industry with this title already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    create__query = {"title": title, "created_by_id": request.user.id}
                    industry, created_flag = Industry.objects.get_or_create(**create__query)
            except Exception as e:
                industry = Industry.objects.deleted_set().filter(title=title).first()
                industry.undelete()

            response_context = {
                "industry_id": str(industry.id),
                "title": industry.title,
            }

            return Response(
                response_context,
                content_type="application/json",
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            response = {"Error": f"Exception : {str(e)}"}
            
            return Response(
                response,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request):
        try:
            industry_id = request.query_params.get("industry_id")
            if industry_id is None:
                return Response(
                    {"Error": "industry_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                industry = Industry.objects.get(id=industry_id)
            except Industry.DoesNotExist:
                return Response(
                    {"Error": "Industry does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if JobPostingTemplate.objects.filter(industry_id_id=industry_id).exists():
                return Response(
                    {
                        "Error": "Cannot delete industry because it is referenced in job templates. First delete job templates associated with this industry."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            industry.delete()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"Error": f"Exception : {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def put(self, request):
        try:
            data = request.data
            industry_id = data.get("industry_id")
            if industry_id is None:
                return Response(
                    {"Error": "industry_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                industry = Industry.objects.get(id=industry_id)
            except Industry.DoesNotExist:
                return Response(
                    {"Error": "Industry does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            title = data.get("title")

            if (
                title
                and Industry.objects.filter(title=title)
                .exclude(id=industry_id)
                .exists()
            ):
                return Response(
                    {"Error": "A industry with this title already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if title:
                industry.title = title
            industry.save()
            updated_industry_data = {
                "id": industry_id,
                "title": industry.title,
            }
            return Response(updated_industry_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"Error": f"Exception : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OpenIndustryView(APIView):
    def get(self, request):
        query = request.query_params.get("name", None)
        industry_query_obj = Industry.objects.annotate(has_jobs=Exists(JobPostingTemplate.objects.filter(industry_id=OuterRef("id"),company_id__isnull=True))).filter(has_jobs=True)
        if query:
            industry_query_obj = industry_query_obj.filter(title__icontains=query)
        serializer = IndustrySerializer(instance=industry_query_obj, many=True)
        return Response(serializer.data, content_type="application/json")


class OpenJobPostingTemplateView(APIView):
    def get(self, request):
        industry_id = request.query_params.get("industry_id", None)
        title_query = request.query_params.get("title", None)
        is_category = request.query_params.get("is_category", None)
        response = job_posting_template(industry_id, title_query, None, None, None, "all", is_category)
        
        if isinstance(response, Response):
            return response
        else:
            return Response(
                response.get("Error"),
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )


class ExternalJobPostingView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request):
        data = request.data
        company_id = request.user.location_id.company_id
        if not data.get("external_job_ids"):
            return Response(
                {"error": "External Job Ids Missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if company_id.name == "Imprimis Group":
            context_data = {
                "queue_name": "imprimis_jobs_sync",
                "imprimis_job_ids": data.get("external_job_ids"),
            }
            try:
                url = f"{config('PROCESS_QUEUE_DOMAIN')}/queue_job"
                headers = {
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                }
                response = requests.request(
                    "POST", url, headers=headers, json=context_data
                )
                if response.status_code == 200:
                    return Response(
                        {"message": "Published to Queue"}, status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": "Something went wrong. Please wait for some time"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "Invalid Company for External Job Sync"},
            status=status.HTTP_406_NOT_ACCEPTABLE,
        )


class OtherCandidateImportView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request, job_posting_id):
        try:
            csv_file = request.FILES.get('other_candidates')
            file_key = (
                f"other_candidates/{job_posting_id}/" + csv_file.name
            )
            res = upload_to_aws(csv_file, settings.AWS_STORAGE_BUCKET_NAME, file_key)
            if res["ResponseMetadata"]["HTTPStatusCode"] == 200:
                data = {
                    "key": file_key,
                    "job_posting_id_id": job_posting_id,
                    "status": "pending",
                }
                other_candidates = OtherCandidates.objects.create(**data)
                other_candidates_csv_read(other_candidates, csv_file, request.user.role)
                other_candidates.refresh_from_db()
                context = {'queued': other_candidates.queued, 'failed': other_candidates.failed}
                return Response(context, status=status.HTTP_200_OK)
            else:
                return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, job_posting_id):
        is_hiring_stage_null = request.query_params.get('hiring_stage_null')
        response = fetch_other_candidates(request, job_posting_id, is_hiring_stage_null)
        return Response(response, status=status.HTTP_200_OK)

    def put(self, request, job_posting_id):

        try:
            data = request.data
            job = JobPosting.objects.get(id=job_posting_id)
            board_stage = KanbanBoard.objects.filter(company_id=job.location_id.company_id, stage_name='In Progress').first()
            if not board_stage:
                return Response(
                    {"Message": "Hiring Stage Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            JobPostingCandidate.objects.filter(job_posting_id=job, candidate_id__in=data["candidates_id"]).update(hiring_stage_id=board_stage)
            return Response(
                {"Message": "Moved To Kanban Successfully"},
                status=status.HTTP_200_OK,
            )
        except:
            return Response(
                {"Error": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST
            )


class ApplyJobPostingView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, job_posting_id, candidate_id):
        try:
            jpc = JobPostingCandidate.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).first()
            if jpc:
                if jpc.source == 'applied':
                    return Response({"message": "Already Applied"}, status=status.HTTP_403_FORBIDDEN)
                jpc.source = 'applied'
                jpc.save()
                if JobPostingReveals.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).exists():
                    UnmaskedCandidateJobPosting.objects.create(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id)
                return Response({"message": "Applied Successfully"}, status=status.HTTP_200_OK)
            else:
                job_obj = JobPosting.objects.filter(id=job_posting_id).first()
                if not job_obj:
                    return Response({"message": f"Invalid Job id {job_posting_id}"}, status=status.HTTP_400_BAD_REQUEST)
                cand_obj = Candidate.objects.filter(id=candidate_id).first()
                if not cand_obj:
                    return Response({"message": f"Invalid Candidate id {candidate_id}"},
                                    status=status.HTTP_400_BAD_REQUEST)
                candidate_data = complete_candidate_data(cand_obj)
                candidate_data.update({'source_type': 'applied'})
                candidate_data = reformat_dates_in_candidate_data(candidate_data)
                job_data = get_job_posting_data_for_other_candidates(job_obj)
                add_to_ranker_queue(job_data, candidate_data)
                return Response({"message": "Applied Successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error ": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, job_posting_id, candidate_id):
        try:
            job_obj = JobPosting.objects.filter(id=job_posting_id).first()
            if not job_obj:
                return Response({"message": f"Invalid Job id {job_posting_id}"}, status=status.HTTP_400_BAD_REQUEST)
            cand_obj = Candidate.objects.filter(id=candidate_id).first()
            if not cand_obj:
                return Response({"message": f"Invalid Candidate id {candidate_id}"},
                                status=status.HTTP_400_BAD_REQUEST)
            applied_job = JobPostingCandidate.objects.filter(job_posting_id_id=job_posting_id,
                                                             candidate_id_id=candidate_id).first()
            if not applied_job:
                return Response({"message": "Application Not Found"}, status=status.HTTP_404_NOT_FOUND)
            applied_job.delete()
            if JobPostingReveals.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).exists():
                UnmaskedCandidateJobPosting.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).delete()
            return Response({"message": "Application deleted successfully"}, status=status.HTTP_200_OK)
        except:
            return Response({"error ": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST)


class CandidateAppliedJobsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, candidate_id):
        try:
            cand_obj = Candidate.objects.filter(id=candidate_id).first()
            if not cand_obj:
                return Response({"message": f"Invalid Candidate id {candidate_id}"},
                                status=status.HTTP_400_BAD_REQUEST)
            applied_jobs = JobPostingCandidate.objects.filter(candidate_id_id=candidate_id)
            applied_jobs = CandidateAppliedJobsSerializer(instance=applied_jobs, many=True)
            return Response(applied_jobs.data, status=status.HTTP_200_OK)

        except Exception as e:
            print(e)
            return Response({"error ": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST)


class OtherCandidatesImportStatsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request):
        try:
            locations = Location.objects.filter(company_id=request.user.location_id.company_id).values_list('id', flat=True)
            job_postings = JobPosting.objects.filter(location_id__in=locations).values_list('id', flat=True)
            other_candidates = OtherCandidates.objects.filter(job_posting_id__in=job_postings).order_by('-created_at')
            serializer = OtherCandidatesGetSerializer(instance=other_candidates, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class TargetLabelWeightagesDefaults(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, job_posting_id):
        return Response(MLTrainingData.TARGET_LABELS, status=status.HTTP_200_OK)


class TargetLabelWeightages(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, job_posting_id):
        try:
            weights = JobPostingLabelWeight.objects.filter(job_posting_id_id=job_posting_id)
            if len(weights) > 0:
                serializer = JobPostingWeightsSerializer(instance=weights, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(MLTrainingData.TARGET_LABELS, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, job_posting_id):
        job_posting = JobPosting.objects.filter(id=job_posting_id).first()
        summary = None
        
        try:
            for weight in request.data:
                if weight['type'] != 'summary' and (weight['weightage'] > 100 or weight['weightage'] < 0):
                    return Response({"Error": f"Weightage for {weight['type']} label must be between 0 to 100"}, status=status.HTTP_400_BAD_REQUEST)
                elif weight['type'] == 'summary' and weight['weightage'] > 100:
                    return Response({"Error": f"Weightage for summary label cannot exceed 100"}, status=status.HTTP_400_BAD_REQUEST)
                elif weight['type'] == 'summary':
                    summary = weight
                    
            if not summary:
                return Response({"Error": "Summary label weightage is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            for weight in request.data[::-1]:
                if weight['type'] not in [label['type'] for label in MLTrainingData.TARGET_LABELS]:
                    return Response({"Error": f"Invalid label type: {weight['type']}"}, status=status.HTTP_400_BAD_REQUEST)
                
                if weight['type'] != 'summary' and summary['weightage'] + weight['weightage'] > 100:
                    return Response({"Error": f"Total weightage for {weight['type']} label cannot exceed 100 (including summary)"}, status=status.HTTP_400_BAD_REQUEST)
                    
                label = JobPostingLabelWeight.objects.filter(type=weight['type'], job_posting_id_id=job_posting_id).first()
                
                if label:
                    label.weightage = weight['weightage']
                    label.save()
                else:
                    JobPostingLabelWeight.objects.create(**weight, job_posting_id=job_posting)
                    
            weights = JobPostingLabelWeight.objects.filter(job_posting_id_id=job_posting_id)
            serializer = JobPostingWeightsSerializer(instance=weights, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({"Error": e}, status=status.HTTP_400_BAD_REQUEST)
            
class ExternalJobPostingTemplatesView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request):
        user = request.user
        data = request.data
        category = data.get("category", None)
        imprimis_job_ids = data.get("external_job_ids")
        company_id = request.user.location_id.company_id
        if not data.get("external_job_ids"):
            return Response(
                {"error": "External Job Ids Missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        template = {}
        if company_id.name == "Imprimis Group":
            job_postings = []
            job_skills = []
            for job_id in imprimis_job_ids:
                response = get_imprimis_specific_job(job_id)
                if response:
                    job_data = response.get("data")
                    corelation_id = str(uuid4())
                    job_data.update({"corelation_id": corelation_id})
                    job_postings.append(job_posting(job_data))
                    if job_posting_skills(job_data):
                        job_skills.append(job_posting_skills(job_data))
                    template["company_id"] = company_id.id
                    industry_name = data.get("category", None)
                    job_title = job_data.get("title", None)
                    skill = job_skills
                    description = job_data.get("description", None)
                    industry_id = get_industry_id(category)
                    description = clean_html(description)
                    response = create_job_posting_template(
                        job_title, skill, description, industry_id, template["company_id"]
                    )

            return Response(
                {"message": "Job Templates Created Successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Invalid Company for External Job Sync"},
            status=status.HTTP_406_NOT_ACCEPTABLE,
        )