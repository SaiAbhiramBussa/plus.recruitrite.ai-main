from candidate.aws import client_s3
from candidate.models import Candidate
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.models import UserCredits
from accounts.services import StartdateTokenAuthentication, get_employee_credits
from candidate.services import job_posting_match_skill
from company.services import kanban_board_default_config
from job_posting.permissions import (
    EmployerPermission,
    AdminPermission,
    EmployerSpecificObjectPermission,
)
from machine_learning.services import complete_candidate_data
from startdate import settings
from company.models import Location, KanbanBoard, Company
from .models import StripeWebHook
from company.models import Subscription
from job_posting.models import JobPostingReveals, JobPosting, JobPostingCandidate
from .services import (
    validate_subscription,
    stripe_customer_method,
    create_subscription_plan,
    create_one_time_plan,
    all_valid_subscriptions,
    reveal_candidate_and_update_subscription,
    validate_screening_records_left
)
from django.template.loader import render_to_string
from django.http import HttpResponse
import json
import stripe
from decouple import config

stripe.api_key = settings.STRIPE_SECRET_KEY
webhook_key = settings.STRIPE_WEBHOOK_SECRET
ai_silver_price_id = settings.AI_SILVER_SUBSCRIPTION_PRICE_ID
ai_gold_price_id = settings.AI_GOLD_SUBSCRIPTION_PRICE_ID
ai_gold_reveals = settings.AI_GOLD_SUBSCRIPTION_REVEALS
ai_silver_reveals = settings.AI_SILVER_SUBSCRIPTION_REVEALS
EVENTS_BUCKET = settings.AWS_TRIGGER_EVENTS_BUCKET_NAME
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
EMAIL_CLIENT = settings.EMAIL_CLIENT
SUPPORT_EMAIL = config("SUPPORT_EMAIL")


class SubscriptionApiView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def post(self, request):
        if not (request.data.get("customer") and request.data.get("payment_method_id")):
            return Response(
                {
                    "success": False,
                    "Error": "Requested Customer and Payment Method are Incomplete",
                },
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )
        is_plus = request.data.get("isPlus", False)
        location = request.user.location_id
        company_id = str(location.company_id_id)
        try:
            stripe_customer = stripe_customer_method(request, company_id)
        except Exception as e:
            return Response(
                {"success": False, "Error": str(e)},
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )

        if request.data.get("subscription_plan_type"):
            response = create_subscription_plan(request, company_id, stripe_customer)
            return response
        elif request.data.get("one_time_plan_type"):
            response = create_one_time_plan(request, company_id, stripe_customer)
            return response
        return Response(
            {"success": False, "Error": "Plan Type Details Incomplete"},
            status=status.HTTP_406_NOT_ACCEPTABLE,
        )


class StripeEventsWebHook(APIView):
    def post(self, request):
        signature = request.META["HTTP_STRIPE_SIGNATURE"]
        endpoint_secret = webhook_key
        payload = request.body.decode("utf-8")
        event = None
        try:
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key, endpoint_secret
            )
            if (
                event.type == "invoice.payment_succeeded"
                or event.type == "invoice.payment_failed"
            ):
                stripe_event = StripeWebHook.objects.create(
                    event_type=event.type, event_id=event.id, status="pending"
                )
                file_key = f"stripe_events/{str(stripe_event.id)}"
                response = client_s3.put_object(
                    Bucket=EVENTS_BUCKET,
                    Key=file_key,
                    Body=json.dumps(event),
                    ContentType="application/json",
                )
                if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
                    stripe_event.key = file_key
                else:
                    stripe_event.status = "failed"
                stripe_event.save()

        except ValueError as e:
            return HttpResponse(status=400)

        return HttpResponse(status=status.HTTP_204_NO_CONTENT)


