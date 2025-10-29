from datetime import datetime, timezone, timedelta
import json, threading, tempfile, os, shutil
from django.db.models import Sum
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from accounts.services import IntegrationKeyAuthentication, StartdateTokenAuthentication
from job_posting.permissions import EmployerPermission
from powered_by.models import PoweredByRequest, PoweredByWebhook, PoweredByRequestAttachment
from powered_by.serializers import PoweredByRequestGetSerializer
from powered_by.services import download_powered_by_request_data, generate_presigned_url, validate_powered_by_request_data, upload_attachments_thread, \
    validate_screening_subscription, get_powered_by_request_data, download_file_from_s3
from decouple import config
from django.db.models import F
from dateutil import parser
from datetime import date
from django.http import HttpResponse
from PyPDF2 import PdfReader, PdfWriter, PageObject, Transformation
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.conf import settings
import boto3
import tempfile
from botocore.exceptions import NoCredentialsError
POWERED_BY_REQUEST_BUCKET = config('POWERED_BY_REQUEST_BUCKET')


class PoweredByRequestView(APIView):
    authentication_classes = (StartdateTokenAuthentication, IntegrationKeyAuthentication,)
    permission_classes = (EmployerPermission,)
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        if hasattr(request, 'company'):
            company = request.company
        else:
            company = request.user.location_id.company_id

        to_date = datetime.now(timezone.utc)
        from_date = to_date - timedelta(days=1)
        try:
            if request.query_params.get('from_date'):
                from_date = request.query_params.get('from_date')
                from_date = parser.parse(from_date)
                from_date = from_date.astimezone(timezone.utc)
            if request.query_params.get('to_date'):
                to_date = request.query_params.get('to_date')
                to_date = parser.parse(to_date)
                to_date = to_date.astimezone(timezone.utc)
        except Exception as e:
            print(e)
            pass
        from_date = from_date.replace(minute=00, second=00, microsecond=00)
        if to_date < from_date:
            return Response({'error': 'From Date cannot be greater than To Date'}, status=status.HTTP_400_BAD_REQUEST)

        requests_dataset = PoweredByRequest.objects.filter(company_id=company, created_at__range=(from_date, to_date)).order_by('-created_at')
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(requests_dataset, per_page)
        requests = paginator.get_page(page_number)
        serializer = PoweredByRequestGetSerializer(instance=requests, many=True)
        response = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "powered_by_requests": serializer.data,
        }
        return Response(response, content_type='application/json')

    def post(self, request):
        data = request.data
        files = request.FILES.getlist('resumes')
        model = data.get('model')

        if model:
            if model not in [config('STARTDATE_V4_MODEL'), config('STARTDATE_V5_MODEL'), config('OPEN_AI_MODEL')]:
                return Response({'error': 'Model name is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            model = config('STARTDATE_V5_MODEL')

        validation_response = validate_powered_by_request_data(request)
        if isinstance(validation_response, Response):
            return validation_response

        validation_response = validate_screening_subscription(request)
        if isinstance(validation_response, Response):
            return validation_response

        for item in files:
            allowed_extensions = ['doc', 'pdf', 'docx']
            file_extension = item.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                return Response({'error': 'Files should be in PDF or Doc Format'})
        
        job_posting_body = {
            'job_posting': {
                'title': data.get('job_title'),
                'description': data.get('job_description'),
                'skills': data.get('skills')
            }
        }
        headers_dict = dict(request.headers)
        headers_json = json.dumps(headers_dict)
        if hasattr(request, 'company'):
            api_key = request.integration_key.key
            company = request.company
        else:
            api_key = None
            company = request.user.location_id.company_id
        powered_by_request = PoweredByRequest.objects.create(company_id=company, request_body=job_posting_body, request_method='Post', api_key=api_key, request_headers=headers_json, host=request.headers['Host'], model=model)
        thread = threading.Thread(target=upload_attachments_thread, args=(files, powered_by_request, request.user))
        thread.start()
        context = {
                'total_profiles': len(files), 'status': 'Processing', 'request_id': str(powered_by_request.id),
                'request_url': f'{config("API_DOMAIN")}/api/v1/powered_by/screen/{str(powered_by_request.id)}'}
        powered_by_request.api_response = context
        powered_by_request.save()
        thread.join()
        return Response(context, status=status.HTTP_200_OK)


class PoweredBySpecificRequestView(APIView):
    authentication_classes = (StartdateTokenAuthentication, IntegrationKeyAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, request_id):
        page_number = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 50))
        
        try:
            powered_by_request = PoweredByRequest.objects.get(id=request_id)
            if hasattr(request, 'company'):
                company = request.company
            else:
                company = request.user.location_id.company_id
            if not powered_by_request.company_id == company:
                return Response({'error': 'Request id is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response({'error': 'Request id is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        context = get_powered_by_request_data(powered_by_request, False, page_number, per_page)
        
        return Response(context, content_type='application/json')
    
    
class PoweredBySpecificResumeDownload(APIView):
    authentication_classes = (StartdateTokenAuthentication, IntegrationKeyAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, attachment_id):
        try:
            powered_by_request = PoweredByRequestAttachment.objects.get(id=attachment_id)
        except Exception as e:
            print(e)
            return Response({'error': 'Attachment ID not found'}, status=status.HTTP_404_NOT_FOUND)
        
        context = {
            'attachment': generate_presigned_url(powered_by_request.s3_key, 43200),
            'status': powered_by_request.processing_status,
        }

        return Response(context, content_type='application/json')

    def post(self, request, attachment_id):
        """
        BS# This API will modify a pdf and then upload it to S3 bucket and generate the signed url for it
        """
        data = request.data
        image = request.FILES.get("image")
        logo = request.FILES.get("logo")
        accuracy = data.get("ranking")
        try:
            accuracy = float(accuracy)
            accuracy = round(accuracy, 4)
            accuracy = str(accuracy)
            powered_by_request = PoweredByRequestAttachment.objects.get(id=attachment_id)
            pdf_buffer = download_file_from_s3(powered_by_request.s3_key)
            reader = PdfReader(pdf_buffer)
            writer = PdfWriter()
            image_buffer = BytesIO(image.read())
            image_buffer.seek(0)
            logo_buffer = BytesIO(logo.read())
            logo_buffer.seek(0)

            # Create an overlay with the images and text
            overlay_buffer = BytesIO()
            overlay_canvas = canvas.Canvas(overlay_buffer, pagesize=A4)

            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_file:
                tmp_file.write(image_buffer.read())
                image_temp_file_path = tmp_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_logo_file:
                tmp_logo_file.write(logo_buffer.read())
                logo_temp_file_path = tmp_logo_file.name

            # Draw the logo at the top left corner
            overlay_canvas.drawImage(logo_temp_file_path, 10, A4[1] - 140, width=150, height=85)

            # Add the accuracy text next to the logo
            overlay_canvas.setFont("Helvetica", 15)
            overlay_canvas.drawString(400, A4[1] - 70, f"Candidate's ranking: {accuracy}")

            # Draw the "Skills and Insights" image below the logo and text
            overlay_canvas.drawImage(image_temp_file_path, 8, A4[1] - 390, width=A4[0], height=250)

            overlay_canvas.save()
            overlay_buffer.seek(0)

            overlay_pdf = PdfReader(overlay_buffer)
            overlay_page = overlay_pdf.pages[0]

            # Create a new page for the overlay content
            new_page = PageObject.create_blank_page(width=A4[0], height=A4[1])
            new_page.merge_page(overlay_page)

            # Add the new page with overlay to the writer
            writer.add_page(new_page)

            # Add the original PDF pages below the new page
            for page in reader.pages:
                writer.add_page(page)

            # Write the modified PDF to a new buffer
            output_buffer = BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)

            s3 = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)

            s3_key = f"output/{attachment_id}.pdf"
            try:
                # output_buffer.seek(0)
                s3.upload_fileobj(output_buffer, POWERED_BY_REQUEST_BUCKET, s3_key)
                signed_url = s3.generate_presigned_url('get_object', Params={'Bucket': POWERED_BY_REQUEST_BUCKET, 'Key': s3_key},
                                                       ExpiresIn=43200)
                                                       
                context = {
                    "attachment": signed_url,
                    'status': powered_by_request.processing_status,
                }

                return Response(context, content_type='application/json')
            except Exception as e:
                print(e)

        except Exception as e:
            print(e)
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    

