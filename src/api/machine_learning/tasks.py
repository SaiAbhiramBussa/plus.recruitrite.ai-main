from celery import shared_task
from celery_jobs.services import alert_create_apollo_job
from celery_jobs.models import ApolloJobs
from job_posting.models import JobPostingCandidate
from .models import MLProcess
import os
import shutil
from langchain.document_loaders import UnstructuredFileLoader
from decouple import config
from .v5_0_0 import new_model_ranking_v2

NEXT_APP_DOMAIN = config("NEXT_APP_DOMAIN_LINK")
candidate_bucket = config("CANDIDATE_POOL_BUCKET")


@shared_task
def model_ranking_scheduler():
    from machine_learning.services import email_recommended_candidates_alert, prescreen_onsite_query_result

    tasks = MLProcess.objects.filter(status="priority").order_by("created_at")
    if not tasks:
        tasks = MLProcess.objects.filter(status="pending").order_by("created_at")
    for task in tasks:
        task.status = "in_progress"
        task.save()
        result_set = prescreen_onsite_query_result(str(task.job_posting_id_id))
        if result_set is None:
            result_set = []
        task.prescreen_candidates_input = f"Prescreen Match Count : {len(result_set)}"
        task.save()

        try:
            new_model_ranking_v2(str(task.job_posting_id_id), result_set, pushed_candidates=False)
            task.status = "success"
        except Exception as e:
            print(f"Error in model ranking: {e}")
            task.status = "failed"

        task.job_posting_candidate_count = JobPostingCandidate.objects.filter(
            job_posting_id=task.job_posting_id,
            accuracy__gte=task.job_posting_id.minimum_match,
        ).count()
        task.save()
        
        mail_data = {
            "job_posting": task.job_posting_id.title,
            "company_name": task.job_posting_id.location_id.company_id.name,
            "location": task.job_posting_id.location_id.city,
            "candidate_count": task.job_posting_candidate_count,
            "output_link": f"{NEXT_APP_DOMAIN}/admin/company/{str(task.job_posting_id.location_id.company_id.id)}/job_posting/{str(task.job_posting_id.id)}/ml-output",
        }
        
        if 0 <= task.job_posting_candidate_count <= 10:
            mail_data.update(
                {
                    "image_icon": "https://cms-s3-startdate-1.s3.amazonaws.com/red-alert-icon.png"
                }
            )
            email_recommended_candidates_alert("[High]", mail_data)

        if 10 < task.job_posting_candidate_count <= 35:
            mail_data.update(
                {
                    "image_icon": "https://cms-s3-startdate-1.s3.amazonaws.com/yellow-alert-icon.png"
                }
            )
            email_recommended_candidates_alert("[Medium]", mail_data)

        if 35 < task.job_posting_candidate_count <= 50:
            mail_data.update(
                {
                    "image_icon": "https://cms-s3-startdate-1.s3.amazonaws.com/purple-alert-icon.png"
                }
            )
            email_recommended_candidates_alert("[Low]", mail_data)


@shared_task(queue="mlqueue")
def ml_push_candidate(model_name, job_posting_id, result_set, user_email=None, user_name=None,user_id=None,candidates=None,apollo_id=None):
    from machine_learning.services import email_pushed_candidates_to_ml
    from candidate.services import get_candidates_revealed

    try:
        greater_50, less_50 = new_model_ranking_v2(
            job_posting_id, result_set, pushed_candidates=True
        )
        if user_name and user_email:
            email_pushed_candidates_to_ml(greater_50, less_50, user_email, user_name)
            if (user_id and apollo_id):
                get_candidates_revealed(job_posting_id, candidates, user_id)
                apollo_obj = ApolloJobs.objects.get(id=apollo_id)
                apollo_obj.status = 'success'
                apollo_obj.save()

        return True
    except Exception as e:
        resp = {"message": f"{e}"}
        if(user_id and apollo_id):
            apollo_obj = ApolloJobs.objects.get(id=apollo_id)
            apollo_obj.status = 'failed'
            apollo_obj.save()
        return resp


@shared_task(queue="mlqueue")
def openai_push(openai_candidate, job_posting_id, DEFAULT_EMAIL, user_email, user_name):
    from machine_learning.services import (
        list_files_in_directory,
        opean_ai_csv,
        formating_openai_result,
        send_email_with_attachment,
        write_candidate_file,
        write_job_posting_file,
    )

    try:
        print("-------", openai_candidate, job_posting_id, DEFAULT_EMAIL, user_email)
        jp_path = f"ml_output_files/{job_posting_id}"

        if os.path.exists(jp_path):
            shutil.rmtree(jp_path)

        os.mkdir(jp_path)
        candidate_path = f"ml_output_files/{job_posting_id}/candidates"

        if os.path.exists(candidate_path):
            shutil.rmtree(candidate_path)

        os.mkdir(candidate_path)

        for entry in openai_candidate:
            write_candidate_file(entry, candidate_path, job_posting_id)
        write_job_posting_file(jp_path, job_posting_id)

        full_job_path = jp_path + f"/{job_posting_id}.txt"
        job_loader = UnstructuredFileLoader(full_job_path)
        job_documents = job_loader.load()

        result = list_files_in_directory(job_documents, candidate_path)
        if result:
            resp = formating_openai_result(result, job_posting_id)

            if os.path.exists(jp_path):
                shutil.rmtree(jp_path)

            # shutil.rmtree(jp_path)
            # make csv
            csv_filepath, csv_data = opean_ai_csv(resp, job_posting_id)
            send_email_with_attachment(
                from_email=DEFAULT_EMAIL,
                recipient_list=[user_email],
                attachment_path=csv_filepath,
                user_name=user_name,
                csv_data=csv_data,
            )
            return True
    except Exception as e:
        resp = {"message": f"{e}"}
        return resp
