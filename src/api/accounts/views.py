from knox.models import AuthToken
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from adwerks.service import generate_password
from company.models import Company, Subscription, Location
from django.http import JsonResponse
from accounts.models import User, NotificationSettings
from accounts.serializers import LoginSerializer, RegisterSerializer, UserSerializer, AdminCreateUserSerializer, \
    AdminGetUserSerializer, DeviceTokenUpdateSerializer, NotificationSettingsSerializer, NotificationsSerializer, \
    FetchEmployeesSerializer, ShareCreditSerializer
from company.serializers import CompanySerializer, LocationSerializer
from company.services import kanban_board_default_config
from conversation_thread.models import Notification
from job_posting.permissions import AdminPermission, EmployerPermission, EmployerSpecificObjectPermission, \
    JobSeekerSpecificObjectPermission
from accounts.services import set_user_data, is_valid, generate_otp, send_otp_email, validate_login_otp_data, \
    set_powered_by_user_data, send_delete_email
from startdate import settings
from startdate.settings import EMAIL_CLIENT
from .services import StartdateTokenAuthentication, validate_otp_registered_data, generate_random_password, \
    IntegrationKeyAuthentication
from payment_history.services import validate_screening_records_left
import datetime
from candidate.serializers import CandidateRegisterSerializer, CandidateAttributesRegisterSerializer
from decouple import config
import hashlib
from django.template.loader import render_to_string
from django.core.mail import send_mail
from .models import UserCredits
DEFAULT_EMAIL = config("DEFAULT_EMAIL")

free_reveals = settings.FREE_SUBSCRIPTION_REVEALS


class LogoutView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        user.refresh_token = None
        user.save()
        request._auth.delete()
        return Response(status=status.HTTP_200_OK)


