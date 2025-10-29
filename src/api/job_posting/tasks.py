from celery import shared_task
from django.db import connection
import random
import json
from candidate.aws import client_s3
from candidate.models import (
    CandidateSkill,
    Candidate,
    CandidateAttributes,
    CandidateWorkHistory,
    CandidateEducationHistory,
)
from company.models import Company, Location
from job_posting.models import Skill, JobPosting, JobPostingSkill, OtherCandidates
from job_posting.services import other_candidates_csv_read
from machine_learning.models import MLProcess
from job_posting.models import JobPostingCandidate, JobPostingCandidateSkill, Skill
import os
import shutil
from django.conf import settings


@shared_task()
def process_candidates(job_posting_id, work_location_type):

    if work_location_type == "remote":
        query = """
            SELECT c.id, cs.id, ca.id, jps.id, jp.id, jps.skill_id_id, s."name", cs.skill_id_id, c.email, c.first_name, c.last_name, ca.city, ca."state" FROM candidate c
            INNER JOIN candidate_attributes ca ON c.id = ca.candidate_id_id
            INNER JOIN candidate_skill cs ON cs.candidate_id_id = c.id
            INNER JOIN job_posting_skill jps ON jps.skill_id_id = cs.skill_id_id
            INNER JOIN job_posting jp ON jp.id = jps.job_posting_id_id
            INNER JOIN skill s ON cs.skill_id_id = s.id
            WHERE jp.id = %s AND jp.work_location_type = 'remote'
        """
    else:
        query = """
            SELECT c.id, c.email, c.first_name, c.last_name, ca.city, ca."state", s."name"
            FROM candidate c
            INNER JOIN candidate_attributes ca ON c.id = ca.candidate_id_id
            INNER JOIN location l ON ca."state" = l."state"
            INNER JOIN job_posting jp ON jp.location_id_id = l.id
            INNER JOIN candidate_skill cs ON cs.candidate_id_id = c.id
            INNER JOIN job_posting_skill jps ON jps.job_posting_id_id = jp.id
            INNER JOIN skill s ON cs.skill_id_id = s.id
            WHERE jp.id = %s AND jp.work_location_type <> 'remote'
        """
    with connection.cursor() as cursor:
        cursor.execute(query, (job_posting_id,))
        result = cursor.fetchall()

    for candidate in result:
        if not JobPostingCandidate.objects.filter(
            job_posting_id_id=job_posting_id, candidate_id_id=candidate[0]
        ).exists():
            jp_candidate_obj = JobPostingCandidate.objects.create(
                job_posting_id_id=job_posting_id,
                candidate_id_id=candidate[0],
                accuracy=round(random.random() * 100, 2),
            )
        skill_obj = Skill.objects.filter(name=candidate[6]).first()
        candidate_skill_obj = CandidateSkill.objects.filter(
            skill_id_id=skill_obj.id, candidate_id_id=candidate[0]
        ).first()
        if not JobPostingCandidateSkill.objects.filter(
            job_posting_candidate_id_id=jp_candidate_obj.id,
            candidate_skill_id_id=candidate_skill_obj.id,
        ).exists():
            JobPostingCandidateSkill.objects.create(
                job_posting_candidate_id_id=jp_candidate_obj.id,
                candidate_skill_id_id=candidate_skill_obj.id,
                accuracy=round(random.random() * 100, 2),
            )


