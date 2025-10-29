import uuid
from datetime import datetime, timedelta
from django.core.mail import EmailMessage
import simplejson
import random
import string
from django.http import HttpResponse
from knox.auth import TokenAuthentication
from knox.settings import knox_settings
from rest_framework import exceptions, status
from rest_framework import status
from rest_framework.response import Response
from decouple import config
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import send_mail
from accounts.models import User
from candidate.models import Candidate
from integrations.models import IntegrationKey
from payment_history.services import validate_subscription, validate_screening_records_left
from startdate import settings
from startdate.settings import REST_KNOX, EMAIL_CLIENT
import requests
from requests.exceptions import ConnectionError, HTTPError
from exponent_server_sdk import (
    PushClient,
    PushMessage,
)
from .models import UserCredits


EXPO_TOKEN = config('EXPO_TOKEN')
DEFAULT_EMAIL = config("DEFAULT_EMAIL")


def email_exists(email):
    try:
        user_exists = User.objects.filter(email__iexact=email, is_active=True).first()
    except User.DoesNotExist:
        user_exists = None
    if user_exists:
        return True
    return False


def is_empty(string):
    if not (string and not string.isspace()):
        return True
    return False


def validate_login_otp_data(data):
    if ('email' not in data):
        return Response(status=status.HTTP_403_FORBIDDEN)
    if is_empty(data['email']):
        return Response(status=status.HTTP_204_NO_CONTENT)
    if not email_exists(data['email']):
        response_data = {
            'error': 'Account does not exist. Please create one first!'}
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)


class StartdateTokenAuthentication(TokenAuthentication):
    def authenticate(self, request):
        if 'startdatetoken' not in request.COOKIES:
            if 'Authorization' not in request.headers and 'IntegrationKey' not in request.headers and 'IntegrationKey' not in request.COOKIES:
                return None
                msg = ("Authentication credentials were not provided.")
                raise exceptions.AuthenticationFailed(msg)
        if 'startdatetoken' in request.COOKIES:
            startdate_token = request.COOKIES['startdatetoken']
        elif 'Authorization' in request.headers:
            startdate_token = request.headers['Authorization']
        elif 'IntegrationKey' in request.headers or 'IntegrationKey' in request.COOKIES:
            return None

        startdate_token = startdate_token.split(":")[0]
        auth = [b'token', bytes(startdate_token, 'utf-8')]
        prefix = knox_settings.AUTH_HEADER_PREFIX.encode()
        if not auth:
            return None
        if auth[0].lower() != prefix.lower():
            # Authorization header is possibly for another backend
            return None
        if len(auth) == 1:
            msg = _('Invalid token header. No credentials provided.')
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = _('Invalid token header. '
                    'Token string should not contain spaces.')
            raise exceptions.AuthenticationFailed(msg)

        user, auth_token = self.authenticate_credentials(auth[1])
        return user, auth_token


def set_powered_by_user_data(user):
    location_id = user.location_id.id
    company = user.location_id.company_id
    if user.role == "employer":
        is_valid_subscription, records_left = validate_screening_records_left(company)
    elif user.role == 'hiring_manager':
        records_left = get_employee_credits(user.id)
    integration = IntegrationKey.objects.filter(company_id=company).first()
    if not integration:
        return Response({'error': 'Integration Key Not Found'}, status=status.HTTP_404_NOT_FOUND)
    context = {
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'picture': user.picture,
            'location_id': str(location_id),
            'company_id': str(company.id),
            'records_left': records_left,
        }
    }
    response = HttpResponse(simplejson.dumps(context))
    response['Access-Control-Allow-Credentials'] = 'true'
    cookie_expiry = datetime.now() + timedelta(hours=24)
    response.set_signed_cookie(
        key='IntegrationKey',
        value=integration.key,
        domain=config('PLAYGROUND_DOMAIN'),
        samesite='Strict',
        path='/',
        expires=cookie_expiry
    )
    return response


def set_user_data(user_id, token='', host=''):
    user = User.objects.get(id=user_id)
    refresh_token = str(uuid.uuid4())
    user.refresh_token = refresh_token
    user.save()
    location_id = None
    reveals_left = 0
    PER_REVEAL_PRICE = 50
    credits_left = 0
    subscription_type = None
    company = None
    if user.location_id:
        location_id = user.location_id.id
        company = user.location_id.company_id
        subscription_type = company.subscription_type
        if user.role == 'employer':
            is_valid_subscription, records_left = validate_screening_records_left(company)
            credits_left = records_left
            is_valid_subscription, subscription = validate_subscription(company.id)
            if is_valid_subscription:
                reveals_left = subscription.reveals_left
        elif user.role == 'hiring_manager':
            credits_left = get_employee_credits(user.id)
            reveals_left = credits_left

    context = {
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'picture': user.picture,
            'reveals_left': reveals_left,
            'credits_left': credits_left,
            'location_id': str(location_id),
            'company_id': str(company.id) if user.role == 'employer' or user.role == 'hiring_manager' else None,
            'subscription_type': subscription_type,
            'company_details': {
                'name': company.name,
                'candidate_scope': company.candidate_scope,
                'minimum_reveals': company.minimum_reveals
            } if user.role in ['employer', 'hiring_manager'] else None,
        },
        'auth_token': token,
        'refresh_token': refresh_token
    }
    if user.role == 'job_seeker':
        candidate = Candidate.objects.get(user_id=user)
        context['user'].update({'candidate_id': str(candidate.id)})
    response = HttpResponse(simplejson.dumps(context))
    domain = ''
    if token:
        response['Access-Control-Allow-Credentials'] = 'true'
        cookie_expiry = datetime.now() + REST_KNOX['TOKEN_TTL']
        if config("ENVIRONMENT") == 'Production':
            if host == settings.STARTDATE_DOMAIN:
                domain = settings.STARTDATE_DOMAIN
            elif host == settings.PUBLIC_ACCOUNTING_DOMAI:
                domain = settings.PUBLIC_ACCOUNTING_DOMAI
            elif host.endswith(settings.RECRUITRITE_DOMAIN):
                domain = settings.RECRUITRITE_DOMAIN
                
        else:
            domain = None
        response.set_signed_cookie(
            key='startdatetoken',
            value=token,
            domain=domain,
            samesite='Strict' if config("ENVIRONMENT") == 'Production' else 'Lax',
            path='/',
            salt='navtech',
            expires=cookie_expiry
        )
    return response


