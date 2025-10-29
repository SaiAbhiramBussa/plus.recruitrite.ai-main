import json

from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse

from candidate.services import upload_profile_picture
from .services import update_kanban_board_config, full_service, upload_company_picture
from candidate.models import Candidate
from company.serializers import CompanyForAdminSerializer, AdminCreateCompanySerializer, AdminGetCompanySerializer, \
    ImportStatsSerializer, IndustrySerializer
from company.models import Location, Company, Follows, KanbanBoard, Subscription, Industry, ImportStats
from accounts.models import User
from job_posting.models import JobPosting, JobPostingSkill
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.core.paginator import Paginator
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import AdminPermission, JobSeekerPermission, EmployerPermission, \
    EmployerSpecificObjectPermission
from django.db import connection


class CompanyJobFetchingSerializer(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, id):
        company = Company.objects.get(id=id)
        location_ids = Location.objects.filter(company_id=id).values_list('id', flat=True)
        job_posting = JobPosting.objects.filter(location_id__in=location_ids, status='active')
        jobs_list = []

        for job in job_posting:
            skills_list = []
            job_posting_skills = JobPostingSkill.objects.filter(job_posting_id=job)
            for skill_data in job_posting_skills:
                skill = skill_data.skill_id
                skills_list.append({
                    'id': skill.id,
                    'name': skill.name
                })
            location = job.location_id
            job_data = {'id': job.id, 'company_id': id, 'company_name': company.name, 'company_logo': company.logo,
                        'location_id': str(location.id),
                        'state': job.state, 'job_id': job.id, 'title': job.title, 'compensation': job.compensation,
                        'work_location_type': job.work_location_type,
                        'remote_type': job.remote_type, 'description': job.description, 'skills': skills_list}
            if request.user.role in ['admin','employer','hiring_manager']:
                subscription = Subscription.objects.filter(job_posting_id_id=job.id).first()
                subscription_type = None
                if subscription:
                    subscription_type = subscription.type
                job_data.update({'subscription_type': subscription_type, 'minimum_match': job.minimum_match})
            jobs_list.append(job_data)
        return Response(jobs_list, content_type="application/json")

class CompanySpecificJobFetchingSerializer(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, id, job_id):
        company = Company.objects.get(id=id)
        location_ids = Location.objects.filter(company_id=id).values_list('id', flat=True)
        job = JobPosting.objects.filter(location_id__in=location_ids, id=job_id, status='active').first()
        
        if not job:
            return Response({"Error": "Job Not Found"}, status=status.HTTP_404_NOT_FOUND)

        skills_list = []
        job_posting_skills = JobPostingSkill.objects.filter(job_posting_id=job)
        
        for skill_data in job_posting_skills:
            skill = skill_data.skill_id
            skills_list.append({
                'id': skill.id,
                'name': skill.name
            })
            
        location = job.location_id
        job_data = {'id': job.id, 'company_id': id, 'company_name': company.name, 'company_logo': company.logo,
                    'location_id': str(location.id),
                    'state': job.state, 'job_id': job.id, 'title': job.title, 'compensation': job.compensation,
                    'work_location_type': job.work_location_type,
                    'remote_type': job.remote_type, 'description': job.description, 'skills': skills_list}
        
        if request.user.role == 'admin':
            subscription = Subscription.objects.filter(job_posting_id_id=job.id).first()
            subscription_type = None
            if subscription:
                subscription_type = subscription.type
            job_data.update({'subscription_type': subscription_type, 'minimum_match': job.minimum_match})

        return Response(job_data, content_type="application/json")

