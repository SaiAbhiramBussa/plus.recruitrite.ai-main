import requests
import tempfile
from django.conf import settings
from datetime import date

from accounts.models import User
from job_posting.models import JobPostingCandidate, JobPostingReveals, JobPostingCandidateSkill, Skill, JobPosting, JobPostingSkill
from machine_learning.models import MLProcess
from machine_learning.services import complete_candidate_data, PdfScraperOpenAi, applied_candidate_data, candidate_push_ml
from payment_history.services import masked_candidate_data
from candidate.classes.AdvancedSearchCandidate import AdvancedSearchCandidate
from .models import Candidate, CandidateAttributes, CandidateWorkHistory, Resumes, CandidateSkill, \
    CandidateEducationHistory, UnmaskedCandidateJobPosting
from company.models import Company, KanbanBoard, Location
from rest_framework.response import Response
from candidate.aws import client_s3, get_presigned_url, upload_image_from_link, check_location_through_amazon_location
from candidate.serializers import CandidateProfileViewSerializer, CandidateAttributesProfileViewSerializer, CandidateEducationHistoryProfileViewSerializer, CandidateWorkHistoryProfileViewSerializer
from rest_framework import status
from datetime import datetime
from django.db.models import Q
from django.core.paginator import Paginator
from dateutil import parser
from decouple import config
from payment_history.services import validate_screening_records_left, reveal_candidate_and_update_subscription, all_valid_subscriptions
from accounts.services import get_employee_credits
import pandas as pd
import json, random, re
from celery_jobs.models import ApolloJobs


APOLLO_API_KEY = settings.APOLLOIO_API_KEY
RESUME_BUCKET = settings.AWS_RESUME_STORAGE_BUCKET_NAME
PROFILE_PICTURE_BUCKET = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME
API_KEY = config('API_KEY')
#IMAGES_BUCKET_NAME = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME


def apollo_search_api_calling_method(page_number, title_string, location_string, account_label_string, job_id=None, limit=None, apollo_id=None):
    if not job_id:
        url = "https://api.apollo.io/v1/mixed_people/search"
        if title_string:
            if "," in title_string:
                title_string = title_string.split(',')
            else:
                title_string = [title_string]
        if account_label_string:
            if "," in account_label_string:
                account_label_string = account_label_string.split(',')
            else:
                account_label_string = [account_label_string]
        if location_string:
            if "," in location_string:
                location_string = location_string.split(',')
            else:
                location_string = [location_string]

        data = {
            "api_key": APOLLO_API_KEY,
            "person_titles": title_string,
            "person_locations": location_string,
            "account_label_ids": account_label_string,
            "page": page_number,
            "per_page": 100
        }
        headers = {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, json=data)
        data = response.json()
        return data

    job_data = (JobPosting.objects.filter(id=job_id)
                .values('title', 'city', 'country', 'state', 'description', 'job_industry',
                     'work_location_type', 'remote_type').first())
    skills = JobPostingSkill.objects.filter(job_posting_id=job_id).values_list('skill_id__name', flat=True)
    work_location_type = job_data.get('work_location_type')
    remote_type = job_data.get('remote_type')
    location = f"{job_data.get('city')}, {job_data.get('state')}"
    country = f"{job_data.get('country')}"
    state = f"{job_data.get('state')}"
    city = f"{job_data.get('city')}"
    if work_location_type == "remote" and remote_type:
        if remote_type == "state":
            location = f"{state}"
        if remote_type == "country":
            location = ""
            country = f"{country}"
        if remote_type == "any_region":
            location = f"{city}, {state}"
            country = f"{country}"
    url = config("CORE_SIGNAL_URL")
    candidate_data_url = config('CORE_SIGNAL_CANDIDATE_URL')
    candidate_multisource_url = config("CORE_SIGNAL_MULTISOURCE_CANDIDATE_URL")
    payload = json.dumps({
        "location": location,
        "title": job_data.get('title'),
        "skill": " OR ".join(skills) if len(skills) > 1 else skills[0],
        "summary": " OR ".join(skills) if len(skills) > 1 else skills[0],
        "experience_title": job_data.get('title'),
        "country": country,
        "keyword": " OR ".join(skills) if len(skills) > 1 else skills[0],
        "experience_company_industry": job_data.get('job_industry'),
        #"active_experience": true,
    })
    headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    }
    try:
        candidates_data = {"people":[]}
        response = requests.request("POST", url, headers=headers, data=payload)
        candidate_ids = response.json() 
        if not candidate_ids:
            return {"people": []}
        if len(candidate_ids) <= limit:
            random_candidates = candidate_ids
        else:
            random_candidates = random.sample(candidate_ids, limit)
        for candidate_id in random_candidates:
            candidate_data_api = f"{candidate_data_url}/{candidate_id}"
            response = requests.request("GET", candidate_data_api, headers=headers)
            candidate = response.json() 
            response_2 = requests.request("GET", f"{candidate_multisource_url}/{candidate_id}", headers=headers)
            response_2_data = response_2.json()
            primary_email = response_2_data.get("primary_professional_email", "")
            candidate["email"] = primary_email
            candidates_data["people"].append(candidate)
    except Exception as e:
        print(str(e))
        if(job_id and apollo_id):
            apollo_obj = ApolloJobs.objects.get(id=apollo_id)
            apollo_obj.status = 'failed'
            apollo_obj.save()

    return candidates_data


def label_search_api(label_modality):
    url = "https://app.apollo.io/api/v1/labels/search"
    data = {
        "api_key": APOLLO_API_KEY,
        "label_modality": label_modality,
        "per_page": 200
    }
    headers = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", url, headers=headers, json=data)
    data = response.json()
    return data

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile("<.*?>")  # Regex to identify HTML tags
    cleantext = re.sub(cleanr, "", raw_html)  # Remove HTML tags
    cleantext = re.sub(
        r'\sstyle="[^"]+"', "", cleantext, flags=re.I
    )  # Remove inline CSS (case insensitive)
    return cleantext

