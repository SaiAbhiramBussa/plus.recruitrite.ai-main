from rest_framework.response import Response
from rest_framework import status
from machine_learning.services import complete_candidate_data, shareable_link_candidate_card
from candidate.services import job_posting_match_skill
from job_posting.models import JobPostingCandidate, JobPosting, JobPostingSkill, Skill, JobPostingReveals
from job_posting.serializers import (
    OfferSerializer,
    SkillSerializer,
)
from company.models import Subscription
from payment_history.services import masked_candidate_data
from .models import ShareableLink, ShareableCandidates
import uuid
from decouple import config

NEXT_APP_DOMAIN_LINK = config("NEXT_APP_DOMAIN_LINK")


def create_shareable_link(job_posting_id, candidate_ids, user_id):
    token = str(uuid.uuid4())
    share_obj = ShareableLink.objects.create(
        job_posting_id_id=job_posting_id, created_by_id=user_id, token=token
    )

    job_posting_cad_obj = JobPostingCandidate.objects.filter(
        job_posting_id_id=job_posting_id, candidate_id_id__in=candidate_ids
    )
    if not job_posting_cad_obj.exists():
        message = {"Error": "No job posting candidates found"}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)

    for job_posting_candidate in job_posting_cad_obj:
        shareable_obj, flag = ShareableCandidates.objects.get_or_create(
            job_posting_candidate_id_id=job_posting_candidate.id,
            shareable_link_id_id=share_obj.id,
        )

    resp_context = {
        "url": f"{NEXT_APP_DOMAIN_LINK}/shareable/candidates/{share_obj.token}"
    }

    return Response(resp_context, status=status.HTTP_200_OK)


def get_shareable_link(shareable_link_obj, request):
    shareable_id = shareable_link_obj.first().id
    job_posting_id = shareable_link_obj.first().job_posting_id

    shareable_candidates_obj = ShareableCandidates.objects.filter(
        shareable_link_id=shareable_id
    )

    job_posting_candidate_ids = [
        obj.job_posting_candidate_id for obj in shareable_candidates_obj
    ]
    if job_posting_id.location_id.company_id.candidate_scope and job_posting_id.location_id.company_id.candidate_scope == 'self':
        candidates_response = []
        for job_posting_candidate in job_posting_candidate_ids:
            candidate_data = job_posting_candidate.candidate_id
            masked_candidate = shareable_link_candidate_card(candidate_data)
            masked_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                     'is_revealed': True, 'accuracy': job_posting_candidate.accuracy})
            recommended_skill = job_posting_match_skill(candidate_data.id, job_posting_id, False)
            if recommended_skill:
                masked_candidate.update({'recommended_skill': recommended_skill})
            candidates_response.append(masked_candidate)
    else:
        if Subscription.objects.filter(job_posting_id_id=job_posting_id).exists():
            response = fetch_sourced_fullservice_candidates(job_posting_candidate_ids, job_posting_id)
        else:
            response = fetch_sourced_candidates(job_posting_candidate_ids, job_posting_id)
        candidates_response = response.get('candidates')
    resp_candidate = {
        "shareable_id": shareable_id,
        "candidates": candidates_response,
        "job_posting_data": job_fetch(job_posting_id, request),
        "company": {'logo': job_posting_id.location_id.company_id.logo,'name':job_posting_id.location_id.company_id.name}
    }
    return Response(
        resp_candidate, content_type="application/json", status=status.HTTP_200_OK
    )


def fetch_sourced_fullservice_candidates(job_posting_candidate_ids, job_posting_id):
    candidates_response = []
    for job_posting_candidate in job_posting_candidate_ids:
        candidate_data = job_posting_candidate.candidate_id
        complete_candidate = complete_candidate_data(candidate_data)
        complete_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                    'is_revealed': True, 'accuracy': job_posting_candidate.accuracy})
        recommended_skill = job_posting_match_skill(candidate_data.id, job_posting_id, False)
        if recommended_skill:
            complete_candidate.update({'recommended_skill': recommended_skill})
        candidates_response.append(complete_candidate)
    response = {"candidates": candidates_response}
    return response


def fetch_sourced_candidates(job_posting_candidate_ids, job_posting_id):
    candidates_response = []
    candidates_reveals = JobPostingReveals.objects.filter(job_posting_id_id=job_posting_id).values_list('candidate_id_id',flat=True)
    for job_posting_candidate in job_posting_candidate_ids:
        candidate_data = job_posting_candidate.candidate_id
        if candidate_data.id in candidates_reveals:
            complete_candidate = complete_candidate_data(candidate_data)
            complete_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                       'is_revealed': True, 'accuracy': job_posting_candidate.accuracy})
            recommended_skill = job_posting_match_skill(candidate_data.id, job_posting_id, False)
            if recommended_skill:
                complete_candidate.update({'recommended_skill': recommended_skill})
            candidates_response.append(complete_candidate)
        else:
            masked_candidate = masked_candidate_data(candidate_data)
            masked_candidate.update({'job_posting_candidate_id': str(job_posting_candidate.id),
                                     'is_revealed': False, 'accuracy': job_posting_candidate.accuracy})
            recommended_skill = job_posting_match_skill(candidate_data.id, job_posting_id, False)
            if recommended_skill:
                masked_candidate.update({'recommended_skill': recommended_skill})
            candidates_response.append(masked_candidate)

    response = {"candidates": candidates_response}
    return response


def job_fetch(job_posting_id, request):
    data = JobPosting.objects.filter(id=job_posting_id.id).first()
    company = data.location_id.company_id
    serializer = OfferSerializer(data)

    job_posting_skill_data = JobPostingSkill.objects.filter(
        job_posting_id=job_posting_id.id
    )
    skills = []
    skills_list = ""
    for job_posting_skill in job_posting_skill_data:
        skill_id = job_posting_skill.skill_id_id
        skill = Skill.objects.get(id=skill_id)
        skill_serializer = SkillSerializer(skill)
        skills.append(skill_serializer.data["name"])
        if skills_list != "":
            skills_list = skills_list + "," + skill_serializer.data["name"]
        elif skills_list == "":
            skills_list = skills_list + skill_serializer.data["name"]

    context = {
        "id": job_posting_id.id,
        "title": serializer.data["title"],
        "compensation": serializer.data["compensation"],
        "description": serializer.data["description"],
        "skills": skills,
        "workLocation": serializer.data["work_location_type"],
        "city": serializer.data["city"] or "",
        "country": serializer.data["country"] or "",
        "state": serializer.data["state"] or "",
        "zip": serializer.data["zip"] if serializer.data["zip"] else "",
        "companyName": company.name,
        "status": serializer.data["status"],
        "skillsList": skills_list,
        "remoteType": serializer.data["remote_type"]
        if serializer.data["remote_type"]
        else "",
    }
    return context
