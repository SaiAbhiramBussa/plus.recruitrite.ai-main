from celery_jobs.models import ApolloJobs
from machine_learning.models import MLProcess

def alert_create_apollo_job(job_posting):
    location = job_posting.location_id
    query_location = location.country
    ApolloJobs.objects.create(page_number=1, fetch_limit=10, status='pending', apollo_api_titles=job_posting.title,
                                  apollo_api_locations=query_location)
   