def validate_and_format_date(date_str):
    """
    Validates and converts a date string to YYYY-MM-DD format.
    If the date is None or not in a recognized format, it returns None.
    """
    if not date_str:
        return None  # Return None if the date is not provided

    try:
        if len(date_str) == 4 and date_str.isdigit():
            return f"{date_str}-01-01"
        # Check if the date is already in YYYY-MM-DD format
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str  # It's already valid
    except ValueError:
        # Attempt to parse and convert other formats
        try:
            return datetime.strptime(date_str, "%B %Y").strftime("%Y-%m-%d")  # e.g., "April 2022" -> "2022-04-01"
        except ValueError:
            try:
                return datetime.strptime(date_str, "%d %B %Y").strftime("%Y-%m-%d")  # e.g., "01 April 2022" -> "2022-04-01"
            except ValueError:
                return None  # Return None if all parsing attempts fail


def people_search_api_call(page_number, title_string, location_string, account_label_string, job_id=None, limit=None, created_by=None,apollo_id=None):
    data = apollo_search_api_calling_method(page_number, title_string, location_string, account_label_string, job_id, limit, apollo_id)
    created_count = 0
    updated_count = 0
    failed_count = 0

    if not data or not data.get('people'):
        counts = {
            'created_count': created_count,
            'updated_count': updated_count,
            'failed_count': failed_count,
            'people_empty': True,
        }
        if(job_id):
            apollo_obj = ApolloJobs.objects.get(id=apollo_id)
            apollo_obj.status = 'success'
            apollo_obj.save()
        return counts
    
    new_candidates = []
    for candidate in data['people']:
        try:
            for contact in candidate['phone_numbers']:
                phone = contact['sanitized_number']
        except:
            phone = ""

        first_name = candidate.get("first_name",'')
        f_name = ''
        l_name = ''
        if not first_name:
            if candidate.get("name"):
                parts = candidate.get("name").split(" ")
                f_name = parts[0]
                l_name = parts[1] if len(parts) > 1 else ""
        candidate_data = {
            'first_name': candidate.get('first_name','') if first_name else f_name,
            'last_name': candidate.get('last_name','') if first_name else l_name,
            'email': candidate.get('email',''),
            'profile': candidate.get('url','') if job_id else candidate['linkedin_url'],
            'picture': candidate.get('logo_url','') if job_id else candidate['photo_url'],
            'phone': phone,
            'summary': clean_html(candidate.get("summary",'')) if job_id else None,
            'source': "coresignal" if job_id else "Apollo",
            'external_id': candidate['id']
        }
        try:
            candidate_created = 'error_out'
            candidate_object, candidate_created = Candidate.objects.get_or_create(
                profile=candidate_data['profile'],  
                defaults=candidate_data  
            )
            if candidate_created and candidate_object.picture:
                file_key = f'candidates/{str(candidate_object.id)}'
                response = upload_image_from_link(PROFILE_PICTURE_BUCKET, file_key, candidate_object.picture)
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    candidate_object.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
                    candidate_object.save()
            
            candidate_id = candidate_object.id
            new_candidates.append(candidate_id)
            if candidate_created:
                created_count = created_count+1
            elif not candidate_created:
                updated_count = updated_count+1

            if not job_id:
                candidate_attributes_data = {
                    'city': candidate['city'],
                    'state': candidate['state'],
                    'country': candidate.get('country',''),
                    'candidate_id_id': candidate_id
                }
                candidate_attributes_object = CandidateAttributes.objects.get_or_create(**candidate_attributes_data)[0]
                for experience in candidate.get('employment_history'):
                    company_data = {
                        'name': experience['organization_name']
                    }
                    company_object = Company.objects.get_or_create(name=company_data['name'])[0]
                    company_object_id = company_object.id
                    candidate_work_history_data = {
                        'title': experience['title'],
                        'from_date': experience['start_date'],
                        'to_date': experience['end_date'],
                        'description': experience['description'],
                        'company_id_id': company_object_id,
                        'candidate_id_id': candidate_id
                    }
                    candidate_workhistory_object = CandidateWorkHistory.objects.get_or_create(**candidate_work_history_data)[0]
            else:
                location = candidate.get('location','')
                if location:
                    city,state,country = location.split(',')
                candidate_attributes_data = {
                    'address': candidate.get('location',''),
                    'city': city,
                    'state': state,
                    'country': candidate.get('country',''),
                    'candidate_id_id': candidate_id
                }
                candidate_attributes_object = CandidateAttributes.objects.get_or_create(**candidate_attributes_data)[0]
                for experience in candidate.get('member_experience_collection', []):
                    company_data = {
                        'name': experience['company_name']
                    }
                    company_object = Company.objects.get_or_create(name=company_data['name'])[0]
                    company_object_id = company_object.id
                    candidate_work_history_data = {
                        'title': experience.get('title'),
                        'from_date': validate_and_format_date(experience.get('date_from','')),
                        'to_date': validate_and_format_date(experience.get('date_to','')),
                        'description': clean_html(experience.get('description','')),
                        'company_id_id': company_object_id,
                        'candidate_id_id': candidate_id
                    }
                    unique_fields = {
                        'title': candidate_work_history_data['title'],
                        'company_id_id': candidate_work_history_data['company_id_id'],
                        'candidate_id_id': candidate_work_history_data['candidate_id_id'],
                        'from_date': candidate_work_history_data['from_date']
                    }

                    # Use `get_or_create` with `defaults` for the remaining fields
                    candidate_work_history_obj, is_workhistory_created = CandidateWorkHistory.objects.get_or_create(
                            **unique_fields,
                            defaults={
                                'to_date': candidate_work_history_data['to_date'],
                                'description': candidate_work_history_data['description']
                            }
                        )
                    # Get or create candidate work history object
                for education in candidate.get('member_education_collection', []):
                    # Prepare education history data
                    candidate_education_data = {
                        'id': education.get('id'),
                        'name': education.get('title', ''),  # School/University name
                        'degree': education.get('subtitle', ''),  # Degree or subtitle
                        'field': education.get('activities_and_societies', ''),  # Field of study
                        'from_date': validate_and_format_date(education.get('date_from')),
                        'to_date': validate_and_format_date(education.get('date_to')),
                        'created_at': education.get('created'),
                        'updated_at': education.get('last_updated'),
                        'candidate_id_id': candidate_id,
                        'created_by_id': created_by.id,  
                        'updated_by_id': created_by.id,  
                        'deleted_at': None if not education.get('deleted') else datetime.now()
                    }

                    unique_fields = {
                        'name': candidate_education_data['name'],
                        'degree': candidate_education_data['degree'],
                        'candidate_id_id': candidate_id
                    }

                    candidate_history, is_education_created = CandidateEducationHistory.objects.get_or_create(
                        **unique_fields,
                        defaults={
                            'field': candidate_education_data['field'],
                            'from_date': candidate_education_data['from_date'],
                            'to_date': candidate_education_data['to_date'],
                            'created_at': candidate_education_data['created_at'],
                            'updated_at': candidate_education_data['updated_at'],
                            'candidate_id_id': candidate_education_data['candidate_id_id'],
                            'created_by_id': candidate_education_data['created_by_id'],
                            'updated_by_id': candidate_education_data['updated_by_id'],
                            'deleted_at': candidate_education_data['deleted_at']
                        }
                    )
                for skills in candidate.get('member_skills_collection',[]):
                    skill = skills.get("member_skill_list", {}).get("skill", "")
                    if skill:
                        skill_obj = Skill.objects.get_or_create(name=skill)[0]
                        if candidate_created:
                            CandidateSkill.objects.create(candidate_id_id=candidate_id, skill_id_id=skill_obj.id)
        except Exception as e:
            print("error is", str(e))
            if candidate_created != 'error_out':
                if candidate_created:
                    created_count = created_count - 1
                elif not candidate_created:
                    updated_count = updated_count - 1
            failed_count = failed_count+1

    if job_id:
        candidate_push_ml(None, job_id, new_candidates, created_by,apollo_id)
        return True

    counts = {
        'created_count': created_count,
        'updated_count': updated_count,
        'failed_count': failed_count,
        'people_empty': False,
    }
    return counts


