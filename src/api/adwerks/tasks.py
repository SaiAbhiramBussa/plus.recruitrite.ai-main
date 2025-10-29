import json
import datetime
import boto3
from decouple import config
from celery import shared_task
from adwerks.service import adwerks_mail_service, fetch_object_from_s3_url_with_retry, adwerks_job_posting_creation, find_matching_jobs_for_candidate , adwerk_manual_entry
from job_posting.models import JobPostingCandidate, JobPostingCandidateSkill, Skill , JobPostingSkill
from candidate.models import Candidate ,CandidateSkill
from company.models import Location
from adwerks.models import AdwerkMailRecords

ENVIRONMENT = config("ENVIRONMENT")
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
S3_ADWERK_URL = config("S3_ADWERK_URL")


@shared_task()
def send_adwerk_mail():
    print("Adwerk email job Started")
    from_email = DEFAULT_EMAIL
    user_job_pairs = find_matching_jobs_for_candidate(source="Adwerk")

    for user_job in user_job_pairs:
        potential_candidates = []
        user, job_posting = user_job[0], user_job[1]

        print("user: ",user,"job_posting :",job_posting)

        location_obj = Location.objects.get(id=job_posting.location_id_id)

        job_posting_candidate = JobPostingCandidate.objects.filter(
            job_posting_id_id=job_posting.id).order_by("-accuracy")[:4]

        for job_cad in job_posting_candidate:
            candidate_obj = Candidate.objects.get(id=job_cad.candidate_id_id)
            job_post_cad_dict = {}
            job_post_cad_dict["first_name_cad"] = candidate_obj.first_name
            job_post_cad_dict["loc"] = location_obj.state
            job_post_cad_dict["picture"] = candidate_obj.picture if candidate_obj.picture else None
            job_post_cad_dict["accuracy"] = round(job_cad.accuracy)

            job_posting_candidate_skill = JobPostingCandidateSkill.objects.filter(job_posting_candidate_id_id=job_cad.id)

            skill_list = []
            if job_posting_candidate_skill.exists():
                
                for candidate_skill in job_posting_candidate_skill:
                    if candidate_skill.candidate_skill_id_id:
                        candidate_skill_obj = CandidateSkill.objects.filter(id=candidate_skill.candidate_skill_id_id).first()

                        skill_obj = Skill.objects.get(id=candidate_skill_obj.skill_id_id)
                        skill_list.append(skill_obj.name)
                    else:
                        skill_list.append(candidate_skill.skill_name)

                
                job_post_cad_dict["skill"] = skill_list



            potential_candidates.append(job_post_cad_dict)
        

        if potential_candidates:
            if len(potential_candidates) > 3 and len(potential_candidates) < 6:
                potential_candidates = potential_candidates[:3]
                adwerks_mail_service(ENVIRONMENT,from_email,potential_candidates,user,job_posting,location_obj)
            
            elif len(potential_candidates) >= 6:
                potential_candidates = potential_candidates[:6]
                
                adwerks_mail_service(ENVIRONMENT,from_email,potential_candidates,user,job_posting,location_obj)
        else:
            print("no matched candidate found : ",
                  job_posting.title, job_posting.id)




@shared_task()
def monthly_adwerk_jobs():
    try:
        # Get json file using s3 url
        url = S3_ADWERK_URL
        object_contents = fetch_object_from_s3_url_with_retry(url)
        if object_contents:
            object_contents = json.loads(object_contents)
            print(object_contents)
            try:
                adwerks_job = adwerks_job_posting_creation(object_contents)
            except Exception as e:
                raise e
        else:
            raise FileNotFoundError("File not found on s3")
    except Exception as e:
        raise e


@shared_task()
def manual_adwerk_mail():
    try:
        adwerk_mail_obj = AdwerkMailRecords.objects.filter(type='Manual')
        
        if adwerk_mail_obj.exists():
            for adwerk in adwerk_mail_obj:
                job_posting_id = adwerk.job_posting_id_id
                adwerk_manual = adwerk_manual_entry(job_posting_id)
    except Exception as e:
        print(e)
