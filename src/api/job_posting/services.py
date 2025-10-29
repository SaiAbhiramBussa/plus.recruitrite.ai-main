import random
from django.core.paginator import Paginator
from machine_learning.models import MLTrainingData
from rest_framework import status
from django.db.models import Q
from rest_framework.response import Response
from job_posting.serializers import JobPostingTemplateSerializer
from candidate.services import job_posting_match_skill
from company.models import Subscription, Location, Industry
from job_posting.models import (
    JobPosting,
    JobPostingCandidate,
    JobPostingTemplate,
    OtherCandidates,
    JobPostingSkill,
)
from decouple import config
from startdate import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
import requests
import csv
import tempfile
import os

from machine_learning.services import complete_candidate_data

SUPPORT_EMAIL = config("SUPPORT_EMAIL")
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
NEXT_APP_DOMAIN_LINK = config("NEXT_APP_DOMAIN_LINK")
EMAIL_CLIENT = settings.EMAIL_CLIENT


def is_valid_employer(request, validate_object):
    if isinstance(validate_object, JobPosting):
        if (
            validate_object.location_id.company_id
            == request.user.location_id.company_id
        ):
            return True
    if isinstance(validate_object, Location):
        if validate_object.company_id == request.user.location_id.company_id:
            return True
    request._auth.delete()
    return False


def is_valid_company(request, validate_object):
    if isinstance(validate_object, JobPosting):
        if validate_object.location_id.company_id == request.company:
            return True
    elif isinstance(validate_object, Location):
        if validate_object.company_id == request.company:
            return True
    return False


def job_posting_search_query_in_multiple_tables(title_query, location_query, min_salary, max_salary):
    dynamic_queryset_first = Q()
    dynamic_queryset_second = Q()
    dynamic_queryset_third = Q()
    dynamic_queryset_fourth = Q()
    if title_query:
        values_from_query = [title_query]
        if "," in title_query:
            values_from_query = values_from_query + title_query.split(", ")
        for query in values_from_query:
            query_conditions = Q(title__icontains=query)
            dynamic_queryset_first |= query_conditions

    if location_query:
        values_from_query = [location_query]
        if "," in location_query:
            values_from_query = values_from_query + location_query.split(", ")
        for query in values_from_query:
            query_conditions = (
                Q(city__icontains=query)
                | Q(state__icontains=query)
                | Q(country__icontains=query)
            )
            dynamic_queryset_second |= query_conditions
    if min_salary:
        dynamic_queryset_third = Q(compensation__gte=min_salary)
    if max_salary:
        dynamic_queryset_fourth = Q(compensation__lte=max_salary)
    dynamic_query = dynamic_queryset_first & dynamic_queryset_second & dynamic_queryset_third & dynamic_queryset_fourth
    results = (
        JobPosting.objects.filter(dynamic_query)
        .exclude(status="inactive")
        .distinct()
        .order_by("-updated_at", "-created_at", "title")
    )
    return results


def top_job_posting_candidate_pics(job_posting):
    subscription = Subscription.objects.filter(job_posting_id=job_posting).first()
    if subscription:
        job_posting_candidates = (
            JobPostingCandidate.objects.filter(job_posting_id=job_posting)
            .exclude(hiring_stage_id=None)
            .order_by("-accuracy")
        )
    else:
        job_posting_candidates = JobPostingCandidate.objects.filter(
            job_posting_id=job_posting, accuracy__gte=job_posting.minimum_match
        ).order_by("-accuracy")
    pictures = []
   
    total_matches = job_posting_candidates.count()

    candidate_pictures = job_posting_candidates.filter(
            candidate_id__picture__isnull=False).select_related('candidate_id').values_list("candidate_id__picture", flat=True)[:4]

    pictures = list(candidate_pictures)

    if len(pictures) == 4:
        return pictures, total_matches
    elif len(pictures) == total_matches:
        return pictures, total_matches
    else:
        min_possible = min(job_posting_candidates.count(), 4)
        max_pics_count = min_possible - len(pictures)
        for i in range(0, max_pics_count):
            pictures.append(
                f"https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/{random.randint(1, 6)}.png"
            )
        return pictures, total_matches