def get_candidates_revealed(job_id, candidates_id, user_id):
    try:
            created_by = User.objects.filter(id=user_id).first()
            location = created_by.location_id
            company_id = str(location.company_id_id)
            job_posting_candidate_ids = candidates_id
            job_posting_id = job_id
            valid_subscriptions = None
            credits_to_deduct = 50

            job_posting_candidates = JobPostingCandidate.objects.filter(
                candidate_id_id__in=job_posting_candidate_ids,
                job_posting_id_id=job_posting_id,
            )
            
            if not job_posting_candidates:
                return False

            job_posting = JobPosting.objects.get(id=job_posting_id)

            if created_by.role == 'employer':
                valid_subscriptions = all_valid_subscriptions(company_id)
                resp_candidates_list = []
                if not valid_subscriptions.exists():
                    error_message = {"Error":"Seems like you have run out of reveals! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return False
            elif created_by.role == 'hiring_manager':
                resp_candidates_list = []
                user_credits = UserCredits.objects.filter(user=created_by.id).first()
                if(user_credits.credits < 50):
                    error_message = {"Error":"Seems like you have run out of credits! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return False
            
            for job_posting_candidate in job_posting_candidates:
                is_revealed = reveal_candidate_and_update_subscription(job_posting_candidate, created_by.id, created_by.role, valid_subscriptions, credits_to_deduct)

                if not is_revealed:
                    break

            return True

    except Exception as e:
        print("some error",str(e))
        return False

def upload_profile_picture(file, candidate_data):
    allowed_extensions = ['jpg', 'jpeg', 'png']
    file_extension = file.name.split('.')[-1].lower()
    if file_extension not in allowed_extensions:
        return Response({"Error": "Invalid file extension. Must be a 'jpg' or 'jpeg' or 'png' "},
                        status=status.HTTP_406_NOT_ACCEPTABLE)
    max_file_size = 1 * 1024 * 1024
    if file.size > max_file_size:
        return Response({"Error": "Invalid file size. Must be Less Than 1MB"}, status=status.HTTP_406_NOT_ACCEPTABLE)
    file_key = f'candidates/{str(candidate_data.id)}'
    response = client_s3.put_object(
        Bucket=PROFILE_PICTURE_BUCKET,
        Key=file_key,
        Body=file,
        ContentType=file_extension
    )
    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
        candidate_data.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
        candidate_data.save()
        if candidate_data.user_id:
            user = candidate_data.user_id
            user.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
            user.save()
        return Response({'profile_picture': candidate_data.picture}, status=status.HTTP_200_OK)


def upload_resume(file, candidate_data):
    allowed_extension_doc = ['doc', 'docx', 'pdf']
    allowed_extension_video = ['mp4', 'mov', 'avi']
    file_extension = file.name.split('.')[-1].lower()
    file_key = None
    file_type = None
    if file_extension not in (allowed_extension_doc + allowed_extension_video):
        return Response({"Error": "Invalid file extension. Must be a 'doc' or 'video' type "},
                        status=status.HTTP_406_NOT_ACCEPTABLE)

    elif file_extension in allowed_extension_doc:
        max_file_size = 2 * 1024 * 1024
        if file.size > max_file_size:
            return Response({"Error": "Invalid file size. Must be Less Than 2MB"},
                            status=status.HTTP_406_NOT_ACCEPTABLE)
        file_type = 'doc'

    elif file_extension in allowed_extension_video:
        max_file_size = 15 * 1024 * 1024
        if file.size > max_file_size:
            return Response({"Error": "Invalid file size. Must be Less Than 15MB"},
                            status=status.HTTP_406_NOT_ACCEPTABLE)
        file_type = 'video'

    file_key = f'{str(candidate_data.id)}/{file_type}'
    response = client_s3.put_object(
        Bucket=RESUME_BUCKET,
        Key=file_key,
        Body=file,
        ContentType=file.content_type
    )
    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
        resume, created_flag = Resumes.objects.get_or_create(key=file_key, type=file_type, candidate_id=candidate_data)
        if not created_flag:
            resume.updated_at = datetime.now()
            resume.save()
        resume_url = get_presigned_url(RESUME_BUCKET, resume.key, expiration=1800)
        context = {
            'resume_id': str(resume.id),
            'resume_type': file_type,
            'resume_url': resume_url
        }
        return Response(context, status=status.HTTP_200_OK)


def candidate_query_conditions(query):
    if query:
        return Q(first_name__icontains=query) | Q(email__icontains=query) | Q(last_name__icontains=query)
    else:
        return Q()


def candidate_search_query_in_multiple_tables(query_params, query_keys):
    dynamic_query = Q()
    advanced_search = query_params.get('advanced_search')
    if advanced_search == 'true' or advanced_search == 'True':
        candidate_search = AdvancedSearchCandidate()
        for query_key in query_keys:
            if query_params.get(query_key):
                selector_condition = candidate_search.selector(query_set=query_params, query_field=query_key)
                if not selector_condition:
                    continue
                dynamic_query &= selector_condition
        results = Candidate.objects.filter(dynamic_query).distinct().order_by('-updated_at')
        return results
    elif query_params.get('keyword'):
        keyword = query_params.get('keyword')
        if ',' in keyword:
            values_from_query = keyword.split(', ')
            for query in values_from_query:
                dynamic_query &= candidate_query_conditions(query)
        else:
            dynamic_query = candidate_query_conditions(keyword)
        results = Candidate.objects.filter(dynamic_query).distinct().order_by('-updated_at')
        return results
    else:
        return Candidate.objects.all().order_by('-updated_at')


def ml_status_define(ml_process):
    message = None
    status = ml_process.status
    if status == 'pending' or status == 'priority':
        message = 'Please Hold! AI is analyzing your Job Posting'
    if status == 'in_progress':
        message = 'Hold On! AI is accumulating more candidates for you.'
    if status == 'success':
        message = 'AI analyzed all the Relevant Candidates'
    return status, message

def apollo_status_define(apollo_process):
    message = None
    status = apollo_process.status
    if status == 'pending':
        message = 'Please Hold! AI is analyzing your Job Posting'
    if status == 'in_progress':
        message = 'Hold On! AI is accumulating more candidates for you.'
    if status == 'success':
        message = 'AI analyzed all the Relevant Candidates'
    return status, message


def fetch_ai_candidates(request, id):
    candidate_response = []
    candidate_type = request.query_params.get('candidate_type')
    job_posting = JobPosting.objects.get(id=id)
    if candidate_type == "Other Candidates" or candidate_type is None:
        ml_process = MLProcess.objects.filter(job_posting_id_id=id).first()
        message = None
        if ml_process:
            ml_status, message = ml_status_define(ml_process)
        else:
            return {
                    "total_count": 0,
                    "total_pages": 0,
                    "current_page": 0,
                    "per_page": 0,
                    "candidates": [],
                    "status": "",
                    "message": "No Relevant Candidates for this job"
            }
        job_posting_candidate_dataset = JobPostingCandidate.objects.filter(job_posting_id=id, accuracy__gte=job_posting.minimum_match, source='startdate').exclude(candidate_id__source='coresignal')
        job_posting_candidate_dataset = job_posting_candidate_dataset | JobPostingCandidate.objects.filter(job_posting_id=id).exclude(source='startdate')

    elif candidate_type == "Recommended Candidates":
        apollo_process = ApolloJobs.objects.filter(job=job_posting).first()
        if apollo_process:
            ml_status, message = apollo_status_define(apollo_process)
        else:
            return {
                "total_count": 0,
                "total_pages": 0,
                "current_page": 0,
                "per_page": 0,
                "candidates": [],
                "status": "",
                "message": "No Subscription AI Request Submitted"
            }

        job_posting_candidate_dataset = JobPostingCandidate.objects.filter(job_posting_id=id, accuracy__gte=job_posting.minimum_match, candidate_id__source='coresignal', source='startdate')
        #job_posting_candidate_dataset = job_posting_candidate_dataset | JobPostingCandidate.objects.filter(job_posting_id=id).exclude(source='startdate')

    job_posting_candidate_dataset = job_posting_candidate_dataset.order_by('-accuracy')
    if not job_posting_candidate_dataset:
        if ml_status == 'success':
            message = 'No Relevant Candidates for this job!'
        if ml_status == 'in_progress':
            message = 'Hold On! AI is working on getting candidates for you.'

    page_number = request.query_params.get('page')
    per_page = request.query_params.get('per_page')
    if not per_page:
        per_page = 50
    paginator = Paginator(job_posting_candidate_dataset, per_page)
    job_posting_candidate_data = paginator.get_page(page_number)
    candidates_reveals = JobPostingReveals.objects.filter(job_posting_id_id=id).values_list('candidate_id_id',
                                                                                            flat=True)
    for job_posting_candidate in job_posting_candidate_data:
        candidate_data = job_posting_candidate.candidate_id
        if candidate_data.id in candidates_reveals or job_posting_candidate.source == 'other':
            complete_candidate = complete_candidate_data(candidate_data)
            complete_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                       'is_revealed': True, 'accuracy': job_posting_candidate.accuracy, 'source_type': job_posting_candidate.source})
            recommended_skill = job_posting_match_skill(candidate_data.id, id, False)
            if recommended_skill:
                complete_candidate.update({'recommended_skill': recommended_skill})
            candidate_response.append(complete_candidate)

        else:
            if job_posting_candidate.source == 'applied':
                masked_candidate = applied_masked_candidate(candidate_data, job_posting_candidate.job_posting_id)
            else:
                masked_candidate = masked_candidate_data(candidate_data)
                masked_candidate.update({'is_revealed': False})
            masked_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id), 'accuracy': job_posting_candidate.accuracy, 'source_type': job_posting_candidate.source})
            recommended_skill = job_posting_match_skill(candidate_data.id, id, False)
            if recommended_skill:
                masked_candidate.update({'recommended_skill': recommended_skill})
            candidate_response.append(masked_candidate)
    response = {
        "total_count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_number,
        "per_page": per_page,
        "candidates": candidate_response,
        "status": ml_status,
        "message": message
    }
    return response


