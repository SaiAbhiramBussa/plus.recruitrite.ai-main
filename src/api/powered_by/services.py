import requests
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
from decouple import config
from candidate.aws import upload_to_aws
from payment_history.services import validate_screening_records_left
from accounts.services import get_employee_credits
from powered_by.models import PoweredByRequestAttachment, PoweredByRequest
from django.core.paginator import Paginator
import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from decouple import config
from io import BytesIO

POWERED_BY_REQUEST_BUCKET = config('POWERED_BY_REQUEST_BUCKET')

def validate_screening_subscription(request):
    files = request.FILES.getlist('resumes')
    if hasattr(request, 'company'):
        company = request.company
    else:
        company = request.user.location_id.company_id
    if request.user.role == "employer":
        is_valid, screening_records = validate_screening_records_left(company)
    elif request.user.role == 'hiring_manager':
        screening_records = get_employee_credits(request.user)
    is_valid, screening_records = validate_screening_records_left(company)
    powered_by_requests_ids = PoweredByRequest.objects.filter(company_id=company).values_list('id', flat=True)
    processing_status = ['model_processed', 'model_processing_failed', 'model_processing', 'parsing_failed',
                         'saving_failed', 'avail_credits']
    attachments_count = PoweredByRequestAttachment.objects.filter(
        powered_by_request_id__in=powered_by_requests_ids).exclude(processing_status__in=processing_status).count()
    screening_records = screening_records - attachments_count
    if screening_records < len(files):
        return Response({'error': f"Sorry, you've exhausted your screening credits. Please purchase additional credits to continue accessing screenings. You are short by {len(files) - screening_records} records. "},
                        status=status.HTTP_400_BAD_REQUEST)
    return 'Valid'


def validate_powered_by_request_data(request):
    data = request.data
    files = request.FILES.getlist('resumes')
    if not (files and len(files) > 0):
        return Response({'error': 'Please attach files in the request. '}, status=status.HTTP_400_BAD_REQUEST)

    if not (data.get('job_title') and data.get('job_description') and data.get('skills')):
        return Response({'error': 'Please provide the complete details in request for Job Posting. '}, status=status.HTTP_400_BAD_REQUEST)

    if data.get('job_title').strip() == '' or data.get('job_description').strip() == '' or data.get('skills').strip() == '':
        return Response({'error': 'Please provide the correct details in request for Job Posting. '},
                        status=status.HTTP_400_BAD_REQUEST)
    return 'Valid'


def upload_request_attachment_thread(file, bucket, file_name, powered_by_request, user=None):
    try:
        upload_to_aws(file.read(), bucket, file_name)
        request_attachment = PoweredByRequestAttachment.objects.create(powered_by_request_id=powered_by_request, s3_key=file_name, processing_status='pending', user=user)
        url = f"{config('PROCESS_QUEUE_DOMAIN')}/queue_job"

        data = {
            "request_id": str(powered_by_request.id),
            "attachment_id": str(request_attachment.id),
            "queue_name": config('RESUME_PARSER_QUEUE_NAME'),
            "s3_key": f"s3://{POWERED_BY_REQUEST_BUCKET}/{file_name}",
            "webhook_url": f"{config('API_DOMAIN')}/api/v1/powered_by/webhook"
        }
        headers = {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, json=data)
        if response.status_code == 200:
            request_attachment.processing_status = 'parsing'
            request_attachment.save()
        else:
            request_attachment.processing_status = 'parse_request_failed'
            request_attachment.save()
    except Exception as e:
        print('This is error here in method', file_name, e)
        pass


def upload_attachments_thread(files, powered_by_request, user=None):

    for item in files:
        try:
            upload_request_attachment_thread(item, POWERED_BY_REQUEST_BUCKET, f'{powered_by_request.id}/{item.name}', powered_by_request, user)
        except Exception as e:
            print('This is error here in loop', item.name, e)
            pass


def check_attachment_status(attachment):
    processing_status = attachment.processing_status
    attachment_status = 'Processing'
    if processing_status == 'parse_request_failed':
        attachment_status = 'Failed'
    elif processing_status == 'parsing_failed':
        attachment_status = 'Parsing Failed'
    elif processing_status == 'model_processing_failed' or processing_status == 'rank_request_failed':
        attachment_status = 'Ranking Failed'
    elif processing_status == 'parsing':
        attachment_status = 'Parsing'
    elif processing_status == 'model_processing':
        attachment_status = 'Ranking'
    elif processing_status == 'pending':
        attachment_status = 'Queued'
    elif processing_status == 'avail_credits':
        attachment_status = 'Avail Credits'
    elif processing_status == 'model_processed':
        attachment_status = 'Success'
    return attachment_status