class SubscriptionReveals(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, id):
        try:
            location = request.user.location_id
            company_id = str(location.company_id_id)
            job_posting_candidate_id = id
            job_posting_candidate = JobPostingCandidate.objects.get(
                id=job_posting_candidate_id
            )
            job_posting = JobPosting.objects.get(
                id=job_posting_candidate.job_posting_id_id
            )
            location_from_job_posting = Location.objects.get(
                id=job_posting.location_id_id
            )
            if str(location_from_job_posting.company_id_id) != company_id:
                return Response(status=status.HTTP_400_BAD_REQUEST)
            if JobPostingReveals.objects.filter(
                job_posting_id_id=job_posting_candidate.job_posting_id_id,
                candidate_id_id=job_posting_candidate.candidate_id_id,
            ).exists():
                return Response(
                    {"Error": "Duplicate Requested"}, status=status.HTTP_409_CONFLICT
                )
            
            is_valid_subscription, subscription = validate_subscription(company_id)
            if(request.user.role == 'employer'):
                if not is_valid_subscription:
                    error_message = {"Error":"Seems like you have run out of reveals! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return Response(error_message,status=status.HTTP_403_FORBIDDEN)
                subscription.reveals_left = subscription.reveals_left - 1
                subscription.save()
            elif(request.user.role == 'hiring_manager'):
                user_credits = UserCredits.objects.filter(user_id=request.user.id).first()
                if(user_credits.credits <= 0):
                    error_message = {"Error":"Seems like you have run out of credits! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return Response(error_message,status=status.HTTP_403_FORBIDDEN)
                user_credits.credits -= 1
                user_credits.save() 
            JobPostingReveals.objects.create(
                job_posting_id_id=job_posting_candidate.job_posting_id_id,
                candidate_id_id=job_posting_candidate.candidate_id_id,
                revealed_by_id=str(request.user.id),
                subscription_id_id=subscription.id,
            )
            candidate_object = Candidate.objects.get(
                id=job_posting_candidate.candidate_id_id
            )
            complete_candidate = complete_candidate_data(candidate_object)
            recommended_skill = job_posting_match_skill(
                candidate_object.id, job_posting.id, False
            )
            if recommended_skill:
                complete_candidate.update({"recommended_skill": recommended_skill})
            complete_candidate.update(
                {
                    "job_posting_candidate_id": job_posting_candidate.id,
                    "is_revealed": True,
                    "accuracy": job_posting_candidate.accuracy,
                }
            )
            valid_subscriptions = all_valid_subscriptions(company_id)
            context = {
                "reveals_left": sum([sub.reveals_left for sub in valid_subscriptions]) if request.user.role == 'employer' else get_employee_credits(request.user.id),
                "subscription_type": subscription.type,
                "candidate": complete_candidate,
            }
            return Response(context, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"Error": e}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            location = request.user.location_id
            company_id = str(location.company_id_id)
            job_posting_candidate_ids = request.data.get("job_posting_candidate_ids")
            job_posting_id = request.data.get("job_posting_id")
            valid_subscriptions = None
            credits_to_deduct = 1

            job_posting_candidates = JobPostingCandidate.objects.filter(
                candidate_id_id__in=job_posting_candidate_ids,
                job_posting_id_id=job_posting_id,
            )
            print("job_posting_candidates:",job_posting_candidates)
            job_posting = JobPosting.objects.get(id=job_posting_id)

            location_from_job_posting = Location.objects.get(
                id=job_posting.location_id_id
            )

            if str(location_from_job_posting.company_id_id) != company_id:
                return Response(status=status.HTTP_400_BAD_REQUEST)

            if request.user.role == 'employer':
                valid_subscriptions = all_valid_subscriptions(company_id)
                # total_reveals_needed = len(job_posting_candidates)
                resp_candidates_list = []
                if not valid_subscriptions.exists():
                    error_message = {"Error":"Seems like you have run out of reveals! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return Response(error_message,status=status.HTTP_403_FORBIDDEN)
            elif request.user.role == 'hiring_manager':
                resp_candidates_list = []
                user_credits = UserCredits.objects.filter(user=request.user.id).first()
                if(user_credits.credits <= 0):
                    error_message = {"Error":"Seems like you have run out of credits! \nPlease consider purchasing any plan of your choice to reveal more candidates."}
                    return Response(error_message,status=status.HTTP_403_FORBIDDEN)
            
            for job_posting_candidate in job_posting_candidates:
                is_revealed = reveal_candidate_and_update_subscription(job_posting_candidate, request.user.id, request.user.role, valid_subscriptions, credits_to_deduct)

                if not is_revealed:
                    break

                candidate_object = Candidate.objects.get(
                    id=job_posting_candidate.candidate_id_id
                )
                complete_candidate = complete_candidate_data(candidate_object)
                recommended_skill = job_posting_match_skill(
                    candidate_object.id, job_posting.id, False
                )
                if recommended_skill:
                    complete_candidate["recommended_skill"] = recommended_skill

                complete_candidate.update(
                    {
                        "job_posting_candidate_id": job_posting_candidate.id,
                        "is_revealed": is_revealed,
                        "accuracy": job_posting_candidate.accuracy,
                    }
                )
                resp_candidates_list.append(complete_candidate)

            resp_context = {
                "reveals_left": sum([sub.reveals_left for sub in valid_subscriptions]) if request.user.role == 'employer' else get_employee_credits(request.user.id),
                "candidate": resp_candidates_list,
            }

            return Response(resp_context, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"Error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FullServiceSubscription(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request, id):
        job = JobPosting.objects.get(id=id)
        job_location = job.location_id
        company = job_location.company_id
        kanban_board_default_config(company.id)
        subscription, created = Subscription.objects.get_or_create(
            company_id=company, job_posting_id=job, type="full_service"
        )
        revealed_stage = KanbanBoard.objects.get(
            stage_name="Revealed Candidates", company_id=company
        )
        candidates_revealed = JobPostingReveals.objects.filter(job_posting_id_id=id)
        for candidate_revealed in candidates_revealed:
            job_posting_candidate = JobPostingCandidate.objects.get(
                candidate_id=candidate_revealed.candidate_id,
                job_posting_id=candidate_revealed.job_posting_id,
            )
            job_posting_candidate.hiring_stage_id = revealed_stage
            job_posting_candidate.save()
        if created:
            return Response(
                {"Message": "Full Service Subscription Created"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"Message": "Full Service Subscription Already Exists"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def delete(self, request, id):
        job = JobPosting.objects.get(id=id)
        job_location = job.location_id
        company = job_location.company_id
        if JobPostingCandidate.objects.filter(
            job_posting_id=job, published="True"
        ).exists():
            return Response(
                {
                    "Message": "Cannot Remove Full Service as Some Candidates are Already Published"
                },
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        Subscription.objects.filter(
            company_id=company, job_posting_id=job, type="full_service"
        ).delete()
        return Response({"Message": "Removed Full Service"}, status=status.HTTP_200_OK)


class CompanySubscriptionApiView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id):
        subscriptions = Subscription.objects.filter(
            company_id_id=company_id, job_posting_id=None, is_expired=False
        )
        active_subscriptions = []
        screening_records = 0
        company = request.user.location_id.company_id
        credits = 0
        PER_REVEAL_CREDITS = 50
        if request.user.role == "employer":
            for subscription in subscriptions:
                if subscription.type in ["ai_silver", "ai_gold"]:
                    active_subscriptions.append(
                        {
                            "plan_type": "subscription",
                            "subscription": subscription.type,
                            "reveals_left": subscription.reveals_left,
                        }
                    )
                if subscription.type in [
                    "free",
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
                ]:
                    screening_records += subscription.reveals_left
                    #screening_records += credits
            if screening_records > 0:
                active_subscriptions.append(
                    {
                        "plan_type": "one_time",
                        "subscription": "screening_records",
                        "screening_records_left": screening_records,
                    }
                )
            company = Company.objects.get(id=company_id)
            if company.subscription_type == "full_service":
                active_subscriptions.append(
                    {
                        "plan_type": "one_time",
                        "subscription": "full_service",
                    }
                )
            return Response(active_subscriptions, status=status.HTTP_200_OK)
        elif request.user.role == 'hiring_manager':
            credits = get_employee_credits(request.user)
            active_subscriptions.append(
                {
                    "plan_type": "one_time",
                    "subscription": "screening_records",
                    "screening_records_left": credits,
                }
            )
            return Response(active_subscriptions, status=status.HTTP_200_OK)
        

class CompanyBillingApiView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id):
        subscriptions = (
            Subscription.objects.filter(company_id_id=company_id, job_posting_id=None)
            .exclude(type__in=["free", "free_screening"])
            .order_by("-created_at")
        )
        subscriptions_list = []
        for sub in subscriptions:
            payment_history = sub.payment_history_id
            subscription = {
                "start_date": sub.start_date
                if sub.start_date
                else (payment_history.payment_on if payment_history else None),
                "end_date": sub.end_date,
                "subscription_type": sub.type.replace("_", " ").upper(),
                "reveals": sub.reveals,
                "amount": payment_history.amount if payment_history else None,
                "currency": payment_history.currency if payment_history else None,
                "invoice_id": payment_history.invoice_id if payment_history else None,
                "invoice_url": payment_history.invoice_url if payment_history else None,
                "invoice_pdf": payment_history.invoice_pdf if payment_history else None,
                "receipt_url": payment_history.receipt_url if payment_history else None,
                "status": payment_history.status if payment_history else None,
                "is_expired": sub.is_expired or None,
            }
            subscriptions_list.append(subscription)
        return Response(subscriptions_list, content_type="application/json")

class GetHelpWithJobsApiView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def post(self, request):
        data = request.data
        job_title = data.get("job_title")
        help_type = data.get("help_type")
        if not job_title or not help_type:
            return Response(
                {"Error": "Please provide job title and help type"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = self.send_emails(request.user, help_type, job_title)
        if result:
            return Response("Request Submitted Successfully", content_type="application/json", status=status.HTTP_200_OK)
        else:
            return Response("Issue while submitting request", content_type="application/json", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def send_emails(self, user, help_type, job_title):
        email = user.email
        company_name = user.location_id.company_id.name
        from_email = DEFAULT_EMAIL
        subject = f"Request for help in: {help_type}"

        try:
            message_1 = {
                "senderAddress": from_email,  
                "recipients": {
                    "to": [{"address": email}]
                },
                "content": {
                    "subject": subject,
                    "html": render_to_string("full_service_user.html", {"job_title": job_title})  
                }
            }
            response_1 = EMAIL_CLIENT.begin_send(message_1)

            message_2 = {
                "senderAddress": from_email,  
                "recipients": {
                    "to": [{"address": SUPPORT_EMAIL}]
                },
                "content": {
                    "subject": subject,
                    "html": render_to_string("full_service_admin.html", {"job_title": job_title, "help_type": help_type, "email":email, "company_name":company_name})  
                }
            }
            response_2 = EMAIL_CLIENT.begin_send(message_2)

            if response_1.result()["status"] == "Succeeded" and response_2.result()["status"] == "Succeeded":
                return True
            else:
                return False
        except Exception as e:
            return False
        
