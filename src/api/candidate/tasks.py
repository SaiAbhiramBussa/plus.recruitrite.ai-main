from celery import shared_task

from machine_learning.services import complete_candidate_data
from startdate import settings
from .models import Candidate
from .services import people_search_api_call
from celery_jobs.models import ApolloJobs
from django.db.models import F
from celery_jobs.models import ApolloJobRecords


@shared_task()
def apollo_candidate_extract():
    jobs = ApolloJobs.objects.filter(status='pending')
    for job in jobs:
        object_ins_here = ApolloJobs.objects.get(id=job.id)
        if object_ins_here.status != 'paused':
            job.status = 'in_progress'
            job.save()
        if object_ins_here.job:
            try:
                people_search_api_call(job.page_number, job.apollo_api_titles, job.apollo_api_locations, job.apollo_account_label_ids, object_ins_here.job_id, object_ins_here.fetch_limit, object_ins_here.created_by,object_ins_here.id)
            except Exception as e:
                print(f"Exception for job: {object_ins_here.job_id} {str(e)}")
                job.status = 'failed'
                job.save()
        else:
            while job.page_number <= job.fetch_limit:
                object_ins = ApolloJobs.objects.get(id=job.id)
                if object_ins.status != 'in_progress':
                    break

                counts = people_search_api_call(job.page_number, job.apollo_api_titles, job.apollo_api_locations, job.apollo_account_label_ids)
                if counts['people_empty']:
                    job.status = 'success'
                    job.save()
                    break
                if not ApolloJobRecords.objects.filter(apollo_job_id=job.id).exists():
                    ApolloJobRecords.objects.create(records_inserted=counts['created_count'], records_updated=counts['updated_count'], records_failed=counts['failed_count'], apollo_job_id=job.id)
                else:
                    record = ApolloJobRecords.objects.get(apollo_job_id=job.id)
                    record.records_inserted = record.records_inserted + counts['created_count']
                    record.records_updated = record.records_updated + counts['updated_count']
                    record.records_failed = record.records_failed + counts['failed_count']
                    record.save()
                if job.page_number == job.fetch_limit:
                    break
                if object_ins.status == 'in_progress':
                    page_number = job.page_number + 1
                    job.page_number = page_number
                    job.save()
            if job.page_number == job.fetch_limit:
                job.status = 'success'
                job.save()