def send_full_service_mail(job_posting_id, company_id, job_title):
    job_link = f"{NEXT_APP_DOMAIN_LINK}/admin/company/{company_id}/job_posting/{job_posting_id}/pre-screening"
    subject = "Full service job got edited"

    email_data = {"title": job_title, "job_link": job_link}
    email_body = render_to_string("admin_mail.html", email_data)

    to_email = SUPPORT_EMAIL
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


def job_posting_address_generalise(job_posting):
    from candidate.services import address_correction
    location_data = {
        "city": job_posting.city,
        "state": job_posting.state,
        "country": job_posting.country,
        "address": None,
    }
    address = address_correction(location_data)

    if address:
        try:
            address_data = {
                "city": address.get("city"),
                "state": address.get("state"),
                "country": address.get("country"),
                "zip": address.get("zip"),
            }
            # Using bulk update method so post_save signal doesn't call Amazon Location Service method in loop
            JobPosting.objects.filter(id=job_posting.id).update(**address_data)
        except:
            pass

def job_posting_template(industry_id, title_query, company_id, page, per_page, filter, is_category=None):
    try:
        _query = {}
        if industry_id:
            _query["industry_id"] = industry_id
        if title_query:
            _query["title__icontains"] = title_query

        if company_id == "all":
            if filter == "user":
                _query["company_id__isnull"] = False
            elif filter == "admin":
                _query["company_id__isnull"] = True
        elif company_id is not None:
            _query["company_id"] = company_id
        else:
            _query["company_id__isnull"] = True

        jobtemplate_query_obj = JobPostingTemplate.objects.filter(**_query).order_by("-updated_at")

        if page and per_page:
            paginator = Paginator(jobtemplate_query_obj, per_page)
            jobtemplate_query_obj = paginator.get_page(page)
            data = {
                "current_page": page,
                "per_page": per_page,
                "total_pages": paginator.num_pages,
                "total_count": paginator.count
            }
        else:
            data = {}

        serializer = JobPostingTemplateSerializer(instance=jobtemplate_query_obj, many=True)
        data["data"] = serializer.data

        return Response(data, content_type="application/json")
    except Exception as e:
        return Response({"error": str(e)}, content_type="application/json")
    
    
def create_job_posting_template(title, skill, description, industry_id, company_id):
    try:
        _query = {
            "company_id_id": company_id,
            "industry_id_id": industry_id,
            "title": title,
        }
        
        jobtemplate_obj = JobPostingTemplate.objects.filter(**_query).exists()

        if jobtemplate_obj:
            response = {"Error": f"Job template {title} already exists"}
            
            return Response(response, content_type="application/json", status=status.HTTP_400_BAD_REQUEST)

        if company_id:
            create__query = {
                "industry_id_id": industry_id,
                "title": title,
                "skill": skill,
                "description": description,
                "company_id_id": company_id,
            }
        else:
            create__query = {
                "industry_id_id": industry_id,
                "title": title,
                "skill": skill,
                "description": description,
            }   
            
        response_obj, created_flag = JobPostingTemplate.objects.get_or_create(**create__query)
        industry_obj = Industry.objects.get(id=industry_id)
        
        response_context = {
            "industry_id": industry_obj.id,
            "industry_name": industry_obj.title,
            "title": response_obj.title,
            "skill": response_obj.skill,
            "description": response_obj.description,
            "company_id": str(response_obj.company_id),
        }
        
        return Response(response_context, content_type="application/json", status=status.HTTP_200_OK)
    except Exception as e:
        response = {"Error": f"Exception : {str(e)}"}
        return Response(response, content_type="application/json", status=status.HTTP_400_BAD_REQUEST)


