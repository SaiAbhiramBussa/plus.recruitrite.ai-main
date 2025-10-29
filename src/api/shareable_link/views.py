from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import EmployerPermission
from job_posting.models import JobPosting
from .services import create_shareable_link, get_shareable_link
from .models import ShareableLink, ShareableCandidates
from django.core.mail import send_mail
from startdate.settings import EMAIL_CLIENT
from django.template.loader import render_to_string
from decouple import config

DEFAULT_EMAIL = config("DEFAULT_EMAIL")


class ShareableLinkView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [EmployerPermission()]
        return []

    def get_authenticators(self):
        if self.request.method == 'POST':
            return [StartdateTokenAuthentication()]
        return []
    
    def post(self, request):
        user_id = request.user.id
        company_id = str(request.user.location_id.company_id_id)
        data = request.data
        job_posting_id = data.get("job_posting_id")
        candidates_ids = data.get("candidates_ids")
        if not job_posting_id or not candidates_ids:
            message = {"Error": "Missing keys"}
            return Response(message, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.role =='employer':
            job_posting_obj = JobPosting.objects.get(id=job_posting_id)
            if str(job_posting_obj.location_id.company_id_id) != company_id:
                message = {"Error": f"Job posting not found {job_posting_id}"}
                return Response(message, status=status.HTTP_404_NOT_FOUND)

        create_link = create_shareable_link(job_posting_id, candidates_ids, user_id)

        return create_link

    def get(self, request):
        token = request.query_params.get("token")
        shareable_link_obj = ShareableLink.objects.filter(token=token)

        if not shareable_link_obj.exists():
            message = {"Error": "Invalid token"}
            return Response(message, status=status.HTTP_400_BAD_REQUEST)

        response = get_shareable_link(shareable_link_obj, request)

        return response


class RequestInterview(APIView):
    def get(self, request):
        shareable_id = request.query_params.get('shareable_id')
        candidate_id = request.query_params.get('job_posting_candidate_id')
        if not shareable_id or not candidate_id:
            return Response({'Error': "Sharable and Candidate ID are required"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            shareable_link = ShareableLink.objects.filter(id=shareable_id).first()
            shared_candidate = ShareableCandidates.objects.filter(shareable_link_id_id=shareable_id,
                                                                  job_posting_candidate_id_id=candidate_id).first()
            if not shareable_link or not shared_candidate:
                return Response({"Error": "Invalid Sharable ID or Candidate ID"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user = shareable_link.created_by
                job = shareable_link.job_posting_id
                candidate = shared_candidate.job_posting_candidate_id.candidate_id
                job_title = job.title
                data = {
                    "url": f"{config('NEXT_APP_DOMAIN_LINK')}/job/detail/{job.id}?candidate_id={candidate.id}",
                    "job_title": job_title,
                    "user_name": f"{user.first_name} {user.last_name}",
                    "candidate_name": f"{candidate.first_name} {candidate.last_name}",
                    "email": candidate.email,
                    "phone": candidate.phone
                }
                message = {
                    "senderAddress": DEFAULT_EMAIL,  
                    "recipients": {
                        "to": [{"address": user.email}]
                    },
                    "content": {
                        "subject": f"Interview Request for {job_title}",
                        "html": render_to_string("request_interview.html", data)
                    }
                }
                EMAIL_CLIENT.begin_send(message)
                return Response({"Message": "Interview Requested successfully"}, status=status.HTTP_200_OK)

