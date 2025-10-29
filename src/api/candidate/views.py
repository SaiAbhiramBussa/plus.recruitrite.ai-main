from datetime import date, datetime
import json, os, shutil, tempfile
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from accounts.serializers import UserCandidateProfileViewSerializer
from accounts.services import StartdateTokenAuthentication, IntegrationKeyAuthentication, get_employee_credits
from candidate.models import Candidate, CandidateEducationHistory, CandidateAttributes, CandidateWorkHistory, \
    CandidateSkill, CandidateMaskSettings, UnmaskedCandidateJobPosting, Resumes
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from company.models import Company, Location, Follows, Subscription
from candidate.aws import upload_to_aws, client_s3, upload_image_from_link
from celery_jobs.serializers import BackgroundJobSerializer
from job_posting.models import JobPosting, Skill, JobPostingCandidate, JobPostingReveals
from job_posting.permissions import AdminPermission, EmployerPermission, JobSeekerPermission, \
    EmployerSpecificObjectPermission, JobSeekerSpecificObjectPermission
from celery_jobs.models import ApolloJobs, ApolloJobRecords
from celery_jobs.serializers import ApolloJobsBackgroundSerializer
from machine_learning.services import complete_candidate_data
from .services import apollo_search_api_calling_method, label_search_api, upload_profile_picture, upload_resume, \
    candidate_search_query_in_multiple_tables, fetch_ai_candidates, fetch_sourced_candidates, CandidateResumeParser, \
    save_candidate, get_candidates, update_candidate, delete_candidate, apollo_contact_api_method, \
    job_posting_match_skill, check_cpws_candidate, check_optional, download_unmasked_candidates
from django.core.paginator import Paginator
from django.db import transaction
from candidate.serializers import CandidateProfileViewSerializer, CandidateAttributesProfileViewSerializer, \
    CandidateEducationHistoryProfileViewSerializer, CandidateWorkHistoryProfileViewSerializer, \
    CandidateMaskSettingsSerializer
from django.conf import settings
from startdate import settings
from django.http import HttpResponse
from decouple import config
from payment_history.services import validate_screening_records_left

PROFILE_PICTURE_BUCKET = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME
RESUME_BUCKET = settings.AWS_RESUME_STORAGE_BUCKET_NAME
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
EMAIL_CLIENT = settings.EMAIL_CLIENT


class UploadFileView(generics.UpdateAPIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        file = "candidates/" + request.FILES.get('file').name
        res = upload_to_aws(request.FILES.get('file'),
                            settings.AWS_STORAGE_BUCKET_NAME, file)
        if res['ResponseMetadata']['HTTPStatusCode'] == 200:
            data = {
                'name': "candidate_import",
                'key': file,
                'status': "pending"
            }
            bg_serializer = BackgroundJobSerializer(data=data)
            if bg_serializer.is_valid():
                bg_serializer.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class FetchSpecificRecommendedCandidate(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, job_posting_id, candidate_id):
        jp_candidate = None
        if Subscription.objects.filter(job_posting_id_id=job_posting_id).exists():
            jp_candidate = JobPostingCandidate.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).first()
        else:
            jp_reveal = JobPostingReveals.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).first()
            
            if jp_reveal:
                jp_candidate = JobPostingCandidate.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id).first()
            else:
                jp_candidate = JobPostingCandidate.objects.filter(job_posting_id_id=job_posting_id, candidate_id_id=candidate_id, source="applied").first()

        if jp_candidate:
            complete_candidate = complete_candidate_data(jp_candidate.candidate_id)
            complete_candidate.update({'job_posting_candidate_id': str(jp_candidate.id),
                                       'accuracy': jp_candidate.accuracy, 'is_revealed': True})
            recommended_skill = job_posting_match_skill(jp_candidate.candidate_id.id, job_posting_id, False)
            if recommended_skill:
                complete_candidate.update({'recommended_skill': recommended_skill})

            return Response(complete_candidate, content_type="application/json")
        return Response({'error': 'Invalid Candidate ID'}, status=status.HTTP_400_BAD_REQUEST)


class FetchRecommendedCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, job_posting_id):
        if Subscription.objects.filter(job_posting_id_id=job_posting_id).exists():
            response = fetch_sourced_candidates(request, job_posting_id)
        else:
            response = fetch_ai_candidates(request, job_posting_id)
        return Response(response, content_type="application/json")
    

class DownloadUnmaskedRecommendedCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, job_posting_id):
        full_service = Subscription.objects.filter(job_posting_id_id=job_posting_id, type="full_service").exists()

        df = download_unmasked_candidates(job_posting_id, full_service)
        # print(df)
        temp_dir = tempfile.mkdtemp()
        csv_path = f'{temp_dir}/{job_posting_id}'
        os.mkdir(csv_path) 
        
        csv_file_path = f'{csv_path}/{job_posting_id}-{date.today()}.csv'
        df.to_csv(csv_file_path, index=False)
        response = HttpResponse(headers={'Access-Control-Expose-Headers': 'Content-Disposition', 'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="{job_posting_id}-{date.today()}.csv"'})

        with open(csv_file_path, 'rb') as csv_file:
            response.write(csv_file.read())

        os.unlink(csv_file_path)
        shutil.rmtree(temp_dir)

        return response


class ApolloLabelList(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request):
        try:
            response = label_search_api('accounts')
            return Response(response, content_type="application/json")
        except Exception as e:
            return Response({"Error": e}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ApolloBackgroundJobTotalCountCheck(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        data = request.data
        title_string = data['apollo_api_titles']
        location_string = data['apollo_api_locations']
        account_label_string = data['apollo_account_label_ids']
        page_number = data['page_number']
        apollo_data = apollo_search_api_calling_method(page_number, title_string, location_string, account_label_string)
        total_entries = apollo_data['pagination']['total_entries']
        total_pages = apollo_data['pagination']['total_pages']
        user_set_range = data['fetch_limit'] - data['page_number'] + 1
        if not total_pages < user_set_range:
            total_entries = user_set_range*100
        context = {
            'total_entries': total_entries,
            'total_pages_on_apollo': total_pages
        }
        return Response(context, status=status.HTTP_200_OK)


class ApolloJobsBackgroundTaskCrudApi(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)
    serializer_class = ApolloJobsBackgroundSerializer

    def post(self, request):
        data = request.data
        data.update({'created_by': request.user.id})
        data.update({'status': 'pending'})
        serializer = ApolloJobsBackgroundSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        try:
            data_set = ApolloJobs.objects.all().order_by('-created_at')
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(data_set, per_page)
        apollo_jobs = paginator.get_page(page_number)
        serializer = ApolloJobsBackgroundSerializer(data=apollo_jobs, many=True)
        serializer.is_valid()
        labels = label_search_api('accounts')
        labels = labels['labels']
        job_serializer_data = serializer.data
        try:
            for i in range(len(job_serializer_data)):
                name = None
                for label_data in labels:
                    if label_data['id'] == job_serializer_data[i]['apollo_account_label_ids']:
                        name = label_data['name']
                apollo_job_id = job_serializer_data[i]['id']
                job_serializer_data[i].update({'apollo_account_label_name': name})
                if ApolloJobRecords.objects.filter(apollo_job_id=apollo_job_id).exists():
                    data_records = ApolloJobRecords.objects.get(apollo_job_id=apollo_job_id)
                    job_serializer_data[i].update({'inserted_records': data_records.records_inserted})
                    job_serializer_data[i].update({'updated_records': data_records.records_updated})
                    job_serializer_data[i].update({'failed_records': data_records.records_failed})
                else:
                    job_serializer_data[i].update({'inserted_records': 0})
                    job_serializer_data[i].update({'updated_records': 0})
                    job_serializer_data[i].update({'failed_records': 0})
            response = {
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_number,
                "per_page": per_page,
                "apollo_jobs": job_serializer_data,
            }
            return Response(response, content_type='application/json')
        except Exception as e:
            return Response(serializer.data, content_type="application/json")

    def delete(self, request, id):
        try:
            ApolloJobRecords.objects.filter(apollo_job_id=id).delete()
            ApolloJobs.objects.filter(id=id).delete()
            return Response(status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, id):
        data = request.data
        job_entry = ApolloJobs.objects.get(id=id)
        serializer = ApolloJobsBackgroundSerializer(
            job_entry, data=data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)


class ApolloJobsBackgroundTaskGetById(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        try:
            data = ApolloJobs.objects.get(id=id)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

        context = {
            'id': id,
            'apollo_job': data.apollo_job,
            'api_key': data.api_key,
            'apollo_api_titles': data.apollo_api_titles,
            'apollo_api_locations': data.apollo_api_locations,
            'apollo_account_label_ids': data.apollo_account_label_ids,
            'page_number': data.page_number,
            'fetch_limit': data.fetch_limit,
            'status': data.status,
        }
        return Response(context, content_type="application/json")


class AdminCandidatesView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request):
        query_params = request.query_params
        keys = query_params.keys() - ['page', 'per_page', 'advanced_search']
        candidates_dataset = candidate_search_query_in_multiple_tables(query_params, keys)
        if request.query_params.get('title'):
            candidates_dataset = candidates_dataset.order_by('-candidateworkhistory__from_date', '-candidateworkhistory__to_date')
        candidates_dataset_excluded_ai = candidates_dataset.exclude(ai_candidate_id__isnull=False)
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 30
        paginator = Paginator(candidates_dataset_excluded_ai, per_page)
        candidates_data = paginator.get_page(page_number)
        candidate_obj = []
        for candidate in candidates_data:
            complete_candidate = complete_candidate_data(candidate)
            complete_candidate.update({"is_revealed": True, 'source': candidate.source})
            if candidate.source == 'Gen_ai':
                original_candidate = candidates_dataset.filter(ai_candidate_id=candidate.id).first()
                if original_candidate:
                    complete_candidate.update({'original_candidate_id': str(original_candidate.id)})
            candidate_obj.append(complete_candidate)
        context = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "candidates_data": candidate_obj
        }
        return Response(context, content_type="application/json")


class CandidateProfileView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerPermission,)

    def get(self, request):
        candidate_data = Candidate.objects.get(user_id_id=request.user.id)
        complete_candidate = complete_candidate_data(candidate_data)
        stage = check_cpws_candidate(candidate_data)
        optional = check_optional(complete_candidate)
        percentage = 0
        for i in range(len(stage)):
            percentage = (percentage + 25) if stage[i] == '1' else percentage
        completion_flags = {
            'contact': True if stage[0] == '1' else False,
            'summary': True if stage[1] == '1' else False,
            'work_history': True if stage[2] == '1' else False,
            'skills': True if stage[3] == '1' else False,
            'resume': True if optional[0] == '1' else False,
            'linked_in': True if optional[1] == '1' else False,
        }
        complete_candidate.update({'completion_percentage': percentage, 'completion_stage': completion_flags})
        return Response(complete_candidate, content_type="application/json")

    def patch(self, request):
        data = request.data
        candidate_data = Candidate.objects.get(user_id_id=request.user.id)
        try:
            with transaction.atomic():
                user_serializer = UserCandidateProfileViewSerializer(request.user, data=data, partial=False)
                user_serializer.is_valid()
                user_serializer.save()

                candidate_serializer = CandidateProfileViewSerializer(candidate_data, data=data, partial=False)
                candidate_serializer.is_valid()
                candidate_serializer.save()

                candidate_attribute = CandidateAttributes.objects.get(id=data['address']['id'])
                candidate_attribute_serializer = CandidateAttributesProfileViewSerializer(candidate_attribute, data=data['address'], partial=False)
                candidate_attribute_serializer.is_valid()
                candidate_attribute_serializer.save()

                for skill_object in data['skills']:
                    skill = Skill.objects.get_or_create(name=skill_object['skill'])[0]
                    candidate_skill = CandidateSkill.objects.filter(candidate_id_id=candidate_data.id, skill_id_id=skill.id)
                    if 'is_deleted' in skill_object and skill_object.get('is_deleted'):
                        candidate_skill.delete()
                    if skill_object.get('candidate_skill_id') is None:
                        CandidateSkill.objects.create(candidate_id_id=candidate_data.id, skill_id_id=skill.id)

                for work_history in data['work_history']:
                    candidate_work_history = CandidateWorkHistory.objects.filter(id=work_history['id'])
                    if 'is_deleted' in work_history and work_history.get('is_deleted'):
                        candidate_work_history.delete()
                    if 'is_deleted' not in work_history:
                        if candidate_work_history.exists():
                            company = Company.objects.get_or_create(name=work_history['company'])[0]
                            work_history.update({'company_id': company.id, 'candidate_id': candidate_data.id})
                            candidate_work_history_serializer = CandidateWorkHistoryProfileViewSerializer(candidate_work_history.first(), data=work_history, partial=False)
                        elif work_history['id'] is None:
                            company = Company.objects.get_or_create(name=work_history['company'])[0]
                            work_history.update({'company_id': company.id, 'candidate_id': candidate_data.id})
                            candidate_work_history_serializer = CandidateWorkHistoryProfileViewSerializer(data=work_history)
                        candidate_work_history_serializer.is_valid()
                        candidate_work_history_serializer.save()


                for education_history in data['education_history']:
                    candidate_education_history = CandidateEducationHistory.objects.filter(id=education_history['id'])
                    if 'is_deleted' in education_history and education_history['is_deleted']:
                        candidate_education_history.delete()
                    if 'is_deleted' not in education_history:
                        if candidate_education_history.exists():
                            education_history.update({'candidate_id': candidate_data.id})
                            candidate_education_history_serializer = CandidateEducationHistoryProfileViewSerializer(candidate_education_history.first(), data=education_history, partial=False)
                        elif education_history['id'] is None:
                            education_history.update({'candidate_id': candidate_data.id})
                            candidate_education_history_serializer = CandidateEducationHistoryProfileViewSerializer(data=education_history)
                        candidate_education_history_serializer.is_valid()
                        candidate_education_history_serializer.save()
            complete_candidate = complete_candidate_data(candidate_data)
            return Response(complete_candidate, status=status.HTTP_200_OK)
        except Exception as e:
            print("Exception ------------------------------",e)
            return Response({"Error Message": f"Please Try Again Later {e}"}, status=status.HTTP_400_BAD_REQUEST)


class CandidateResourceUploadsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def post(self, request, candidate_id):
        data = request.data
        candidate_data = Candidate.objects.get(id=candidate_id)
        if 'profile_picture' in data:
            file = request.data.get('profile_picture')
            if not file:
                return Response(status=status.HTTP_404_NOT_FOUND)
            response = upload_profile_picture(file, candidate_data)
            return response
        elif 'resume' in data:
            file = request.data.get('resume')
            if not file:
                return Response(status=status.HTTP_404_NOT_FOUND)
            response = upload_resume(file, candidate_data)
            return response
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, candidate_id):
        resume_type = request.query_params.get('type')
        if resume_type in ['video', 'doc']:
            resume = Resumes.objects.filter(type=resume_type, candidate_id_id=candidate_id).first()
            if not resume:
                return Response({"Error": "Resume Not Found. "}, status=status.HTTP_400_BAD_REQUEST)
            client_s3.delete_object(Bucket=RESUME_BUCKET, Key=resume.key)
            resume.delete()
            return Response({"Message": "Resume deleted"}, status=status.HTTP_200_OK)
        else:
            return Response({"Error": "Please mention the correct type of resume. "}, status=status.HTTP_400_BAD_REQUEST)




class CandidateFollowView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerPermission,)

    def post(self, request):
        data = request.data
        candidate_data = Candidate.objects.get(user_id_id=request.user.id)
        if 'follow_type' in data and data['followed_ids']:
            duplicate = 0
            follow_list = []
            for follow_data in data['followed_ids']:
                follow_created, flag = Follows.objects.get_or_create(follow_type=data['follow_type'], follow_id=follow_data, candidate_id=candidate_data)
                follow_list.append({'follow_id': str(follow_created.id), 'followed_id': str(follow_created.follow_id)})
                if not flag:
                    duplicate = duplicate + 1
            context = {
                "total_count": len(data['followed_ids']),
                "duplicates": duplicate,
                "follows": follow_list
            }
            return Response(context, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        follow_type = request.query_params.get('follow_type')
        candidate_data = Candidate.objects.get(user_id_id=request.user.id)
        follows_list = []
        if follow_type == 'company':
            follows = Follows.objects.filter(candidate_id=candidate_data, follow_type='company')
            for follow in follows:
                company = Company.objects.get(id=follow.follow_id)
                locations = Location.objects.filter(company_id=company).values_list('id', flat=True)
                job_postings = JobPosting.objects.filter(location_id_id__in=locations, status='active')
                follows_list.append({
                    'id': str(follow.id),
                    'follow_type': follow.follow_type,
                    'followed_id': str(follow.follow_id),
                    'followed_company': company.name,
                    'locations': locations.count(),
                    'jobs_count': job_postings.count()
                })
        if follow_type == 'job_posting':
            follows = Follows.objects.filter(candidate_id_id=candidate_data, follow_type='job_posting')
            for follow in follows:
                job_posting = JobPosting.objects.get(id=follow.follow_id)
                company = job_posting.location_id.company_id
                follows_list.append({
                    'id': str(follow.id),
                    'follow_type': follow.follow_type,
                    'followed_id': str(follow.follow_id),
                    'followed_title': job_posting.title,
                    'followed_job_company': company.name
                })

        return Response(follows_list, content_type="application/json")

    def delete(self, request):
        candidate_data = Candidate.objects.get(user_id_id=request.user.id)
        follow_ids = request.data['follow_ids']
        found = Follows.objects.filter(id__in=follow_ids, candidate_id=candidate_data)
        if len(found) != 0:
            deleted = len(found)
            found.delete()
            context = {
                "message": "Unfollowed Successfully",
                "total_count": len(follow_ids),
                "unfollowed": deleted
            }
            return Response(context, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_404_NOT_FOUND)


class CandidateChromeExtensionImport(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        data = request.data
        profile_link = data['profile']
        if profile_link[len(profile_link)-1] == '/':
            profile_link = profile_link[:-1]
        profile_link = profile_link.split('/')[-1]
        candidate = Candidate.objects.filter(profile__icontains=profile_link).first()
        if not (candidate and candidate.email):
            try:
                contact = apollo_contact_api_method(data['profile'], data['html'])
                data.update({'email': contact['contact'].get('email')})
            except:
                pass
        try:
            with transaction.atomic():
                if candidate:
                    del data['first_name']
                    candidate_serializer = CandidateProfileViewSerializer(candidate, data=data, partial=True)
                else:
                    data.update({"source": "ChromeExt"})
                    candidate_serializer = CandidateProfileViewSerializer(data=data)
                if candidate_serializer.is_valid():
                    candidate = candidate_serializer.save()
                file_key = f'candidates/{str(candidate.id)}'
                try:
                    response = upload_image_from_link(PROFILE_PICTURE_BUCKET, file_key, data['picture'])
                    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                        candidate.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
                        candidate.save()
                except:
                    pass
                candidate_attribute = CandidateAttributes.objects.filter(candidate_id=candidate).first()
                if candidate_attribute and "address" in data:
                    candidate_attribute_serializer = CandidateAttributesProfileViewSerializer(candidate_attribute, data=data['address'], partial=False)
                else:
                    if "address" in data:
                        data['address']['candidate_id'] = str(candidate.id)
                        candidate_attribute_serializer = CandidateAttributesProfileViewSerializer(data=data['address'])
                        if candidate_attribute_serializer.is_valid():
                            candidate_attribute_serializer.save()
                for skill_object in data['skills']:
                    skill = Skill.objects.get_or_create(name=skill_object)[0]
                    candidate_skill = CandidateSkill.objects.get_or_create(candidate_id_id=candidate.id, skill_id_id=skill.id)[0]
                for work_history in data['work_history']:
                    try:
                        company = Company.objects.get_or_create(name=work_history['company'])[0]
                        location = Location.objects.get_or_create(company_id=company, address=work_history['location']['address'])[0]
                        try:
                            datetime.strptime(work_history['from_date'], '%Y-%m-%d')
                            from_date = datetime.strptime(work_history['from_date'], '%Y-%m-%d')
                        except:
                            from_date = None
                        try:
                            datetime.strptime(work_history['to_date'], '%Y-%m-%d')
                            to_date = datetime.strptime(work_history['to_date'], '%Y-%m-%d')
                        except:
                            to_date = None
                        history_object = CandidateWorkHistory.objects.filter(title=work_history['title'], candidate_id=candidate, company_id=company).first()
                        work_description = ''
                        if 'description' in work_history:
                            work_description = work_history['description']
                        if history_object:
                            with transaction.atomic():
                                history_object.from_date = from_date
                                history_object.to_date = to_date
                                history_object.description = work_description
                                history_object.location_id = location
                                history_object.save()
                        else:
                            CandidateWorkHistory.objects.create(title=work_history['title'], candidate_id=candidate, company_id=company, from_date=from_date,
                                                                to_date=to_date, description=work_description, location_id=location)
                    except Exception as e:
                        print(e)
                for education_history in data['education_history']:
                    education_object = CandidateEducationHistory.objects.filter(name=education_history['name'], candidate_id=candidate, degree=education_history['degree']).first()
                    try:
                        datetime.strptime(education_history['from_date'], '%Y-%m-%d')
                        from_date = datetime.strptime(education_history['from_date'], '%Y-%m-%d')
                    except:
                        from_date = None
                    try:
                        datetime.strptime(education_history['to_date'], '%Y-%m-%d')
                        to_date = datetime.strptime(education_history['to_date'], '%Y-%m-%d')
                    except:
                        to_date = None
                    if education_object:
                        education_object.from_date = from_date
                        education_object.to_date = to_date
                        education_object.save()
                    else:
                        CandidateEducationHistory.objects.create(name=education_history['name'], candidate_id=candidate, degree=education_history['degree'], from_date=from_date, to_date=to_date)
                return Response(status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        mail_data = {}
        subject_data = {}
        email_body = render_to_string("chrome_extension_alert.html", mail_data)
        subject = render_to_string("extension_alert_subject.txt", subject_data)
        to_email = 'employer@navtech.io'
        message = {
            "senderAddress": DEFAULT_EMAIL,  
            "recipients": {
                "to": [{"address": to_email}]
            },
            "content": {
                "subject": subject,
                "html": email_body
            }
        }
        EMAIL_CLIENT.begin_send(message)
        return Response(status=status.HTTP_200_OK)


class CandidateResumeView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        response = CandidateResumeParser(request)

        if not isinstance(response,dict):
            return Response({"error":json.dumps(str(response))}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(response, status=status.HTTP_200_OK)
        

class CandidateView(APIView):
    authentication_classes = (StartdateTokenAuthentication, IntegrationKeyAuthentication,)

    def get_authenticators(self):
        if self.request.method == 'DELETE':
            return [StartdateTokenAuthentication()]
        else:
            return super().get_authenticators()

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [AdminPermission()]
        else:
            return [EmployerPermission()]

    def post(self, request):
        response = save_candidate(request.data)

        return response
    
    def get(self, request, id):
        response = get_candidates(id)

        return response

    def put(self, request, id):
        data = request.data
        required_keys = ['address','skills','email','phone_code','phone','first_name','last_name','education_history','work_history']
        missing_keys = [key for key in required_keys if key not in data]

        if missing_keys:
            message = {'Error': f'Missing required columns: {", ".join(missing_keys)}'}
            return Response(message, status=400)
        
        response = update_candidate(data,id)

        return response
    
    def delete(self, request, id):
        response = delete_candidate(id)

        return response


class CandidateMaskSettingsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, candidate_id):
        mask_settings = CandidateMaskSettings.objects.filter(candidate_id_id=candidate_id).first()
        serializer = CandidateMaskSettingsSerializer(instance=mask_settings, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, candidate_id):
        mask_settings = CandidateMaskSettings.objects.filter(candidate_id_id=candidate_id).first()
        serializer = CandidateMaskSettingsSerializer(instance=mask_settings, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_200_OK)

    def post(self, request, candidate_id):
        mask_settings = CandidateMaskSettings.objects.filter(candidate_id_id=candidate_id).first()
        if not mask_settings:
            mask_settings = CandidateMaskSettings.objects.create(candidate_id_id=candidate_id)
        mask_settings.is_active = True
        mask_settings.save()
        serializer = CandidateMaskSettingsSerializer(instance=mask_settings, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CandidateRevealView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, candidate_id, job_posting_id):
        unmasked = UnmaskedCandidateJobPosting.objects.filter(candidate_id_id=candidate_id, job_posting_id_id=job_posting_id).first()
        if unmasked:
            return Response({'Message': 'Unmasked Candidate Job Posting Found'}, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_404_NOT_FOUND)

    def post(self, request, candidate_id, job_posting_id):
        unmasked = UnmaskedCandidateJobPosting.objects.filter(candidate_id_id=candidate_id,
                                                              job_posting_id_id=job_posting_id).first()
        if not unmasked:
            unmasked = UnmaskedCandidateJobPosting.objects.create(candidate_id_id=candidate_id,
                                                                  job_posting_id_id=job_posting_id)
        return Response(complete_candidate_data(unmasked.candidate_id), status=status.HTTP_200_OK)

class FetchCandidatesView(APIView):
    """
    This API will fetch the given number of employees for selected jobs 
    """
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def post(self, request):
        data = request.data
        PER_CANDIDATE_DEDUCTION = 50
        credits = 0
        num_of_candidates = data.get('candidates', 0)
        if request.user.role == "employer":
             company = request.user.location_id.company_id
             is_valid_subscription, credits = validate_screening_records_left(company)
        if request.user.role == "hiring_manager":
            credits = get_employee_credits(request.user.id)
        if credits < PER_CANDIDATE_DEDUCTION * num_of_candidates:
            return Response({"error": "You don't have enough credits to fetch candidates"}, status=status.HTTP_400_BAD_REQUEST)
        jobs_ids = data.get('job_ids', [])
        for job_id in jobs_ids:
            job_data = JobPosting.objects.filter(id=job_id).first()
            if job_data:
                ApolloJobs.objects.create(page_number=1, fetch_limit=num_of_candidates, status='pending',job=job_data, created_by=request.user)
        return Response({"message": "Fetching candidates for the selected jobs"}, status=status.HTTP_200_OK)