def update_job_posting_template(data):
    try:
        template_id = data.get("template_id")
        if not template_id:
            return Response({"Error": "template_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        title = data.get("job_title")
        industry_id = data.get("industry_id")
        skill = data.get("skill")
        description = data.get("description")
        
        try:
            job_template = JobPostingTemplate.objects.get(id=template_id)
        except JobPostingTemplate.DoesNotExist:
            return Response({"Error": "Job template does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
        if title and JobPostingTemplate.objects.filter(title = title, industry_id_id = industry_id).exclude(id=template_id).exists():
            return Response({"Error": "A job template with this title already exists"}, status=status.HTTP_400_BAD_REQUEST)        
        
        if title:
            job_template.title = title
        if skill:
            job_template.skill = skill
        if description:
            job_template.description = description
        if industry_id:
            job_template.industry_id_id = industry_id
            
        job_template.save()
        
        updated_template_data = {
            "id": str(job_template.id),
            "title": job_template.title,
            "skill": job_template.skill,
            "description": job_template.description,
            "industry_id": str(job_template.industry_id),
        }
        
        return Response(updated_template_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"Error": f"Exception : {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def get_job_posting_data_for_other_candidates(job_posting):
    skills = JobPostingSkill.objects.filter(job_posting_id=job_posting).values_list(
        "skill_id__name", flat=True
    )
    skills_string = ", ".join(list(skills))

    return {
        "id": str(job_posting.id),
        "title": job_posting.title,
        "description": job_posting.description,
        "company": job_posting.location_id.company_id.name,
        "skills": skills_string if skills_string else None,
    }


def other_candidates_generator_function(rows=None, df=None):
    if df:
        for i, row in df.iterrows():
            yield row
    if rows:
        for row in rows:
            yield row


def other_candidates_csv_read(pending_file_object, csv_file, user_role='employer'):
    import pandas as pd
    import numpy as np
    if pending_file_object:
        failed = 0
        sent = 0

        job_posting_data = get_job_posting_data_for_other_candidates(
            pending_file_object.job_posting_id
        )
        try:
            df_test = pd.read_excel(csv_file, header=1)
            df = df_test.fillna(np.nan).replace([np.nan], [None])

            try:
                for i, row in df.iterrows():
                    row_status = process_other_candidates_csv_row(pending_file_object, user_role, row, job_posting_data)
                    if row_status == 'queued':
                        sent += 1
                    else:
                        failed += 1

            except Exception as e:
                print(e)
                pending_file_object.error = f"......{str(e)}......."
            pending_file_object.failed = failed
            pending_file_object.queued = sent
            pending_file_object.save()
            return
        except:
            temp_dir = tempfile.TemporaryDirectory()
            with open(os.path.join(temp_dir.name, 'csv_file.csv'), "w") as f:
                f.write(csv_file.read().decode())
            with open(os.path.join(temp_dir.name, "csv_file.csv"), newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                try:
                    for row in reader:
                        row = {key: value if value and not value.isspace() else None for key, value in row.items()}

                        row_status = process_other_candidates_csv_row(pending_file_object, user_role, row,
                                                                      job_posting_data)
                        if row_status == 'queued':
                            sent += 1
                        else:
                            failed += 1

                except Exception as e:
                    print(e)
                    pending_file_object.error = f"......{str(e)}......."
                pending_file_object.failed = failed
                pending_file_object.queued = sent
                pending_file_object.save()


def process_other_candidates_csv_row(pending_file_object, user_role, row, job_posting_data):
    try:
        if user_role == 'employer':
            if (not row["Email"]) or row["Email"].isspace():
                return 'failed'
        candidate_data = {
            "id":row["id"],
            "first_name": row["First Name"],
            "last_name": row["Last Name"],
            "profile": row["Profile"],
            "picture": row["Picture"],
            "summary": row["Summary"],
            "title":row["Title"],
            "industry":row["Industry"],
            "email": row["Email"],
            "phone": row["Phone"],
            "address": {"address": row["Location"]},
            "source_type": "other",
        }
        skills = []
        for skill_counter in range(10):
            if f"Skill-{skill_counter}" in row and row[f"Skill-{skill_counter}"]:
                skills.append({"skill": row[f"Skill-{skill_counter}"]})
        education_list = []
        for education_counter in range(3):
            if f"School-{education_counter}-Name" in row and row[f"School-{education_counter}-Name"]:
                education_list.append(
                    {
                        "name": row[f"School-{education_counter}-Name"],
                        "degree": row[f"School-{education_counter}-Degree"],
                    }
                )

        work_history_list = []
        for work_history_counter in range(5):
            if f"Position-{work_history_counter}-Company" in row and row[f"Position-{work_history_counter}-Company"]:
                work_history_list.append(
                    {
                        "title": row[
                            f"Position-{work_history_counter}-Title"
                        ],
                        "company": row[
                            f"Position-{work_history_counter}-Company"
                        ],
                        "to_date": str(
                            row[f"Position-{work_history_counter}-To"]
                        ),
                        "from_date": str(
                            row[f"Position-{work_history_counter}-From"]
                        ),
                        "description": row[
                            f"Position-{work_history_counter}-Description"
                        ],
                    }
                )
        candidate_data.update(
            {
                "skills": skills,
                "work_history": work_history_list,
                "education_history": education_list,
            }
        )

        add_to_ranker_queue(
            job_posting_data, candidate_data, str(pending_file_object.id)
        )
        return 'queued'
    except Exception as e:
        pending_file_object.error = (
            pending_file_object.error + f"......{str(e)}......."
            if pending_file_object.error
            else f"......{str(e)}......."
        )

        pending_file_object.save()
        return 'failed'


def add_to_ranker_queue(job_posting_data, resume_data, other_candidates_id=None):
    preset_weights = MLTrainingData.TARGET_LABELS
    
    try:
        api_request_data = {
            "queue_name": config("MODEL_PARSER_QUEUE_NAME"),
            "model": config("STARTDATE_V5_MODEL"),
            "job_posting": job_posting_data,
            "use_sd_importer": True,
            "candidate_resume": [resume_data],
            "preset_weights": preset_weights
        }
        if other_candidates_id:
            api_request_data.update({"other_candidates_id": other_candidates_id})
        url = f"{config('PROCESS_QUEUE_DOMAIN')}/queue_job"
        headers = {"Cache-Control": "no-cache", "Content-Type": "application/json"}
        response = requests.request("POST", url, headers=headers, json=api_request_data)
        if response.status_code == 200:
            pass
        else:
            raise Exception("Process Queue Not Reachable")
    except Exception as e:
        raise e


def fetch_other_candidates(request, id, is_hiring_stage_null=False):
    candidate_response = []
    job_posting_candidate_dataset = JobPostingCandidate.objects.filter(
        job_posting_id=id, source="other"
    ).order_by("-accuracy")
    if is_hiring_stage_null:
        job_posting_candidate_dataset = job_posting_candidate_dataset.exclude(
            hiring_stage_id__isnull=False
        ).order_by("-accuracy")
    page_number = request.query_params.get("page")
    per_page = request.query_params.get("per_page")
    if not per_page:
        per_page = 50
    paginator = Paginator(job_posting_candidate_dataset, per_page)
    job_posting_candidate_data = paginator.get_page(page_number)
    for job_posting_candidate in job_posting_candidate_data:
        candidate_data = job_posting_candidate.candidate_id
        complete_candidate = complete_candidate_data(candidate_data)
        complete_candidate.update(
            {
                "job_posting_candidate_id": str(job_posting_candidate.id),
                "is_revealed": True,
                "accuracy": job_posting_candidate.accuracy,
            }
        )
        recommended_skill = job_posting_match_skill(candidate_data.id, id, False)
        if recommended_skill:
            complete_candidate.update({"recommended_skill": recommended_skill})
        candidate_response.append(complete_candidate)

    response = {
        "total_count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_number,
        "per_page": per_page,
        "candidates": candidate_response,
    }
    return response


def get_imprimis_specific_job(job_id):
    rest_token = get_bh_rest_token()
    base_url = f"https://rest32.bullhornstaffing.com/rest-services/ijd00/entity/JobOrder/{job_id}"

    params = {
        "BhRestToken": rest_token,
        "fields": "id,title,startDate,skills,onSite,description,salary,address",
    }

    response = requests.get(base_url, params)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 401:
        rest_token = get_bh_rest_token(True)
        return get_imprimis_jobs()
    return None


def get_bh_rest_token(refresh_cache=False):
    auth = get_imprimis_auth(refresh_cache)
    return auth.get("BhRestToken")


def get_bh_rest_token_login(access_token):
    base_url = "https://rest-west.bullhornstaffing.com/rest-services/login"

    params = {"version": 2.0, "access_token": access_token}

    response = requests.post(base_url, params=params)
    if response.status_code == 200:
        return response.json()
    return None

def get_imprimis_auth(refresh_cache=False):
    return set_imprimis_auth()
    # string_credentials = byte_credentials.decode("utf-8")
    # auth = json.loads(string_credentials)
    # if refresh_cache:
    #     return set_imprimis_auth(auth.get("refresh_token"))
    # return auth



def set_imprimis_auth(refresh_token=None):
    oauth_token_response = get_oauth_token(refresh_token)
    response = get_bh_rest_token_login(oauth_token_response.get("access_token"))
    # response = oauth_token_response.get("access_token")
    if response:
        print(response)
        bh_rest_token = response.get("BhRestToken")
        rest_token = {
            "refresh_token": oauth_token_response.get("refresh_token"),
            "BhRestToken": bh_rest_token,
        }
        return rest_token
    else:
        return {"error": "authentication failed"}


def get_imprimis_jobs(date_query):
    rest_token = get_bh_rest_token()
    base_url = "https://rest32.bullhornstaffing.com/rest-services/ijd00/search/JobOrder"

    params = {
        "BhRestToken": rest_token,
        "fields": "id,title,startDate,skills,onSite,description,salary,address",
        "query": f"isDeleted:0{date_query}",
        "count": 100,
    }

    response = requests.get(base_url, params)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 401:
        rest_token = get_bh_rest_token(True)
        return get_imprimis_jobs()


def get_oauth_token(refresh_token):
    if refresh_token:
        updated_params = {
            "grant_type": "refresh_from_token",
            "refresh_token": refresh_token,
        }
    else:
        code = get_token_from_redirect_url()
        updated_params = {
            "grant_type": "authorization_code",
            "code": code,
        }

    base_url = "https://auth-west.bullhornstaffing.com/oauth/token"

    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
    }

    params.update(updated_params)
    response = requests.post(base_url, params=params)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 401 or response.status_code == 400:
        return get_oauth_token(None)


def get_token_from_redirect_url():
    base_url = "https://auth-west.bullhornstaffing.com/oauth/authorize"

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "username": "imprimisgroupDevUser.api",
        "password": PASSWORD,
        "action": "Login",
        "redirect_uri": REDIRECT_URI,
    }

    request = requests.get(base_url, params, allow_redirects=False)
    token_url = request.headers["Location"]
    token_url = request.headers.get("Location")  # my_change
    parsed_url = urlparse(token_url)
    query_params = parse_qs(parsed_url.query)
    code = query_params.get("code")
    # return code[0]
    return code[0] if code else None  # my_change


def job_posting(job_data):
    work_location_type = (
        "onsite"
        if job_data.get("onSite") == "On-Site"
        else "hybrid" if job_data.get("onSite") == "Hybrid" else "remote"
    )

    job_posting = {
        "id": job_data.get("corelation_id"),
        "external_id": job_data.get("id"),
        "title": job_data.get("title"),
        "compensation": job_data.get("salary"),
        "city": job_data["address"].get("city"),
        "state": job_data["address"].get("state"),
        "country": job_data["address"].get("countryName"),
        "source": "Imprimis Group",
        "work_location_type": work_location_type,
        "description": job_data.get("description"),
    }

    return job_posting


def job_posting_skills(job_data):
    job_skills = job_data.get("skills").get("data")
    skills = []
    if job_skills:
        skills = [skill["name"] for skill in job_skills]
        return {"job_posting_id_id": job_data.get("corelation_id"), "skills": skills}
    return None


def clean_html(raw_html):
    cleanr = re.compile("<.*?>")  # Regex to identify HTML tags
    cleantext = re.sub(cleanr, "", raw_html)  # Remove HTML tags
    cleantext = re.sub(
        r'\sstyle="[^"]+"', "", cleantext, flags=re.I
    )  # Remove inline CSS (case insensitive)
    return cleantext


def get_industry_id(category):
    return Industry.objects.filter(title=category).values("id").first().get("id")