def applied_masked_candidate(candidate, job_posting):
    if UnmaskedCandidateJobPosting.objects.filter(candidate_id=candidate, job_posting_id=job_posting).exists():
        candidate_data = complete_candidate_data(candidate)
    else:
        candidate_data = applied_candidate_data(candidate)
    return candidate_data


def job_posting_match_skill(candidate_id, job_posting_id, get_extra_data):
    try:
        recommended_skill = []
        job_posting_candidate_obj = JobPostingCandidate.objects.filter(candidate_id_id=candidate_id, job_posting_id_id=job_posting_id)[0]
        
        if job_posting_candidate_obj:
            job_posting_candidate_skill_obj = JobPostingCandidateSkill.objects.filter(job_posting_candidate_id_id=job_posting_candidate_obj.id)
            if job_posting_candidate_skill_obj:
                for candidate_skill in job_posting_candidate_skill_obj:
                    if candidate_skill.candidate_skill_id_id:
                        candidate_skill_obj = CandidateSkill.objects.get(id=candidate_skill.candidate_skill_id_id)
                        skill_obj = Skill.objects.get(id=candidate_skill_obj.skill_id_id)
                        matched_skill = {'candidate_skill_id': candidate_skill.candidate_skill_id_id, 'skill': skill_obj.name, 'accuracy': candidate_skill.accuracy}
                        recommended_skill.append(matched_skill)
                    else:
                        matched_skill = {'candidate_skill_id': candidate_skill.candidate_skill_id_id, 'skill': candidate_skill.skill_name, 'accuracy': candidate_skill.accuracy}
                        recommended_skill.append(matched_skill)
        else:   
            recommended_skill = None
        
        if get_extra_data:
            try:
                hiring_stage = job_posting_candidate_obj.hiring_stage_id.stage_name
            except:
                hiring_stage = None
                
            recommended_skill = { "skills": recommended_skill, "candidate_accuracy": job_posting_candidate_obj.accuracy, "hiring_stage": hiring_stage }
        
        return recommended_skill
    except Exception as e:
        pass