def get_powered_by_request_data(powered_by_request, playground_flag, page, per_page):
    attachments_status = []
    attachments = PoweredByRequestAttachment.objects.filter(powered_by_request_id=powered_by_request).order_by('-created_at')
    
    if page and per_page:
        paginator = Paginator(attachments, per_page)
        attachments = paginator.get_page(page)
    
    for attachment in attachments:
        response = check_attachment_status(attachment)
        resume_status = {
            'id': str(attachment.id),
            'resume': attachment.s3_key.split('/', 1)[1],
            'status': response,
        }
        attachments_status.append(resume_status)
    
    if playground_flag:
        request_status = 'Parsing'
        parsing_attachments = attachments.exclude(processing_status='pending').first()
        if parsing_attachments:
            request_status = 'Completed'
    else:
        request_processing_status = powered_by_request_processing_status(powered_by_request)
        request_status = request_processing_status
    
    context = {
        'id': str(powered_by_request.id),
        'request_status': request_status,
        'request_body': powered_by_request.request_body,
        'resumes_status': attachments_status,
        'screening_response': powered_by_request.processed_response,
    }
    
    if page and per_page:
        context['current_page'] = page
        context['per_page'] = per_page
        context['total_pages'] = paginator.num_pages
        context['total_count'] = paginator.count
        
        if powered_by_request.processed_response:
            limited_screening_response = powered_by_request.processed_response[(page - 1) * per_page: page * per_page]
            context['screening_response'] = limited_screening_response

    return context


def powered_by_request_processing_status(powered_by_request):
    attachments = PoweredByRequestAttachment.objects.filter(powered_by_request_id=powered_by_request)
    for attachment in attachments:
        status = check_attachment_status(attachment)
        if status in ['Processing', 'Parsing', 'Queued', 'Ranking']:
           return 'Processing'
    return 'Completed'

def download_powered_by_request_data(powered_by_request):
    data = []
    headers = ["job_title", "name", "email", "phone", "address", "probability", "matched_skills"]
    candidates = powered_by_request.processed_response
    
    for candidate in candidates:
        candidate_data = {}
        
        first_name = candidate.get("first_name", "")
        last_name = candidate.get("last_name", "")
        
        if type(first_name) is not str:
            first_name = " ".join(first_name)
        if type(last_name) is not str:
            last_name = " ".join(last_name)
        
        candidate_data["name"] = f"{first_name} {last_name}"
        candidate_data["email"] = candidate.get("email", "")
        candidate_data["phone"] = candidate.get("phone", "")
        
        address = [
            candidate.get("address", {}).get("city", "").strip(),
            candidate.get("address", {}).get("state", "").strip(),
            candidate.get("address", {}).get("country", "").strip()
        ]
        filtered_address = [addr for addr in address if addr]
        
        candidate_data["address"] = ", ".join(filtered_address) if filtered_address else ""
        candidate_data["probability"] = round(candidate.get("accuracy", 0), 2)
        candidate_data["matched_skills"] = ""
        
        for skill in candidate.get("recommended_skills", []):
            candidate_data["matched_skills"] += f'{skill.get("skill", "")} - {skill.get("accuracy", "")}%, '
        
        candidate_data["job_title"] = powered_by_request.request_body.get("job_posting", {}).get("title", "")
        
        data.append(candidate_data)
    
    df = pd.DataFrame(data, columns=headers)
    
    return df


def generate_presigned_url(key, expires_in):
    try:
        s3_client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID, aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        client_params = {
            "Bucket": POWERED_BY_REQUEST_BUCKET,
            "Key": key
        }
        
        url = s3_client.generate_presigned_url(ClientMethod="get_object", Params=client_params, ExpiresIn=expires_in)
    except ClientError as e:
        print(f"An error occurred while generating the presigned URL: {e}")
        url = None
    
    return url

def download_file_from_s3(key):
    """
    Download a file from S3 and return it as a BytesIO object.
    """
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        buffer = BytesIO()
        s3_client.download_fileobj(POWERED_BY_REQUEST_BUCKET, key, buffer)
        buffer.seek(0)  # Reset the buffer to the start
        return buffer
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")