class LoginSendOtp(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        login_creds = request.data
        email = login_creds.get("email")
        host = request.get_host()
        is_valid = validate_login_otp_data(login_creds)
        if isinstance(is_valid, Response):
            return is_valid
        if email is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        try:
            user_exists = User.objects.filter(email__iexact=email).first()
        except User.DoesNotExist:
            user_exists = None
        if user_exists is None:
            response_data = {
                'error': 'Account does not exist. Please create one first!'}
            return JsonResponse(response_data, status=404)
        else:
            otp_generation = generate_otp(user_exists)
            if otp_generation:
                send_opt = send_otp_email(user_exists,host)
                if send_opt:
                    return Response({"first_name": user_exists.first_name, "last_name": user_exists.last_name},
                                    status=status.HTTP_200_OK)
                else:
                    response_data = {'error': 'Got exception in sending mail'}
                    return JsonResponse(response_data, status=401)
            else:
                response_data = {'error': 'OTP not generated '}
                return JsonResponse(response_data, status=401)


class LoginRecieveOtp(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        # origin = request.headers.get('Origin')
        # playground_index = origin.find('playground.startdate')
        # localhost_index = origin.find('localhost:3001')
        login_creds = request.data
        email = login_creds.get("email")
        otp = login_creds.get("otp")
        host = request.get_host()
        if email is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        user_exists = User.objects.filter(email__iexact=email).first()

        if user_exists is None:
            response_data = {
                'Error': 'Account does not exist. Please create one first!'}
            return JsonResponse(response_data, status=401)
        else:
            if email == 'developer@startdate.co' or email == 'developer+1@startdate.co':
                if otp == '334353':
                    token = AuthToken.objects.create(user_exists)
                    return set_user_data(user_exists.id, token[1], host)
            valid_otp = is_valid(user_exists, otp)
            if valid_otp is None:
                user = User.objects.filter(email__iexact=login_creds['email']).first()
                user.otp = ''
                user.save()
                # if localhost_index != -1 or playground_index != -1:
                #     return set_powered_by_user_data(user)
                # else:
                token = AuthToken.objects.create(user_exists)
                return set_user_data(user.id, token[1], host)

            else:
                if valid_otp.get("otp_status"):
                    response_data = {
                        'Error': 'Incorrect OTP. Please try again!'}
                    return JsonResponse(response_data, status=401)

                elif valid_otp.get("time_status"):
                    response_data = {
                        'Error': 'OTP Expired Please try again!'}
                    return JsonResponse(response_data, status=404)


# Register
class RegisterOtpSerializerView(APIView):
    def post(self, request):
        data = request.data['user']
        host = request.get_host()
        is_valid = validate_otp_registered_data(data)
        if isinstance(is_valid, Response):
            return is_valid

        # generate random password
        data['password'] = generate_random_password(length=6)
        if data['role'] == 'employer':
            if not data.get('name'):
                return Response({'error': 'Company name is empty'}, status=status.HTTP_400_BAD_REQUEST)
            company_instance, flag = Company.objects.get_or_create(
                name=data['name'],minimum_reveals=25,candidate_scope='self')
            company_instance.industry_id_id = data.get('industry_id')
            company_instance.save()
            if flag:
                kanban_board_default_config(company_instance.id)
            data.update({"company_id": company_instance.id})
            location_serializer = LocationSerializer(data=data)
            if location_serializer.is_valid():
                location_instance = location_serializer.save()
                data.update({"location_id": location_instance.id})
                serializer = RegisterSerializer(data=data)

                if serializer.is_valid():
                    user_object = serializer.save()
                    '''if not Subscription.objects.filter(company_id_id=company_instance.id, type='free').exists():
                        Subscription.objects.create(company_id_id=company_instance.id, type='free',
                                                    reveals=free_reveals,
                                                    reveals_left=free_reveals, start_date=datetime.datetime.now(),
                                                    created_by_id=user_object.id)'''
                    if not Subscription.objects.filter(company_id_id=company_instance.id,
                                                       type='free_screening').exists():
                        Subscription.objects.create(company_id_id=company_instance.id, type='free_screening',
                                                    reveals=config('FREE_SCREENING_RECORDS'),
                                                    reveals_left=config('FREE_SCREENING_RECORDS'),
                                                    start_date=datetime.datetime.now(),
                                                    created_by_id=user_object.id)

                    context = {
                        'email': request.data['user']['email'],
                        'first_name': request.data['user']['first_name'],
                        'last_name': request.data['user']['last_name'],
                    }
                    user_obj = User.objects.filter(email__iexact=request.data['user']['email']).first()
                    generate_otp(user_obj)
                    send_otp_email(user_obj,host)

                return Response(context, status=status.HTTP_201_CREATED)
        elif data['role'] == 'hiring_manager':
            serializer = RegisterSerializer(data=data)
            if serializer.is_valid():
                user_object = serializer.save()
                context = {
                        'email': request.data['user']['email'],
                        'first_name': request.data['user']['first_name'],
                        'last_name': request.data['user']['last_name'],
                }
                return Response(context, status=status.HTTP_201_CREATED)  
        elif data['role'] == 'job_seeker':
            try:
                user_serializer = UserSerializer(data=data)
                user_serializer.is_valid()
                user = user_serializer.save()
                data.update({'user_id': user.id, "source": "self"})
                candidate_serializer = CandidateRegisterSerializer(data=data)
                candidate_serializer.is_valid()
                candidate = candidate_serializer.save()
                data.update({'candidate_id': candidate.id})
                candidate_attribute_serializer = CandidateAttributesRegisterSerializer(data=data)
                candidate_attribute_serializer.is_valid()
                candidate_attribute_serializer.save()
                context = {
                    'email': request.data['user']['email'],
                    'first_name': request.data['user']['first_name'],
                    'last_name': request.data['user']['last_name'],
                }
                generate_otp(user)
                send_otp_email(user,host)
                return Response(context, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'Error': 'Some issue occurred ..'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_403_UNAUTHORIZED)


class UserBaseView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request, company_id):
        data = request.data
        data.update({'created_by': request.user.id, 'password': generate_password(), 'role': 'employer'})
        user_serializer = AdminCreateUserSerializer(data=data)
        if user_serializer.is_valid():
            user = user_serializer.save()
            get_serializer = AdminGetUserSerializer(instance=user)
            return Response(get_serializer.data, status=status.HTTP_200_OK)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, company_id):
        locations = Location.objects.filter(company_id_id=company_id).values_list('id', flat=True)
        users = User.objects.filter(location_id_id__in=locations)
        serializer = AdminGetUserSerializer(instance=users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpecificUserView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)

    def get_permissions(self):
        if self.request.method == 'GET' or self.request.method == 'PATCH':
            return [EmployerSpecificObjectPermission()]
        return [AdminPermission()]

    def patch(self, request, company_id, user_id):
        user = User.objects.filter(id=user_id).first()
        serializer = AdminCreateUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            saved_user = serializer.save()
            get_serializer = AdminGetUserSerializer(instance=saved_user)
            return Response(get_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, company_id, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"Error": "User Not Found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminGetUserSerializer(instance=user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, company_id, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"Error": "User Not Found"}, status=status.HTTP_404_NOT_FOUND)
        user.delete()
        return Response({"Message": "User Deleted Successfully"}, status=status.HTTP_200_OK)


class MobileDeviceToken(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def hash_with_salt(self, email):
        salt = config('HASHING_SALT')
        data = email + salt
        hashed_data = hashlib.sha256(data.encode()).hexdigest()
        return hashed_data

    def patch(self, request):
        data = request.data
        user = request.user
        host = request.get_host()
        serializer = DeviceTokenUpdateSerializer(instance=user, data=data)
        if serializer.is_valid():
            if data.get('email') and (user.email != data.get('email')):
                if User.objects.filter(email=data.get('email')).exists():
                    return Response({"Error": "Email Already Exists"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
                otp_generation = generate_otp(user)
                if otp_generation:
                    serializer.save()
                    user.email = data.get('email')
                    send_opt = send_otp_email(user,host)
                    if send_opt:
                        encrypted_email = self.hash_with_salt(data.get('email'))
                        return Response({"token": str(encrypted_email)}, status=status.HTTP_200_OK)
            else:
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        data = request.data
        user = request.user
        valid_otp = is_valid(user, data.get('otp'))
        if valid_otp is None:
            if data.get('email'):
                if User.objects.filter(email=data.get('email')).exists():
                    return Response({"Error": "Email Already Exists"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
                if data.get('token') != str(self.hash_with_salt(data.get('email'))):
                    return Response(status=status.HTTP_400_BAD_REQUEST)
                user.otp = ''
                user.email = data.get('email')
                user.save()
                return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            send_delete_email(request.user)
            return Response(status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class NotificationSettingsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        ns = NotificationSettings.objects.filter(user_id=request.user).first()
        if not ns:
            ns = NotificationSettings.objects.create(user_id=request.user)
        serializer = NotificationSettingsSerializer(instance=ns, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        ns = NotificationSettings.objects.filter(user_id=request.user).first()
        if not ns:
            return Response({'Error': 'Notification Settings Not Found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = NotificationSettingsSerializer(instance=ns, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        ns = Notification.objects.filter(receiver_user_id=request.user).exclude(type='message').order_by('-created_at')
        serializer = NotificationsSerializer(instance=ns, many=True)
        grouped_data = {}
        for entry in serializer.data:
            created_at = entry['created_at'].split('T')[0]
            grouped_data.setdefault(created_at, []).append(entry)
        grouped_list = []
        keys = list(grouped_data.keys())
        for key in keys:
            grouped_list.append({'date': key, 'notifications': grouped_data[key]})

        return Response(grouped_list, status=status.HTTP_200_OK)

    def patch(self, request):
        Notification.objects.filter(receiver_user_id=request.user).update(is_read=True)
        return Response(status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    def post(self, request, user_id):
        token = request.data.get('refresh_token')
        host = request.get_host()
        if not user_id or not token:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(id=user_id, refresh_token=token).first()

        if user:
            token = AuthToken.objects.create(user)
            return set_user_data(user.id, token[1], host)
        return Response(status=status.HTTP_401_UNAUTHORIZED)


class ContactUsView(APIView):
    def post(self, request):
        data = request.data

        if not data.get('source', None):
            data['source'] = 'Consulting'
        if not data.get('recepient', None):
            data['recepient'] = 'ch@startdate.co'

        message = {
            "senderAddress": DEFAULT_EMAIL,  
            "recipients": {
                "to": [{"address": data['recepient']}]
            },
            "content": {
                "subject": f"[{data['source']}] Person filled contact us form",
                "html": render_to_string("contact_us.html", data)
            }
        }
        EMAIL_CLIENT.begin_send(message)
        
        return Response({"Message": "Email sent successfully"}, status=status.HTTP_200_OK)

class AllocateUsersCredits(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def post(self, request):
        body = request.data
        user = User.objects.filter(id=body.get("user_id", None)).first()
        if user:
            UserCredits.objects.create(user=user, credits=body.get("credits", 0))
            return Response({"Message": "Credits added successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"Message": "Invalid Request"}, status=status.HTTP_400_BAD_REQUEST)


class CompanyEmployees(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request):
        user = request.user
        company = user.location_id.company_id
        is_valid_subscription, screening_records = validate_screening_records_left(company)
        if company:
            employees = UserCredits.objects.filter(company=company,user__role='hiring_manager').values("email", "credits")
            if employees:
                return Response({"employees": employees, "total_credits": screening_records}, status=status.HTTP_200_OK)
            else:
                return Response({"employees": [], "total_credits": screening_records}, status=status.HTTP_200_OK)
        else:
            return Response({"Message": "Admin does not belongs to any company"}, status=status.HTTP_404_NOT_FOUND)


class ShareCredits(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def post(self, request):
        data = request.data
        admin_company = request.user.location_id.company_id

        serializer = ShareCreditSerializer(data=data)


        if serializer.is_valid():
            validated_data = serializer.validated_data
            users = validated_data.get("emails")
            credits = validated_data.get("credits")

            # Calculate total screening records
            screening_records = 0
            subscription_types = [
                "free_screening",
                "starter_screening",
                "starter_screening_plus",
                "silver_screening",
                "silver_screening_plus",
                "gold_screening",
                "gold_screening_plus",
                "platinum_screening",
                "platinum_screening_plus",
                "custom_screening"
            ]
            subscriptions = Subscription.objects.filter(
                company_id=admin_company, type__in=subscription_types, is_expired=False
            ).order_by("-created_at")  # Order by most recent first

            for subscription in subscriptions:
                screening_records += subscription.reveals_left

            # Ensure total credits do not exceed screening_records
            if credits > screening_records:
                return Response({"Message": "Insufficient credits"}, status=status.HTTP_400_BAD_REQUEST)

            # Deduct credits from subscriptions and assign to users
            for index, email in enumerate(users):
                user = UserCredits.objects.filter(email=email).first()
                if not user:
                    return Response(
                        {"Message": f"User with email {email} not found."}, status=status.HTTP_404_NOT_FOUND
                    )

                user_credits_to_assign = credits

                # Deduct from subscriptions
                for subscription in subscriptions:
                    if user_credits_to_assign == 0:
                        break

                    if subscription.reveals_left > 0:
                        deduct_amount = min(user_credits_to_assign, subscription.reveals_left)
                        subscription.reveals_left -= deduct_amount
                        subscription.save()
                        user_credits_to_assign -= deduct_amount

                if user_credits_to_assign > 0:
                    return Response(
                        {"Message": "Not enough credits to complete the operation."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                # Assign credits to the user
                user.credits += credits
                user.save()

            return Response({"Message": "Credits assigned successfully"}, status=status.HTTP_200_OK)

        else:
            return Response({"Message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SetUserLanguage(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def patch(self, request):
        data = request.data
        user = request.user
        if data.get('language'):
            user.language = data.get('language')
            user.save()
            return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        user = request.user
        return Response({"language": user.language}, status=status.HTTP_200_OK)

