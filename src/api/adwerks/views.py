from datetime import date
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework.response import Response
from adwerks import service
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import AdminPermission

# Create your views here.


class AdwerkUnsubscribeMail(APIView):

    def get(self, request, email):
        mail_unsubscribe = service.unsubscribe(email)
        if mail_unsubscribe.get("status"):
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_OK)
        

class AdwerkManual(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request, job_posting_id):
        data  = request.data 
        resp = service.adwerk_manual_entry(job_posting_id,data)

        return resp