def fetch_sourced_candidates(request, id):
    candidates_response = []
    job_posting_candidates = JobPostingCandidate.objects.filter(job_posting_id_id=id).exclude(hiring_stage_id=None).order_by('-accuracy')
    for job_posting_candidate in job_posting_candidates:
        complete_candidate = complete_candidate_data(job_posting_candidate.candidate_id)
        complete_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                   'accuracy': job_posting_candidate.accuracy, 'hiring_stage_id': str(job_posting_candidate.hiring_stage_id_id), "source_type": job_posting_candidate.source})
        recommended_skill = job_posting_match_skill(job_posting_candidate.candidate_id.id, id, False)
        if recommended_skill:
            complete_candidate.update({'recommended_skill': recommended_skill})
        candidates_response.append(complete_candidate)
    response = {
        "candidates": candidates_response
    }
    return response


def check_description(work_history):
    for history in work_history:
        if history['description']:
            return '1'
    return '0'


def check_skills(skills):
    if len(skills) > 0:
        return '1'
    return '0'


def check_resume(resumes):
    if len(resumes) > 0:
        return '1'
    return '0'


def check_linked_in(linked_in):
    if linked_in:
        return '1'
    return '0'


def check_optional(candidate_data):
    resume_flag = check_resume(candidate_data.get('resumes', []))
    linkedin_flag = check_linked_in(candidate_data.get('linked_in'))
    return resume_flag + linkedin_flag


def check_cpws_candidate(candidate_object):
    # C - Contact OR Email
    # P - Profile Summary
    # W - Work History Description
    # S - Skills
    candidate = complete_candidate_data(candidate_object)
    is_contact = '0'
    is_summary = '0'
    if candidate['email']:
        is_contact = '1'
    if candidate['summary']:
        is_summary = '1'
    is_description = check_description(candidate['work_history'])
    is_skill = check_skills(candidate['skills'])
    stage = is_contact+is_summary+is_description+is_skill
    return stage
    
def address_correction(location):
    return None
    query = (f"{location['address']}" if location['address'] else '') + (f", {location['city']}" if location['city'] else '') +\
            (f", {location['state']}" if location['state'] else '') + (f", {location['country']}" if location['country'] else '')
    print('query - ', query)
    if not query:
        return None
    result = check_location_through_amazon_location(query)
    if result:
        place = result.get('Place', None)

        location = {
            'address': place.get('Label', None),
            'city': place.get('SubRegion', None),
            'state': place.get('Region', None),
            'country': place.get('Country', None),
            'zip': place.get('PostalCode') if place.get('PostalCode') is int else None
        }
        return location
    return result


def candidate_address_generalise(candidate_attributes):
    location = {
        'address': candidate_attributes.address,
        'city': candidate_attributes.city,
        'state': candidate_attributes.state,
        'country': candidate_attributes.country
    }
    address = address_correction(location)

    if address:
        try:
            address_data = {
                "city": address.get('city'),
                "state": address.get('state'),
                "country": address.get('country'),
                "address": address.get('address'),
                "zip": address.get('zip')
            }
            # Using bulk update method so post_save signal doesn't call Amazon Location Service method in loop
            CandidateAttributes.objects.filter(id=candidate_attributes.id).update(**address_data)
        except:
            pass

