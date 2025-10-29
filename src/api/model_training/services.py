import requests
from requests.exceptions import RequestException
from datetime import date
from django.db.models import Max
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from decouple import config
from machine_learning.services import complete_candidate_data

# models imports
from model_training.models import TrainedTitle
from job_posting.models import JobPosting, JobPostingSkill, Skill
from company.models import Location, Company
from machine_learning.models import MLTrainingData
from candidate.models import Candidate
from startdate.settings import EMAIL_CLIENT


NEXT_APP_DOMAIN = config("NEXT_APP_DOMAIN_LINK")
ENVIRONMENT = config("ENVIRONMENT")
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
QUEUE_NAME = config("MODEL_TRAINING_QUEUE_NAME")
WEBHOOK_URL = f"{config('API_DOMAIN')}/api/model_training/webhook"
PROCESS_QUEUE_DOMAIN = config("PROCESS_QUEUE_DOMAIN")

HEADERS = {"Cache-Control": "no-cache", "Content-Type": "application/json"}


def create_training_record(title, job_posting_id):
    print(title, job_posting_id)
    if title and job_posting_id:
        trained_obj = TrainedTitle.objects.filter(title=title)
        if not trained_obj.exists():
            trained_obj = TrainedTitle.objects.create(
                title=title, job_posting_id_id=job_posting_id, status="pending", major_version= 4 , is_active = False
            )
            training_title_alert(title, job_posting_id)
        context = {"trained_obj": trained_obj}
        return context
    else:
        message = {"Error": "title or job_posting_id missing"}
        return message


def training_title_alert(title, job_posting_id):
    job_posting_obj = JobPosting.objects.filter(id=job_posting_id).first()
    location_obj = Location.objects.filter(id=job_posting_obj.location_id_id).first()
    company_obj = Company.objects.filter(id=location_obj.company_id_id).first()
    mail_data = {
        "job_posting": title,
        "company_name": company_obj.name,
        "location": location_obj.city,
        "output_link": f"{NEXT_APP_DOMAIN}/admin/company/{str(company_obj.id)}/job_posting/{job_posting_id}/ml-output",
    }
    mail_data.update(
        {"image_icon": "https://cms-s3-startdate-1.s3.amazonaws.com/red-alert-icon.png"}
    )
    email_body = render_to_string("training_alert.html", mail_data)
    subject_data = {"title": title}
    subject = render_to_string("subject.txt", subject_data)
    to_email = DEFAULT_EMAIL if ENVIRONMENT == "Production" else "gmudumuntala@navtech.io"
    from_email = DEFAULT_EMAIL
    message = {
            "senderAddress": from_email,  
            "recipients": {
                "to": [{"address": to_email}]
            },
            "content": {
                "subject": subject,
                "html": email_body,
            }
    }
    EMAIL_CLIENT.begin_send(message)


def training_data(job_posting_id):
    title_trained_obj = TrainedTitle.objects.filter(
        job_posting_id_id=job_posting_id
    ).first()
    if (
        title_trained_obj
        and title_trained_obj.status == "pending"
        and title_trained_obj.major_version == 4
        and title_trained_obj.minor_version is None
    ):
        training_data_obj = MLTrainingData.objects.filter(
            job_posting_id_id=job_posting_id
        )
        candidate_data_list = []
        if not training_data_obj.exists():
            message = {
                "Error": f"No training data found for this job_id {job_posting_id}"
            }
            return message

        if len(training_data_obj) < 30:
            message = {"Error": f"Training data count is less than 30 {job_posting_id}"}
            return message

        for data_obj in training_data_obj:
            canidate_obj = Candidate.objects.get(id=data_obj.candidate_id_id)
            candidate_data = complete_candidate_data(canidate_obj)
            candidate_data = custom_serializer(candidate_data)
            if data_obj.target_label:
                candidate_data["target"] = data_obj.target_label
                candidate_data_list.append(candidate_data)

        job_posting = training_job_posting_data(job_posting_id)
        response_context = {
            "job_posting": job_posting,
            "training_candidate_data": candidate_data_list,
        }
        return response_context
    else:
        job_obj = JobPosting.objects.get(id=job_posting_id)
        error_title = title_trained_obj.title if title_trained_obj else job_obj.title
        return {"Error": f"Model already trained on this title {error_title}"}


def training_job_posting_data(job_posting_id):
    job_posting_context = {}
    job_posting_obj = JobPosting.objects.get(id=job_posting_id)
    job_posting_context["title"] = job_posting_obj.title
    job_posting_context["description"] = job_posting_obj.description
    job_posting_context["skills"] = ""
    job_skill_obj = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)
    if job_skill_obj.exists():
        skill_list = []
        for job_skill in job_skill_obj:
            skill_obj = Skill.objects.get(id=job_skill.skill_id_id)
            skill_list.append(skill_obj.name)

        job_posting_context["skills"] = ",".join(skill_list)
    return job_posting_context


def custom_serializer(data):
    if isinstance(data, dict):
        return {k: custom_serializer(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [custom_serializer(item) for item in data]
    elif isinstance(data, date):
        return data.isoformat()
    elif data is None:
        return "null"
    else:
        return data


def push_training_data_queue(data_context, job_posting_id):
    major_version = 4
    minor_version = 0
    minor_version__max = TrainedTitle.objects.aggregate(Max('minor_version'))['minor_version__max']
    major_version__max = TrainedTitle.objects.aggregate(Max('major_version'))['major_version__max']
    if minor_version__max and major_version__max:
        major_version = major_version__max
        minor_version = minor_version__max
    try:
        api_request_data = {
            "queue_name": QUEUE_NAME,
            "webhook_url": WEBHOOK_URL,
            "job_id": str(job_posting_id),
            "job_posting": data_context["job_posting"],
            "training_candidate_data": data_context["training_candidate_data"],
            "model_version": {
                "major_version": major_version,
                "minor_version": minor_version,
            },
        }
        url = f"{PROCESS_QUEUE_DOMAIN}/queue_job"
        try:
            response = requests.post(url, headers=HEADERS, json=api_request_data)
            response.raise_for_status()
            return {"success": True, "message": "Success"}
        except requests.exceptions.HTTPError as http_err:
            print(f"HTTP error occurred: {http_err}")
            return {"success": False, "error": str(http_err)}
        except RequestException as req_err:
            print(f"Network-related error occurred: {req_err}")
            return {"success": False, "error": "Network error occurred"}
        except Exception as e:
            print("An unexpected error occurred during the API request.")
            return {"success": False, "error": str(e)}
    except Exception as e:
        print("An unexpected error occurred : ", e)
        return {"success": False, "error": str(e)}


def webhook_processing(data):
    payload = data.get("payload", {})
    status = payload.get("status", "")
    job_id = payload.get("job_id", "")
    model_version = payload.get(
        "model_version", {"major_version": 4, "minor_version": 0}
    )
    model_s3_path = payload.get("model_s3_path", "")
    model_s3_path = f"s3.console.aws.amazon.com/s3/buckets/pretrained-startdate-model?region=us-west-1&prefix={str(model_version['major_version'])}/{str(model_version['minor_version'])}/"

    try:
        trained_title_obj = TrainedTitle.objects.get(job_posting_id_id=job_id)
        trained_title_obj.status = status
        trained_title_obj.major_version = model_version["major_version"]
        trained_title_obj.minor_version = model_version["minor_version"]
        trained_title_obj.model_s3_path = model_s3_path
        trained_title_obj.save()
    except TrainedTitle.DoesNotExist:
        print(f"No trained title object found for job_id {job_id}")
    except Exception as e:
        print(f"An error occurred while processing the webhook: {e}")