class SpecificCompanyView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        if self.request.method == 'PATCH':
            return [EmployerSpecificObjectPermission()]
        return [AdminPermission()]

    def get(self, request, company_id):
        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({"Error": "Company Not Found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminGetCompanySerializer(instance=company, many=False)
        return Response(serializer.data, content_type="application/json")

    def patch(self, request, company_id):
        data = request.data
        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({"Error": "Company Not Found"}, status=status.HTTP_404_NOT_FOUND)
        if data['industry']:
            industry = Industry.objects.get_or_create(title=data['industry'])[0]
            data.update({'industry_id': industry.id})
        company_serializer = AdminCreateCompanySerializer(company, data=data, partial=True)
        if company_serializer.is_valid():
            company_serializer.save()
            return Response({"Message": "Company Updated Successfully"}, status=status.HTTP_200_OK)
        return Response(company_serializer.errors, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def delete(self, request, company_id):
        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({"Error": "Company Not Found"}, status=status.HTTP_404_NOT_FOUND)
        company.delete()
        return Response({"Message": "Company Deleted Successfully"}, status=status.HTTP_200_OK)


class CompanyBaseView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [AdminPermission()]

    def post(self, request):
        data = request.data
        company = Company.objects.filter(name=data['name']).first()
        if company:
            return Response({"Error": "Company with Same name already exists"},
                            status=status.HTTP_405_METHOD_NOT_ALLOWED)
        industry = Industry.objects.filter(title=data['industry']).first()
        if not industry:
            return Response({"Error": "Industry Title is invalid"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        elif not company:
            if data['is_full_service']:
                data.update({'subscription_type': 'full_service'})
            if data['industry']:
                industry = Industry.objects.get_or_create(title=data['industry'])[0]
                data.update({'industry_id': industry.id})
            data.update({'created_by': request.user.id})
            company_serializer = AdminCreateCompanySerializer(data=data)
            if company_serializer.is_valid():
                company_serializer.save()
                return Response(company_serializer.data, status=status.HTTP_200_OK)
            return Response(company_serializer.errors, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        query = request.query_params.get('query')
        if query:
            companies_dataset = Company.objects.filter(name__istartswith=query).order_by('name', '-created_at', '-updated_at')
        elif not query:
            companies_dataset = Company.objects.all().order_by('-created_at', '-updated_at')
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(companies_dataset, per_page)
        companies = paginator.get_page(page_number)
        companies_data = []
        for company in companies:
            location_data = Location.objects.filter(company_id=company).values_list('id', flat=True)
            job_postings = JobPosting.objects.filter(location_id__in=location_data, status='active')
            c_obj = {'id': str(company.id), 'name': company.name, 'logo': company.logo, 'jobs_count': len(job_postings),
                     'created_date': company.created_at, 'industry': company.industry_id.title if company.industry_id else None}
            companies_data.append(c_obj)
        context = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "companies_data": companies_data,
        }
        return Response(context, content_type="application/json")


class CompanyAndJobsForCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerPermission,)

    def get(self, request):
        search_company = request.query_params.get('search_company')

        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        if not page_number:
            page_number = 1

        if not search_company:
            search_company = ''
        count_query = '''
                    Select Count(*) as total_count FROM ( Select distinct c.name as company_name, c.id as company_id from company as c inner join
                location as l on l.company_id_id = c.id inner join job_posting as jp on jp.location_id_id = l.id where Lower(c.name) like %s) as subquery
        '''
        with connection.cursor() as cursor:
            cursor.execute(count_query, ('%' + search_company + '%',))
            count_set = cursor.fetchall()
        query = '''
                Select distinct c.name as company_name, c.id as company_id from company as c inner join
                location as l on l.company_id_id = c.id inner join job_posting as jp on jp.location_id_id = l.id where Lower(c.name) like %s
                '''
        with connection.cursor() as cursor:
            cursor.execute(query, ('%' + search_company + '%',))
            result_set = cursor.fetchall()

        company_job_postings = []
        for row in result_set:
            job_postings_data = []
            location_ids = Location.objects.filter(company_id=row[1]).values_list('id', flat=True)
            job_postings = JobPosting.objects.filter(location_id__in=location_ids).order_by('-created_at')
            job_postings_trim = job_postings[:5]
            for jp in job_postings_trim:
                job_posting = {
                    'job_posting_id': str(jp.id),
                    'title': jp.title,
                    'state': jp.state,
                    'city': jp.city,
                }
                job_postings_data.append(job_posting)
            company_job_posting_data = {
                'company_id': row[1],
                'company_name': row[0],
                'total_job_postings': job_postings.count(),
                'job_postings': job_postings_data,
            }
            company_job_postings.append(company_job_posting_data)
        return Response(company_job_postings, content_type="application/json")


class IndustriesList(APIView):
    def get(self, request):
        industries = Industry.objects.all()
        industries_list = [{'key': str(industry.id), 'value': industry.title} for industry in industries]
        return Response(industries_list, status=status.HTTP_200_OK)
    def post(self, request):
        data = request.data
        industry = Industry.objects.filter(title=data.get("title")).first()
        if not industry:
            Industry.objects.create(title=data.get('title'))
            return Response({"Message": "Industry added successfully"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"Message": "Industry already exists"}, status=status.HTTP_400_BAD_REQUEST)


class KanbanBoardConfig(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id):
        board_stages = KanbanBoard.objects.filter(company_id_id=company_id).order_by('order')
        stage_data = []
        for stage in board_stages:
            context = {
                'stage_id': stage.id,
                'stage_name': stage.stage_name,
                'stage_order': stage.order
            }
            stage_data.append(context)
        return Response(stage_data, content_type="application/json")

    def put(self, request, company_id):
        resp = update_kanban_board_config(request, company_id)
        return Response(resp, content_type="application/json")


class FullService(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def patch(self, request):
        params = request.data
        response = full_service(params)
        if response.get("status_code") == 200:
            return Response(response, content_type="application/json")
        else:
            return JsonResponse(response, status=response.get("status_code"))


class CompanyResourceInformation(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        users_data = []
        locations_data = []
        company = Company.objects.get(id=id)
        locations = Location.objects.filter(company_id=company)
        users = User.objects.filter(location_id__in=locations)
        for user in users:
            user_data = {
                'user_id': str(user.id),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'picture': user.picture,
                'created_at': user.created_at
            }
            location = user.location_id
            location_data = {
                'location_id': str(location.id),
                'address': location.address,
                'city': location.city,
                'state': location.state,
            }
            users_data.append(user_data)
            locations_data.append(location_data)
        context = {
            'company_id': str(company.id),
            'company_name': company.name,
            'description': company.description,
            'logo': company.logo,
            'subscription_type': company.subscription_type,
            'users': users_data,
            'locations': locations_data
        }
        return Response(context, content_type="application/json")


class ImportStatsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request):
        try:
            dataset = ImportStats.objects.all().order_by('-created_at')
            page_number = request.query_params.get('page')
            per_page = request.query_params.get('per_page')
            if not per_page:
                per_page = 50
            paginator = Paginator(dataset, per_page)
            stats = paginator.get_page(page_number)
            serializer = ImportStatsSerializer(instance=stats, many=True)
            response = {
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_number,
                "per_page": per_page,
                "import_stats": serializer.data,
            }
            return Response(response, content_type='application/json')
        except:
            return Response({'error': 'Something went wrong'}, status=status.HTTP_400_BAD_REQUEST)


class CompanyUploadsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request, company_id):
        data = request.data
        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({'Error': 'Invalid Company ID'}, status=status.HTTP_400_BAD_REQUEST)
        if 'logo' in data:
            file = request.data.get('logo')
            if not file:
                return Response(status=status.HTTP_404_NOT_FOUND)
            response = upload_company_picture(file, company)
            return response
        return Response(status=status.HTTP_400_BAD_REQUEST)