def CandidateResumeParser(request):
    uploaded_file = request.FILES['resume']
    temp_file_path = None

    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        for chunk in uploaded_file.chunks():
            temp_file.write(chunk)
        temp_file_path = temp_file.name
    
    if temp_file_path is not None:
        result = PdfScraperOpenAi(temp_file_path)
        exist_cad_data = parse_and_fetch(result)

        if exist_cad_data:
            return exist_cad_data
        else:
            return result
    

# def CandidateResumeParser(request):
#     uploaded_file = request.FILES['resume']
    
#     # file_name = uploaded_file.name
    
    
#     # print("upload file : ",uploaded_file)
    
#     parser = services.Main(pickle=True, load_pickled=True)
#     json_output = parser.parse(uploaded_file)
#     # print(json_output)
#     return json_output
    


def parse_and_fetch(result):
    try:
        email = result.get("email")
        if email:
            candidate_exist  = Candidate.objects.filter(email=email).exists()
            
            try:
                if candidate_exist:
                    print("candidate exist")
                    candidate_obj = Candidate.objects.filter(email=email)[0]
                    db_data = complete_candidate_data(candidate_obj)
                
                    full_skills = single_skill_list(result.get("skills"), db_data.get("skills") )
                    full_work_history = single_work_list(result.get("work_history") , db_data.get("work_history"))
                    full_edu_history = result.get("education_history") + db_data.get("education_history")
                    
                    Public_links = None 
                    if result.get("Public_links"):
                        for link in result.get("Public_links"):
                            if "linkedin" in link:
                                Public_links = [{"linkedin":link}]
                            elif "github" in link:
                                Public_links = [{"github":link}]
                            else:
                                Public_links = result.get("Public_links")

                    response_data  = {
                        "candidate_id": candidate_obj.id if candidate_obj.id else None,
                        "first_name": db_data.get("first_name"),
                        "last_name": db_data.get("last_name"),
                        "phone": str(db_data.get("phone")),
                        "linked_in": db_data.get("profile") if db_data.get("profile") else None,
                        "picture": db_data.get("picture"),
                        "summary": db_data.get("summary"),
                        "email": db_data.get("email"),
                        "skills": full_skills,
                        "address": db_data.get("address"),
                        "work_history": full_work_history,
                        "education_history": full_edu_history,
                        "Public_links": Public_links,
                        "resumes": db_data.get("resumes_list")
                    }
                    return response_data

            except Exception as e:
                return Response({"Error Message": f"Please Try Again Later {e}"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return False
        
        else:
            return False
    except Exception as e:
        print("Exception",e)
        return False
    

def single_skill_list(skill_list1,skill_list2):
    skill_dict = {skill["skill"]: skill for skill in skill_list2}

    # Iterate through the first list and update with skills from the second list if available
    merged_skills = []
    for skill in skill_list1:
        merged_skill = skill_dict.get(skill["skill"], skill)
        merged_skills.append(merged_skill)

    # Add skills from the second list that are not in the first list to the merged list
    for skill in skill_list2:
        if skill["skill"] not in skill_dict:
            merged_skills.append(skill)

    return merged_skills


def single_work_list(parse_list,db_list):
    # Create a dictionary to store the elements from db_list with unique keys (title + company)
    db_dict = {}
    for item in db_list:
        key = item['title'] + item['company']
        db_dict[key] = item

    # Create a set to keep track of added keys to avoid duplicate entries
    added_keys = set()

    # Create a new list to store the merged results
    merged_list = []

    # Iterate through parse_list and add items to merged_list
    for item in parse_list:
        key = item.get('title','Title') + item.get('company','Company')
        if key in added_keys:
            # If duplicate key, add item from db_list if available
            if key in db_dict:
                merged_list.append(db_dict[key])
        else:
            # If not a duplicate, add item from parse_list
            merged_list.append(item)
            added_keys.add(key)

    # Iterate through db_list and add non-duplicate items to merged_list
    for item in db_list:
        key = item['title'] + item['company']
        if key not in added_keys:
            merged_list.append(item)
            added_keys.add(key)

    return merged_list


def single_edu_list(parse_list,db_list):
    # Create a dictionary to store the elements from db_list with unique keys (title + company)
    db_dict = {}
    for item in db_list:
        key = item['name'] + item['degree']
        db_dict[key] = item

    # Create a set to keep track of added keys to avoid duplicate entries
    added_keys = set()

    # Create a new list to store the merged results
    merged_list = []

    # Iterate through parse_list and add items to merged_list
    for item in parse_list:
        key = item.get('name','Name') + item.get('degree','Degree')
        if key in added_keys:
            # If duplicate key, add item from db_list if available
            if key in db_dict:
                merged_list.append(db_dict[key])
        else:
            # If not a duplicate, add item from parse_list
            merged_list.append(item)
            added_keys.add(key)

    # Iterate through db_list and add non-duplicate items to merged_list
    for item in db_list:
        key = item['title'] + item['company']
        if key not in added_keys:
            merged_list.append(item)
            added_keys.add(key)

    return merged_list

def query_data(data, key):
    result = None
    for k, v in data.items():
        if k.lower() == key.lower():
            result = v
    return result


def convert_to_standard_date(date_str):
    if date_str in ['PRESENT','Present']:
        return date.today().strftime('%Y-%m-%d')
    
    elif date_str in ['NA','Null']:
        return None

    formats_to_try = ['%Y', '%d-%b-%Y', '%d-%m-%Y']
    
    for fmt in formats_to_try:
        try:
            datetime_obj = datetime.strptime(date_str, fmt)
            return datetime_obj.strftime('%Y-%m-%d')
        except ValueError:
            return None


def get_candidates(id):
    if not Candidate.objects.filter(id=id).exists():
        message = {"error":f"Candidate {id} does not exist "}
        return Response(message, status=status.HTTP_404_NOT_FOUND)

    candidate_obj = Candidate.objects.get(id=id)

    response  = complete_candidate_data(candidate_obj)
    
    response_after_correction = reformat_dates_in_candidate_data(response)

    return Response(response_after_correction, status=status.HTTP_200_OK)

def save_candidate(data):
    candidate_id = data.get("candidate_id",None)
    if candidate_id:
        return update_candidate(data,candidate_id)
    else:
        return _create_candidate(data)


def update_candidate(data, candidate_id):
    try:
        phone = data.get('phone')
        phone_code = data.get('phone_code')
        if phone_code and phone:
            data.update({'phone': phone_code+phone})

        candidate_data = Candidate.objects.get(id=candidate_id)
        data['source'] = 'Resume'

        candidate_serializer = CandidateProfileViewSerializer(candidate_data, data=data, partial=False)
        if candidate_serializer.is_valid(raise_exception=True):
            candidate_obj = candidate_serializer.save()
            if candidate_obj.user_id:
                user_from_email = User.objects.filter(email=data['email']).first()
                user = candidate_obj.user_id
                if user_from_email and (user.id != user_from_email.id):
                    return Response({"Error": "User with this Email Already Exists. "}, status=status.HTTP_404_NOT_FOUND)
                user.email = data['email']
                user.save()
        if data.get("address").get('id'):
            candidate_attribute = CandidateAttributes.objects.get(id=data.get("address").get('id'))
            candidate_attribute_serializer = CandidateAttributesProfileViewSerializer(candidate_attribute, data=data['address'], partial=False)
            if candidate_attribute_serializer.is_valid(raise_exception=True):
                candidate_attribute_serializer.save()
        else:
            address = data.get("address")
            address['candidate_id_id'] = candidate_id
            candidate_attributes_create = CandidateAttributes.objects.get_or_create(**address)

        # update skill object
        skills = [Skill.objects.get_or_create(name=skill_object['skill']) for skill_object in data.get('skills')]
        candidate_skills = [CandidateSkill.objects.get_or_create(candidate_id_id=candidate_data.id, skill_id_id=skill.id) for skill, created in skills]
            
        # Update work history
        work_history_data = data['work_history']
        candidate_work_obj = CandidateWorkHistory.objects.filter(candidate_id=candidate_data.id)
        if candidate_work_obj.exists():
            candidate_work_obj.delete()
            for obj in candidate_work_obj:
                obj.hard_delete()

        for work_history_item in work_history_data:
            if work_history_item.get('company'):
                company = Company.objects.get_or_create(name=work_history_item['company'])[0]
                
                if work_history_item['from_date']:
                    work_history_item['from_date'] = convert_date_format(work_history_item['from_date'])
                
                if work_history_item['to_date']:
                    work_history_item['to_date'] = convert_date_format(work_history_item['to_date'])
                
                work_history_item.update({'company_id': company.id, 'candidate_id': candidate_data.id})
                candidate_work_history_serializer = CandidateWorkHistoryProfileViewSerializer(data=work_history_item)
                if candidate_work_history_serializer.is_valid(raise_exception=True):
                    candidate_work_history_serializer.save()
            
            else:
                return Response({"Error": "Company not found !!!"}, status=status.HTTP_404_NOT_FOUND)

        # Update education history
        education_history_data = data['education_history']
        candidate_edu_obj = CandidateEducationHistory.objects.filter(candidate_id=candidate_data.id)
        if candidate_edu_obj.exists():
            candidate_edu_obj.delete()
            for obj in candidate_edu_obj:
                obj.hard_delete()

        for education_history_item in education_history_data:
            if education_history_item['from_date']:
                    education_history_item['from_date'] = convert_date_format(education_history_item['from_date'])
                
            if education_history_item['to_date']:
                education_history_item['to_date'] = convert_date_format(education_history_item['to_date'])
                
            education_history_item.update({'candidate_id': candidate_data.id})
            candidate_education_history_serializer = CandidateEducationHistoryProfileViewSerializer(data=education_history_item)               
            if candidate_education_history_serializer.is_valid(raise_exception=True):
                candidate_education_history_serializer.save()
            #candidate_education_history = CandidateEducationHistory.objects.create(**education_history_item)

        # Handle other fields as needed
        
        return Response(reformat_dates_in_candidate_data(complete_candidate_data(candidate_data)), status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"Error": f"Please Try Again Later {e}"}, status=status.HTTP_400_BAD_REQUEST)
    

def _create_candidate(data):
    candidate_context = {
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'email': data.get('email'),
            'profile': data.get('linkedin_url', None),
            'picture': data.get('photo_url', None),
            'phone': data.get('phone'),
            'summary': data.get('summary')
        }

    try:
        candidate_object, candidate_created = Candidate.objects.get_or_create(**candidate_context)
        if candidate_object.picture:
            file_key = f'candidates/{str(candidate_object.id)}'
            response = upload_image_from_link(PROFILE_PICTURE_BUCKET, file_key, candidate_object.picture)
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                candidate_object.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
                candidate_object.save()

        candidate_id = candidate_object.id

        address = data.get("address")
        
        if address:
            candidate_attributes_data = {
                'city': address.get('city'),
                'state': address.get('state'),
                'country': address.get('country'),
                'candidate_id_id': candidate_id
            }
            candidate_attributes_object = CandidateAttributes.objects.get_or_create(**candidate_attributes_data)[0]

        Skills  = data.get("skills")

        for skill_object in Skills:

            skill, flag = Skill.objects.get_or_create(name=skill_object['skill'])
            if flag:
                CandidateSkill.objects.create(candidate_id_id=candidate_object.id, skill_id_id=skill.id)    

        work_history = data.get("work_history")

        for experience in work_history:

            title = query_data(experience, 'title')
            company = query_data(experience, 'company')
            description = query_data(experience, 'description')
            from_date = query_data(experience, 'from_date')
            to_date = query_data(experience, 'to_date')

            if from_date in ['Unknown', None]:
                from_date = None
            else:
                from_date = convert_to_standard_date(from_date)

            if to_date in ['Unknown', None]:
                to_date = None
            else:
                to_date = convert_to_standard_date(to_date)

            if title and company:
                company_data = {
                    'name': company
                }
                company_object = Company.objects.get_or_create(name=company_data['name'])[0]

                company_object_id = company_object.id

                populate_data = {
                                "title": title if title else None,
                                "description": description if description else None,
                                "from_date": from_date if from_date else None,
                                "to_date": to_date if to_date else None,
                                'company_id_id': company_object_id,
                                'candidate_id_id': candidate_id
                                }

                candidate_workhistory_object = CandidateWorkHistory.objects.get_or_create(**populate_data)[0]


        education_history = data.get("education_history")

        for edu in education_history:

            name = query_data(edu,'name')
            degree = query_data(edu,'degree')
            from_date = query_data(edu,'from_date')
            to_date = query_data(edu,'to_date')

            if from_date in ['Unknown',None]:
                from_date = None
            else :
                from_date = convert_to_standard_date(from_date)

            if to_date in ['Unknown', None]:
                to_date = None
            else:
                to_date = convert_to_standard_date(to_date)

            if name and degree:
                populate_data = { "name" : title if title else None,
                                    "degree" : degree if degree else None,
                                    "from_date" : from_date if from_date else None,
                                    "to_date" : to_date if to_date else None,
                                        'candidate_id_id': candidate_id
                }
                candidate_education_history_obj = CandidateEducationHistory.objects.get_or_create(**populate_data)[0]

        return Response(complete_candidate_data(candidate_object), status=status.HTTP_200_OK)
    except Exception as e:
        print(e)
        return Response({"Error Message": f"Please Try Again Later {e}"}, status=status.HTTP_400_BAD_REQUEST)


def delete_candidate(id):
    if not Candidate.objects.filter(id=id).exists():
        return Response({"Error Message": f"Candidate not found"}, status=status.HTTP_404_NOT_FOUND)
    
    candidate_obj = Candidate.objects.filter(id=id).first()

    if candidate_obj:
        CandidateAttributes.objects.filter(candidate_id_id=candidate_obj.id).delete()
        CandidateWorkHistory.objects.filter(candidate_id_id=candidate_obj.id).delete()
        CandidateEducationHistory.objects.filter(candidate_id_id=candidate_obj.id).delete()
        candidate_obj.delete()
    return Response({"Message": f"Candidate deleted successfully {id}"}, status=status.HTTP_200_OK)


def reformat_dates_in_candidate_data(candidate_data):
    from datetime import datetime, date
    def reformat_dates(history_list):
        for history in history_list:
            for field in ['from_date', 'to_date']:
                if field in history:
                    if isinstance(history[field], date):
                        history[field] = history[field].strftime('%m-%d-%Y')
        return history_list

    candidate_data["work_history"] = reformat_dates(candidate_data["work_history"])
    candidate_data["education_history"] = reformat_dates(candidate_data["education_history"])

    return candidate_data


def convert_date_format(date_string):
    try:
        if date_string.lower() == "present":
            return date.today().strftime("%Y-%m-%d")
        
        elif not date_string:
            return ""
        
        else:
            parsed_date = parser.parse(date_string)
            formatted_date = parsed_date.strftime("%Y-%m-%d")
            
            return formatted_date
    
    except ValueError as e:
        print("Error:", str(e))


def apollo_contact_api_method(profile_link, html_string):
    url = "https://app.apollo.io/api/v1/linkedin_chrome_extension/parse_profile_page"

    con_data = {
        "api_key": APOLLO_API_KEY,
        "url": profile_link,
        "html": html_string
    }
    headers = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, json=con_data)
    response_data = response.json()
    return response_data


