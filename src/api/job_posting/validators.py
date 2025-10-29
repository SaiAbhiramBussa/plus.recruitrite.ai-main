from job_posting.models import JobPosting, JobPostingLabelWeight
from candidate.models import Candidate
from rest_framework.response import Response
from rest_framework import status


def validate_job_ids(job_posting_id):
    job_obj = JobPosting.objects.filter(id=job_posting_id).first()
    if job_obj:
        return job_obj
    else:
        return Response({"message": f"Invalid Job id {job_posting_id}"}, status=status.HTTP_400_BAD_REQUEST)  
    

def validate_candidate_ids(candidate_id):
    cand_obj = Candidate.objects.filter(id=candidate_id).first()
    if cand_obj:
        return cand_obj
    else:
        return Response({"message": f"Invalid Candidate id {candidate_id}"}, status=status.HTTP_400_BAD_REQUEST)  