class PoweredBySpecificRequestDownload(APIView):
    authentication_classes = (StartdateTokenAuthentication, IntegrationKeyAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, request_id):
        try:
            powered_by_request = PoweredByRequest.objects.get(id=request_id)
            if hasattr(request, 'company'):
                company = request.company
            else:
                company = request.user.location_id.company_id
                
            if not powered_by_request.company_id == company:
                return Response({'error': 'Request ID not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(e)
            return Response({'error': 'Something went wrong!'}, status=status.HTTP_400_BAD_REQUEST)

        df = download_powered_by_request_data(powered_by_request)
        
        temp_dir = tempfile.mkdtemp()
        csv_path = f'{temp_dir}/{powered_by_request.id}'
        os.mkdir(csv_path) 
        
        csv_file_path = f'{csv_path}/{powered_by_request.id}-{date.today()}.csv'
        df.to_csv(csv_file_path, index=False)
        response = HttpResponse(headers={'Access-Control-Expose-Headers': 'Content-Disposition', 'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="{powered_by_request.id}-{date.today()}.csv"'})

        with open(csv_file_path, 'rb') as csv_file:
            response.write(csv_file.read())

        os.unlink(csv_file_path)
        shutil.rmtree(temp_dir)

        return response


class PoweredByWebhookView(APIView):
    def post(self, request):
        try:
            data = request.data
            PoweredByWebhook.objects.create(type=data.get('type'), payload=data.get('payload'), status='pending', saving_status='pending')
            return Response(status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class PoweredByRequestLogsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request):
        if hasattr(request, 'company'):
            company = request.company
        else:
            company = request.user.location_id.company_id
        to_date = datetime.now(timezone.utc)
        from_date = to_date - timedelta(days=1)
        if request.query_params.get('from_date'):
            from_date = request.query_params.get('from_date')
            from_date = parser.parse(from_date)
            from_date = from_date.astimezone(timezone.utc)
        if request.query_params.get('to_date'):
            to_date = request.query_params.get('to_date')
            to_date = parser.parse(to_date)
            to_date = to_date.astimezone(timezone.utc)
        from_date = from_date.replace(minute=00, second=00, microsecond=00)
        if to_date < from_date:
            return Response({'error': 'From Date cannot be greater than To Date'}, status=status.HTTP_400_BAD_REQUEST)

        requests_dataset = PoweredByRequest.objects.filter(company_id=company,
                                                           created_at__range=(from_date, to_date)).order_by('created_at')

        time_duration = to_date - from_date
        profiles = []
        screen_credits = []
        time_intervals = []
        if time_duration.days > 1:
            for i in range(0, time_duration.days+1):
                requests_in_range = requests_dataset.filter(created_at__date=from_date + timedelta(days=i))
                profiles_requested = 0
                credits_used = 0
                interval = (from_date + timedelta(days=i)).strftime('%d%b')
                if requests_in_range:
                    annotated_requests = requests_in_range.annotate(profiles=F('api_response__total_profiles'))
                    for entry in annotated_requests:
                        profiles_requested = profiles_requested + entry.profiles if entry.profiles else profiles_requested
                    credits_used = requests_in_range.aggregate(credits_used=Sum('credits_used'))
                    credits_used = credits_used.get('credits_used')
                profiles.append(profiles_requested)
                screen_credits.append(credits_used)
                time_intervals.append(interval)
        else:
            for i in range(1, 25):
                requests_in_range = requests_dataset.filter(created_at__range=(from_date + timedelta(hours=i), from_date + timedelta(hours=i+1)))
                profiles_requested = 0
                credits_used = 0
                interval = f'{(from_date + timedelta(hours=i)).hour}:00'
                if requests_in_range:
                    annotated_requests = requests_in_range.annotate(profiles=F('api_response__total_profiles'))
                    for entry in annotated_requests:
                        profiles_requested = profiles_requested + entry.profiles if entry.profiles else profiles_requested
                    credits_used = requests_in_range.aggregate(credits_used=Sum('credits_used'))
                    credits_used = credits_used.get('credits_used')
                profiles.append(profiles_requested)
                screen_credits.append(credits_used)
                time_intervals.append(interval)
        response = {
            'credits_used': screen_credits,
            'profiles_requested': profiles,
            'intervals': time_intervals
        }
        return Response(response, content_type='application/json')