def download_unmasked_candidates(id, full_service):
    job_posting = JobPosting.objects.get(id=id)
    candidates_reveals = JobPostingReveals.objects.filter(job_posting_id_id=id).values_list('candidate_id_id', flat=True)
    candidates_data = Candidate.objects.filter(id__in=candidates_reveals)
        
    headers = ["job_title", "name", "email", "phone", "address", "probability", "matched_skills"]
    data = []
    
    for candidate_data_obj in candidates_data:
        candidate_data = {
            "job_title": job_posting.title
        }

        candidate = complete_candidate_data(candidate_data_obj)
        recommended_skill = job_posting_match_skill(candidate_data_obj.id, id, True)

        first_name = candidate.get("first_name", "")
        last_name = candidate.get("last_name", "")

        if type(first_name) is list:
            first_name = " ".join(first_name)
        if type(last_name) is list:
            last_name = " ".join(last_name)

        candidate_data["name"] = f"{first_name or ''} {last_name or ''}"
        candidate_data["email"] = candidate.get("email", "")
        candidate_data["phone"] = candidate.get("phone", "")
        
        address_data = candidate.get("address", None)
        if address_data:
            address = [
                address_data.get("address", ""),
                address_data.get("city", ""),
                address_data.get("state", ""),
                address_data.get("country", "")
            ]
            filtered_address = [addr.strip() for addr in address if addr]
            candidate_data["address"] = ", ".join(filtered_address)
        else:
            candidate_data["address"] = ""
            
        candidate_data["probability"] = f"{round(recommended_skill.get('candidate_accuracy', 0), 2)}%"
        candidate_data["matched_skills"] = ""
        for skill in recommended_skill.get("skills", []):
            candidate_data["matched_skills"] += f"{skill.get('skill', '')} - {round(skill.get('accuracy', 0), 2)}%, "
            
        if full_service:
            candidate_data["hiring_stage"] = recommended_skill.get("hiring_stage", "")
        
        data.append(candidate_data)
    
    if full_service:
        headers.append("hiring_stage")

    df = pd.DataFrame(data, columns=headers)
    
    return df