from rest_framework.views import APIView
# Create your views here.
import json
from job_posting.models import JobPostingTemplate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import threading
from company.models import Company
from integrations.models import IntegrationKey
from powered_by.models import PoweredByRequest, PoweredByWebhook, PoweredByRequestAttachment
from powered_by.services import get_powered_by_request_data, validate_powered_by_request_data, upload_attachments_thread, validate_screening_subscription
from decouple import config


class PlaygroundBaseView(APIView):

    def post(self, request):
        data = request.data
        files = request.FILES.getlist('resumes')
        model = data.get('model')
        
        template = JobPostingTemplate.objects.filter(id=data.get('template_id')).first()
        if not template:
            return Response({"error": "Invalid Job Posting Template ID"}, status=status.HTTP_400_BAD_REQUEST)
        if len(files) > 5:
            return Response({"error": "Files Exceed the Max Limit"}, status=status.HTTP_400_BAD_REQUEST)
        if not (files and len(files) > 0):
            return Response({'error': 'Please attach files in the request. '}, status=status.HTTP_400_BAD_REQUEST)

        for item in files:
            allowed_extensions = ['doc', 'pdf', 'docx']
            file_extension = item.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                return Response({'error': 'Files should be in PDF or Doc Format'})

        job_posting_body = {
            'job_posting': {
                'title': template.title,
                'description': template.description,
                'skills': template.skill
            }
        }
        headers_dict = dict(request.headers)
        headers_json = json.dumps(headers_dict)
        company = Company.objects.get(name=config('PLAYGROUND_COMPANY'))
        integration = IntegrationKey.objects.get(company_id=company)
        api_key = integration.key
        powered_by_request = PoweredByRequest.objects.create(company_id=company, request_body=job_posting_body,
                                                             request_method='Post', api_key=api_key,
                                                             request_headers=headers_json, host=request.headers['Host'], model=model)
        thread = threading.Thread(target=upload_attachments_thread, args=(files, powered_by_request))
        thread.start()
        context = {
            'total_profiles': len(files), 'status': 'Queued', 'request_id': str(powered_by_request.id)
            }
        powered_by_request.api_response = context
        powered_by_request.save()
        thread.join()
        return Response(context, status=status.HTTP_200_OK)


class SpecificPlaygroundBaseView(APIView):
    def get(self, request, powered_by_request_id):
        company = Company.objects.get(name=config('PLAYGROUND_COMPANY'))
        try:
            powered_by_request = PoweredByRequest.objects.get(id=powered_by_request_id)
            if not powered_by_request.company_id == company:
                return Response({'error': 'Request id is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response({'error': 'Request id is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        context = get_powered_by_request_data(powered_by_request, True, None, None)
        return Response(context, content_type='application/json')