@shared_task()
def process_candidates_into_ml(job_posting_id, work_location_type):
    # response = []
    if work_location_type == "remote":
        query = """
            SELECT Distinct c.id FROM candidate c
            INNER JOIN candidate_attributes ca ON c.id = ca.candidate_id_id
            INNER JOIN candidate_skill cs ON cs.candidate_id_id = c.id
            INNER JOIN job_posting_skill jps ON jps.skill_id_id = cs.skill_id_id
            INNER JOIN job_posting jp ON jp.id = jps.job_posting_id_id
            INNER JOIN skill s ON cs.skill_id_id = s.id
            WHERE jp.id = %s AND jp.work_location_type = 'remote'
        """
    else:
        query = """
            SELECT Distinct c.id
            FROM candidate c
            INNER JOIN candidate_attributes ca ON c.id = ca.candidate_id_id
            INNER JOIN location l ON ca."state" = l."state"
            INNER JOIN job_posting jp ON jp.location_id_id = l.id
            INNER JOIN candidate_skill cs ON cs.candidate_id_id = c.id
            INNER JOIN job_posting_skill jps ON jps.job_posting_id_id = jp.id
            INNER JOIN skill s ON cs.skill_id_id = s.id
            WHERE jp.id = %s AND jp.work_location_type <> 'remote'
        """
    with connection.cursor() as cursor:
        cursor.execute(query, (job_posting_id,))
        result_set = cursor.fetchall()
    jp_path = f"prescreened_files/{job_posting_id}"
    os.mkdir(jp_path)
    candidate_path = f"prescreened_files/{job_posting_id}/candidates"
    os.mkdir(candidate_path)
    candidate_response = []
    for entry in result_set:
        candidate_skills = []
        candidate_skill_names = []
        candidate = Candidate.objects.get(id=entry[0])
        candidate_id = str(candidate.id)
        skills_id = CandidateSkill.objects.filter(candidate_id_id=candidate_id)
        for skill_id in skills_id:
            skill = Skill.objects.get(id=skill_id.skill_id_id)
            candidate_skill_names.append(skill.name)
            candidate_skills.append(
                {"skill": skill.name, "candidate_skill_id": str(skill_id.id)}
            )
        candidate_attributes = CandidateAttributes.objects.get(
            candidate_id_id=candidate_id
        )
        address = {
            "id": str(candidate_attributes.id),
            "address": candidate_attributes.address,
            "city": candidate_attributes.city,
            "state": candidate_attributes.state,
        }
        work_history_list = []
        work_history_data = CandidateWorkHistory.objects.filter(
            candidate_id_id=candidate_id
        )
        for work_history in work_history_data:
            company = Company.objects.get(id=work_history.company_id_id)
            work_history_list.append(
                {
                    "id": str(work_history.id),
                    "title": work_history.title,
                    "company": company.name,
                    "description": work_history.description,
                    "from_date": work_history.from_date,
                    "to_date": work_history.to_date,
                }
            )
        education_history_list = []
        education_history_data = CandidateEducationHistory.objects.filter(
            candidate_id_id=candidate_id
        )
        for education_history in education_history_data:
            education_history_list.append(
                {
                    "id": str(education_history.id),
                    "name": education_history.name,
                    "degree": education_history.degree,
                    "from_date": education_history.from_date,
                    "to_date": education_history.to_date,
                }
            )

        candidate_data = {
            "candidate_id": candidate_id,
            "skills": candidate_skills,
            "address": address,
            "work_history": work_history_list,
            "education_history": education_history_list,
        }
        candidate_response.append(candidate_data)
        with open(f"{candidate_path}/{candidate_id}.txt", "w") as f:
            f.write(f"Candidate Id: {candidate_id}\n")
            f.write(f"Job Posting Id: {job_posting_id}\n")
            f.write(f"Candidate Name: {candidate.first_name}\n")
            f.write(f"Summary: {candidate.summary}\n")
            f.write(f"Tags: {candidate.tags}\n")
            f.write(f'Address: {address["city"] + ", " + address["state"]}\n')
            f.write(f'Skills: {", ".join(candidate_skill_names)}\n')
            f.write(f"# Work History:\n")
            for wh in work_history_list:
                f.write(f'* Title: {wh["title"]}\n')
                f.write(f'  Company: {wh["company"]}\n')
                f.write(f'  Description: {wh["description"]}\n')
                f.write(f'  From Date: {wh["from_date"]}\n')
                f.write(f'  To Date: {wh["to_date"]}\n')
            f.write(f"# Education History:\n")
            for eh in education_history_list:
                f.write(f'* School Name: {eh["name"]}\n')
                f.write(f'  Degree: {eh["degree"]}\n')
                f.write(f'  From Date: {eh["from_date"]}\n')
                f.write(f'  To Date: {eh["to_date"]}\n')

    job_posting = JobPosting.objects.get(id=job_posting_id)
    location = Location.objects.get(id=job_posting.location_id_id)
    location = {
        "address": location.address,
        "city": location.city,
        "state": location.state,
    }
    job_posting_skills = []
    skills = []
    skill_names = []
    jp_skills_id = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)
    for jp_skill_id in jp_skills_id:
        skill = Skill.objects.get(id=jp_skill_id.skill_id_id)
        skill_names.append(skill.name)
        job_posting_skills.append(
            {"skill": skill.name, "job_posting_skill_id": str(jp_skill_id.id)}
        )
    job_posting_response = {
        "id": job_posting_id,
        "title": job_posting.title,
        "compensation": job_posting.compensation,
        "description": job_posting.description,
        "work_location_type": job_posting.work_location_type,
        "contract_type": job_posting.contract_type,
        "location": location,
        "skills": job_posting_skills,
    }
    with open(f"{jp_path}/{job_posting_id}.txt", "w") as f:
        f.write(f"Job Posting Id: {job_posting_id}\n")
        f.write(f"Job Title: {job_posting.title}\n")
        f.write(f"Job Description: {job_posting.description}\n")
        f.write(f"Compensation: {job_posting.compensation}\n")
        f.write(f"Work Location Type: {job_posting.work_location_type}\n")
        f.write(f'Location: {location["city"] + ", " + location["state"]}\n')
        f.write(f'Skills: {", ".join(skill_names)}\n')

    shutil.make_archive(jp_path, "zip", jp_path)
    client_s3.upload_file(
        f"prescreened_files/{job_posting_id}.zip",
        settings.AWS_STORAGE_BUCKET_NAME,
        f"job_posting_ml_data/{job_posting_id}.zip",
    )
    shutil.rmtree(jp_path)
    os.unlink(f"prescreened_files/{job_posting_id}.zip")
    job_posting_response_json = json.dumps(job_posting_response, default=str)
    candidate_response_json = json.dumps(candidate_response, default=str)
    MLProcess.objects.create(
        job_posting_id_id=job_posting_id,
        prescreen_candidates_input=f"job_posting_ml_data/{job_posting_id}.zip",
        job_description_input=job_posting_response_json,
        status="unprocessed",
    )