def is_valid(user, otp):
    # Define your own validity period (e.g., 5 minutes)
    validity_period = timezone.timedelta(minutes=5)
    timestamp = user.otp_generated_at
    user_otp = user.otp
    if (timestamp + validity_period >= timezone.now()):
        if user_otp == otp:
            return None
        else:
            message = {"otp_status": "Incorrect OTP. Please try again!"}
            return message
    else:
        message = {"time_status": "OTP expired"}
        return message


def generate_otp(user):
    # Generate a random 6-digit OTP
    try:
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.otp_generated_at = timezone.now()
        user.save(update_fields=["otp", "otp_generated_at"])

        return True
    except Exception as e:
        return False


def send_otp_email(user,host=None):
    if(host and host.endswith(settings.RECRUITRITE_DOMAIN)):
        image_url = "https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-resources/RecruitRite_Logo.png"
        domain = "RecruitRite"
    else:
        image_url = "https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-resources/startdate_logo.png"
        domain = "StartDate"
    message = {
        "senderAddress": DEFAULT_EMAIL,  
        "recipients": {
            "to": [{"address": user.email}]
        },
        "content": {
            "subject": f"{domain} confirmation code: {user.otp}",
            "html": render_to_string("otp.html", {"user": user.first_name, "otp": user.otp, "image_url":image_url})  
        }
    }
    response = EMAIL_CLIENT.begin_send(message)
    if response.result()["status"] == "Succeeded":
        return True
    else:
        return False
    return True


def send_delete_email(user):
    message = {
        "senderAddress": DEFAULT_EMAIL,  
        "recipients": {
            "to": [{"address": user.email}],
            "bcc": [{"address": config("SUPPORT_EMAIL")}]
        },
        "content": {
            "subject": "Account Delete Request",
            "html": render_to_string("delete_account.html") 
        }
    }
    EMAIL_CLIENT.begin_send(message)


def validate_otp_registered_data(data):
    if ('email' not in data) or ('first_name' not in data) or (
            'last_name' not in data):
        return Response(status=status.HTTP_403_FORBIDDEN)
    if (is_empty(data['email'])) or (is_empty(data['first_name'])) or (
            is_empty(data['last_name'])):
        return Response(status=status.HTTP_204_NO_CONTENT)
    if email_exists(data['email']):
        return Response(status=status.HTTP_409_CONFLICT)


def generate_random_password(length=10):
    # Generate a random string of alphanumeric characters
    chars = string.ascii_letters + string.digits
    password = ''.join(random.choice(chars) for _ in range(length))

    return password


class IntegrationKeyAuthentication(TokenAuthentication):
    def authenticate(self, request, **args):
        try:
            integration_key = self.get_api_key(request)
            if not integration_key:
                return None
            integration_key = IntegrationKey.objects.get(key=integration_key)
            if not integration_key.is_active:
                msg = ('Invalid Integration Key. ')
                raise exceptions.PermissionDenied(msg)
            request.company = integration_key.company_id
            request.integration_key = integration_key
            request.company.is_authenticated = True
            return request.company, request.integration_key
        except IntegrationKey.DoesNotExist:
            msg = ('Invalid Integration Key. ')
            raise exceptions.AuthenticationFailed(msg)

    def get_api_key(self, request):
        keys = ['IntegrationKey', 'X-POWEREDBY-API-KEY']
        for key in keys:
            if key in request.headers:
                integration_key = request.headers.get(key)
                try:
                    integration_key = integration_key.split("Bearer ")[1]
                    return integration_key
                except:
                    msg = ('Invalid Integration Key. ')
                    raise exceptions.PermissionDenied(msg)
            if key in request.COOKIES:
                integration_key = request.COOKIES.get(key)
                integration_key = integration_key.split(":")[0]
                return integration_key
        return None


def send_push_notification(token, notification_body):
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {EXPO_TOKEN}",
        "accept": "application/json",
        "accept-encoding": "gzip, deflate",
        "content-type": "application/json",
        }
    )
    try:
        response = PushClient(session=session).publish(
            PushMessage(to=token,
                        title=notification_body['title'],
                        body=notification_body['content'],
                        data={
                            "imageUrl": 'https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-resources/app_logo.png',
                            # "customData": 'You can include additional data here'
                            }
                        )
        )
        if response.status == 'ok':
            return True
        else:
            raise Exception('Response Issue from PushClient')

    except (ConnectionError, HTTPError) as exc:
        raise Exception(str(exc))

def get_employee_credits(user_id):
    user = UserCredits.objects.filter(user=user_id).first()
    if user:
        return user.credits
    return 0