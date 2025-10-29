from candidate.models import (
    CandidateSkill,
    CandidateAttributes,
    CandidateWorkHistory,
    CandidateEducationHistory,
)
from job_posting.models import Skill, JobPostingReveals
from accounts.models import UserCredits
import datetime
from company.models import Subscription, Company
from payment_history.models import Payment_history
from startdate import settings
import stripe
from rest_framework import status
from rest_framework.response import Response
from .tasks import send_payment_mail
from decouple import config
from accounts.models import UserCredits


ai_silver_price_id = settings.AI_SILVER_SUBSCRIPTION_PRICE_ID
ai_gold_price_id = settings.AI_GOLD_SUBSCRIPTION_PRICE_ID
ai_gold_reveals = settings.AI_GOLD_SUBSCRIPTION_REVEALS
ai_silver_reveals = settings.AI_SILVER_SUBSCRIPTION_REVEALS
EVENTS_BUCKET = settings.AWS_TRIGGER_EVENTS_BUCKET_NAME
STARTER_SCREENING_PRICE_ID = config("STARTER_SCREENING_PRICE_ID")
SILVER_SCREENING_PRICE_ID = config("SILVER_SCREENING_PRICE_ID")
GOLD_SCREENING_PRICE_ID = config("GOLD_SCREENING_PRICE_ID")
PLATINUM_SCREENING_PRICE_ID = config("PLATINUM_SCREENING_PRICE_ID")
PLATINUM_PLUS_PRICE_ID = config("PLATINUM_PLUS_PRICE_ID")
GOLD_PLUS_PRICE_ID = config("GOLD_PLUS_PRICE_ID")
SILVER_PLUS_PRICE_ID = config("SILVER_PLUS_PRICE_ID")
STARTER_PLUS_PRICE_ID = config("STARTER_PLUS_PRICE_ID")
CUSTOM_PRICE_ID = config("CUSTOM_PRICE_ID")
STARTER_SCREENING_RECORDS = settings.STARTER_SCREENING_RECORDS
SILVER_SCREENING_RECORDS = settings.SILVER_SCREENING_RECORDS
GOLD_SCREENING_RECORDS = settings.GOLD_SCREENING_RECORDS
PLATINUM_SCREENING_RECORDS = settings.PLATINUM_SCREENING_RECORDS


def validate_subscription(company_id):
    subscription = {}
    try:
        subscription = Subscription.objects.filter(
            company_id_id=company_id,
            type__in=["ai_silver", "ai_gold", "free", "free_screening","custom_screening"],
            is_expired=False,
        ).order_by("-created_at")[:1][0]
        if subscription.reveals_left > 0:
            return True, subscription
        return False, subscription
    except Exception:
        return False, subscription


def masked_candidate_data(candidate):
    from machine_learning.services import get_candidate_skills, get_candidate_attributes
    candidate_id = str(candidate.id)
    candidate_skills = get_candidate_skills(candidate)
    address = get_candidate_attributes(candidate)

    work_history_list = []
    work_history_data = CandidateWorkHistory.objects.filter(
        candidate_id_id=candidate_id
    )
    for work_history in work_history_data:
        work_history_list.append(
            {
                "id": str(work_history.id),
                "title": work_history.title,
                "company": None,
                "description": work_history.description,
                "from_date": None,
                "to_date": None,
            }
        )
    education_history_list = []
    education_history_data = CandidateEducationHistory.objects.filter(
        candidate_id_id=candidate_id
    )
    for education_history in education_history_data:
        education_history_list.append(
            {
                "id": str(education_history.id),
                "name": None,
                "degree": education_history.degree,
                "from_date": None,
                "to_date": None,
            }
        )

    candidate_data = {
        "candidate_id": candidate_id,
        "first_name": None,
        "last_name": None,
        "phone": None,
        "linked_in": None,
        "picture": candidate.picture,
        "summary": candidate.summary,
        "email": None,
        "skills": candidate_skills,
        "address": address,
        "work_history": work_history_list,
        "education_history": education_history_list,
    }

    return candidate_data


def create_payment_history(invoice, status):
    payment_history = Payment_history.objects.create(
        stripe_subscription_id=invoice["subscription"],
        payment_on=datetime.datetime.fromtimestamp(invoice["created"]),
        invoice_id=invoice["id"],
        amount=invoice["amount_paid"] / 100,
        tax=invoice["tax"] / 100,
        subtotal=invoice["subtotal"] / 100,
        stripe_charge_id=invoice["charge"],
        status=status,
        currency=invoice["lines"]["data"][0]["currency"],
        stripe_customer_id=invoice["customer"],
        payment_intent_id=invoice["payment_intent"],
        price_id=invoice["lines"]["data"][0]["price"]["id"],
        invoice_url=invoice["hosted_invoice_url"],
        invoice_pdf=invoice["invoice_pdf"],
    )
    return payment_history


def invoice_payment_succeeded(invoice):
    try:
        if not Payment_history.objects.filter(invoice_id=invoice["id"]).exists():
            payment_history = create_payment_history(invoice, "paid")
            if invoice["lines"]["data"][0]["price"]["id"] == ai_silver_price_id:
                reveals = ai_silver_reveals
                subscription_type = "ai_silver"
            elif invoice["lines"]["data"][0]["price"]["id"] == ai_gold_price_id:
                subscription = (
                    Subscription.objects.filter(company_id_id=invoice["customer"])
                    .order_by("-created_at")
                    .first()
                )
                reveals = (
                    ai_gold_reveals + subscription.reveals_left if subscription else 0
                )
                subscription_type = "ai_gold"
            else:
                return "failed"
            Subscription.objects.create(
                payment_history_id=payment_history,
                company_id_id=invoice["customer"],
                reveals=reveals,
                start_date=datetime.datetime.fromtimestamp(
                    invoice["lines"]["data"][0]["period"]["start"]
                ),
                end_date=datetime.datetime.fromtimestamp(
                    invoice["lines"]["data"][0]["period"]["end"]
                ),
                reveals_left=reveals,
                type=subscription_type,
            )
            return "success"
        return "already_processed"
    except:
        return "failed"


def invoice_payment_failed(invoice):
    try:
        if not Payment_history.objects.filter(invoice_id=invoice["id"]).exists():
            payment_history = create_payment_history(invoice, "failed")
            if invoice["lines"]["data"][0]["price"]["id"] == ai_silver_price_id:
                subscription_type = "ai_silver"
            elif invoice["lines"]["data"][0]["price"]["id"] == ai_gold_price_id:
                subscription_type = "ai_gold"
            else:
                return "failed"
            Subscription.objects.create(
                payment_history_id=payment_history,
                company_id_id=invoice["customer"],
                reveals=0,
                start_date=datetime.datetime.fromtimestamp(
                    invoice["lines"]["data"][0]["period"]["start"]
                ),
                end_date=datetime.datetime.fromtimestamp(
                    invoice["lines"]["data"][0]["period"]["end"]
                ),
                reveals_left=0,
                type=subscription_type,
            )
            return "success"
        return "already_processed"
    except:
        return "failed"


def stripe_customer_method(request, company_id):
    address_data = {
        "line1": request.data["customer"]["address"].get("line1"),
        "line2": request.data["customer"]["address"].get("line2"),
        "city": request.data["customer"]["address"].get("city"),
        "state": request.data["customer"]["address"].get("state"),
        "postal_code": request.data["customer"]["address"].get("postal_code"),
        "country": request.data["customer"]["address"].get("country"),
    }
    try:
        stripe_customer = stripe.Customer.modify(
            company_id,
            address=address_data,
        )

        stripe.PaymentMethod.attach(
            request.data["payment_method_id"],
            customer=stripe_customer.id,
        )
        if request.data.get("is_custom_screening"):
            return {
                "customer": stripe_customer,
                "quantity": request.data.get("quantity"),
                "credits": request.data.get("total_credits")
            }
        return stripe_customer

    except Exception as e:
        if not isinstance(e, stripe.error.CardError):
            stripe_customer = stripe.Customer.create(
                id=company_id,
                email=request.user.email,
                payment_method=request.data["payment_method_id"],
                address=address_data,
                invoice_settings={
                    "default_payment_method": request.data["payment_method_id"]
                },
            )
            return {
                "customer": stripe_customer,
                "credits": request.data.get("credits")  # Pass credits to the next function
            }
        raise e


def create_subscription_plan(request, company_id, stripe_customer):
    try:
        reveals_left_in_free = 0
        valid_subscription, subscription = validate_subscription(company_id)
        if valid_subscription or subscription:
            if subscription.type == "ai_silver" or subscription.type == "ai_gold":
                return Response(
                    {"Error": "Subscription already Exists"},
                    status=status.HTTP_405_METHOD_NOT_ALLOWED,
                )
            elif subscription.type == "free" or subscription_type == "free_screening":
                reveals_left_in_free = subscription.reveals_left
                subscription.is_expired = True

        if request.data["subscription_plan_type"] == "ai_silver":
            plan_price_id = ai_silver_price_id
            reveals = ai_silver_reveals + reveals_left_in_free
        elif request.data["subscription_plan_type"] == "ai_gold":
            plan_price_id = ai_gold_price_id
            reveals = ai_gold_reveals + reveals_left_in_free

        subscription = stripe.Subscription.create(
            customer=stripe_customer.id,
            items=[
                {
                    "price": plan_price_id,
                }
            ],
            expand=["latest_invoice.payment_intent"],
            automatic_tax={"enabled": True},
        )
        if not subscription["latest_invoice"]["paid"]:
            raise stripe.error.StripeError("Payment was not successful.")
        payment_history = Payment_history.objects.create(
            stripe_subscription_id=subscription.id,
            payment_on=datetime.datetime.fromtimestamp(subscription.created),
            invoice_id=subscription.latest_invoice.id,
            amount=subscription.latest_invoice.amount_paid / 100,
            tax=subscription.latest_invoice.tax / 100,
            subtotal=subscription.latest_invoice.subtotal / 100,
            status="paid",
            stripe_charge_id=subscription.latest_invoice.charge,
            currency=subscription.latest_invoice.currency,
            created_by_id=str(request.user.id),
            payment_method_id=subscription.latest_invoice.payment_intent.payment_method,
            stripe_customer_id=subscription.latest_invoice.customer,
            payment_intent_id=subscription.latest_invoice.payment_intent.id,
            price_id=subscription.latest_invoice.lines.data[0].price.id,
            invoice_url=subscription.latest_invoice.hosted_invoice_url,
            invoice_pdf=subscription.latest_invoice.invoice_pdf,
            receipt_url=subscription.latest_invoice.payment_intent.charges.data[
                0
            ].receipt_url,
        )

        subscription_object = Subscription.objects.create(
            payment_history_id_id=payment_history.id,
            company_id_id=company_id,
            reveals=reveals,
            start_date=datetime.datetime.fromtimestamp(
                subscription.current_period_start
            ),
            end_date=datetime.datetime.fromtimestamp(subscription.current_period_end),
            reveals_left=reveals,
            created_by_id=str(request.user.id),
            type=request.data["subscription_plan_type"],
        )
        subscription.save()
        context = {
            "invoice_id": payment_history.invoice_id,
            "payment_on": payment_history.payment_on,
            "start_date": subscription_object.start_date,
            "end_date": subscription_object.end_date,
            "amount": payment_history.amount,
            "receipt_url": payment_history.receipt_url,
            "invoice_url": payment_history.invoice_url,
            "invoice_pdf": payment_history.invoice_pdf,
            "reveals_left": reveals,
            "status": payment_history.status,
        }
        subscription = "AI Silver"
        if request.data["subscription_plan_type"] == "ai_gold":
            subscription = "AI Gold"
        start_date = subscription_object.start_date.strftime("%m-%d-%Y")
        end_date = subscription_object.end_date.strftime("%m-%d-%Y")
        amount = int(payment_history.amount)
        mail_data = {
            "invoice_id": payment_history.invoice_id,
            "start_date": start_date,
            "end_date": end_date,
            "amount": amount,
            "output_link": payment_history.invoice_pdf,
            "first_name": request.user.first_name,
            "subscription_type": subscription,
        }
        try:
            send_payment_mail.delay(mail_data, "success", request.user.email)
        except:
            pass
        return Response(
            {"success": True, "invoice_details": context},
            content_type="application/json",
        )
    except stripe.error.StripeError as e:
        subscription = "AI Silver"
        reveals = ai_silver_reveals
        if request.data["subscription_plan_type"] == "ai_gold":
            subscription = "AI Gold"
            reveals = ai_gold_reveals
        mail_data = {
            "subscription_type": subscription,
            "first_name": request.user.first_name,
            "reveals": reveals,
        }
        try:
            send_payment_mail.delay(mail_data, "failed", request.user.email)
        except:
            pass
        return Response(
            {"success": False, "error": str(e)}, status=status.HTTP_406_NOT_ACCEPTABLE
        )

def __one_time_plan_type_switch_case(one_time_plan_type, is_plus=False, request=None):
    """
    Get price and credits for one time plan type (BS)
    """
    plans = {
        "starter_screening": {
            "records": STARTER_SCREENING_RECORDS,
            "price_id": STARTER_SCREENING_PRICE_ID,
            "plus_price_id": STARTER_PLUS_PRICE_ID,
        },
        "silver_screening": {
            "records": SILVER_SCREENING_RECORDS,
            "price_id": SILVER_SCREENING_PRICE_ID,
            "plus_price_id": SILVER_PLUS_PRICE_ID,
        },
        "gold_screening": {
            "records": GOLD_SCREENING_RECORDS,
            "price_id": GOLD_SCREENING_PRICE_ID,
            "plus_price_id": GOLD_PLUS_PRICE_ID,
        },
        "platinum_screening": {
            "records": PLATINUM_SCREENING_RECORDS,
            "price_id": PLATINUM_SCREENING_PRICE_ID,
            "plus_price_id": PLATINUM_PLUS_PRICE_ID,
        },
        "custom_screening": {
            "records": request.data.get("total_credits"),
            "price_id": CUSTOM_PRICE_ID,
            "plus_price_id": CUSTOM_PRICE_ID,
        }
    }

    # Dynamically adding "_plus" versions
    for key, value in list(plans.items()):
        plus_key = f"{key}_plus"
        plans[plus_key] = {
            "records": value["records"],
            "price_id": value["price_id"],
            "plus_price_id": value["plus_price_id"],
        }

    # Adjusted logic for fetching plan data
    if one_time_plan_type in plans:
        plan = plans[one_time_plan_type]
        screening_plan_records = plan["records"]
        screening_plan_price_id = plan["plus_price_id"] if is_plus else plan["price_id"]
    else:
        screening_plan_records = None
        screening_plan_price_id = None
    return screening_plan_records, screening_plan_price_id


def __create_and_pay_invoice(stripe_customer, screening_plan_price_id):
    quantity = stripe_customer.get("quantity", 0)  # Default to 1 if not specified

    invoice_created = stripe.Invoice.create(
        customer=stripe_customer["customer"].id,
        automatic_tax={"enabled": True},
        metadata={
            'credits': quantity,
            'price_per_credit': 0.19,
            'total_amount': float(quantity * 0.19)
        }
    )

    # Create invoice item with quantity
    stripe.InvoiceItem.create(
        customer=stripe_customer["customer"].id,
        price=screening_plan_price_id,
        quantity=stripe_customer.get("quantity"),
        invoice=invoice_created.id,
    )

    paid_invoice = stripe.Invoice.pay(invoice_created.id)
    return paid_invoice

def __create_and_pay_invoice_custom(stripe_customer, screening_plan_price_id):
    # Get the credits (quantity) from the stripe_customer dict
    quantity = stripe_customer.get("quantity", 0)  # Default to 1 if not specified

    invoice_created = stripe.Invoice.create(
        customer=stripe_customer["customer"].id,
        automatic_tax={"enabled": True},
        metadata={
            'credits': quantity,
            'price_per_credit': 0.19,
            'total_amount': float(quantity * 0.19)
        }
    )

    # Create invoice item with quantity
    stripe.InvoiceItem.create(
        customer=stripe_customer["customer"].id,
        price=screening_plan_price_id,
        quantity=stripe_customer.get("quantity"),
        invoice=invoice_created.id,
    )

    paid_invoice = stripe.Invoice.pay(invoice_created.id)
    return paid_invoice


def create_one_time_plan(request, company_id, stripe_customer, is_plus=False):
    try:
        one_time_plan_type = request.data["one_time_plan_type"]
        (
            screening_plan_records,
            screening_plan_price_id,
        ) = __one_time_plan_type_switch_case(one_time_plan_type, is_plus, request=request)
        if not screening_plan_price_id:
            return Response(
                {"Error": "Something is wrong with chosen one time plan type"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.data.get("is_custom_screening"):
            paid_invoice = __create_and_pay_invoice_custom(
                stripe_customer, screening_plan_price_id
            )
        else:
            paid_invoice = __create_and_pay_invoice(
                stripe_customer, screening_plan_price_id
            )
        if not paid_invoice["paid"]:
            raise stripe.error.StripeError("Payment was not successful.")
        payment_history = Payment_history.objects.create(
            payment_on=datetime.datetime.fromtimestamp(paid_invoice.created),
            invoice_id=paid_invoice.id,
            amount=paid_invoice.total / 100,
            tax=paid_invoice.tax / 100,
            subtotal=paid_invoice.subtotal / 100,
            status="paid",
            stripe_charge_id=paid_invoice.charge,
            currency=paid_invoice.currency,
            created_by_id=str(request.user.id),
            stripe_customer_id=paid_invoice.customer,
            payment_intent_id=paid_invoice.payment_intent,
            price_id=paid_invoice.lines.data[0].price.id,
            invoice_url=paid_invoice.hosted_invoice_url,
            invoice_pdf=paid_invoice.invoice_pdf,
        )

        subscription_object = Subscription.objects.create(
            payment_history_id_id=payment_history.id,
            company_id_id=company_id,
            reveals=screening_plan_records,
            reveals_left=screening_plan_records,
            created_by_id=str(request.user.id),
            type=request.data["one_time_plan_type"],
        )

        context = {
            "invoice_id": payment_history.invoice_id,
            "payment_on": payment_history.payment_on,
            "start_date": subscription_object.start_date,
            "end_date": subscription_object.end_date,
            "amount": payment_history.amount,
            "receipt_url": payment_history.receipt_url,
            "invoice_url": payment_history.invoice_url,
            "invoice_pdf": payment_history.invoice_pdf,
            "reveals_left": screening_plan_records,
            "status": payment_history.status,
        }
        return Response(
            {"success": True, "invoice_details": context},
            content_type="application/json",
        )
    except stripe.error.StripeError as e:
        print(str(e))
        return Response(
            {"success": False, "error": str(e)}, status=status.HTTP_406_NOT_ACCEPTABLE
        )


def validate_screening_records_left(company):
    screening_records = 0
    try:
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
            "custom_screening",
        ]
        subscriptions = Subscription.objects.filter(
            company_id=company, type__in=subscription_types, is_expired=False
        ).order_by("-created_at")
        for subscription in subscriptions:
            screening_records += subscription.reveals_left
        if screening_records > 0:
            return True, screening_records
        return False, screening_records
    except:
        return False, screening_records


def deduct_screening_record(company, user=None):
    if user.role == "hiring_manager":
        user = UserCredits.objects.filter(user=user).first()
        if user:
            user.credits -= 1
            user.save()
        return
    elif user.role == 'employer':
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
                "custom_screening",
        ]
        subscription = Subscription.objects.filter(
            company_id=company,
            type__in=subscription_types,
            is_expired=False,
            reveals_left__gt=0,
        ).order_by("-created_at")[0]

        screening_records = subscription.reveals_left - 1
        subscription.reveals_left = screening_records
        subscription.save()


def all_valid_subscriptions(company_id):
    company_obj = Company.objects.get(id=company_id)
    type_of_subscription = ["ai_silver", "ai_gold", "free", "free_screening","custom_screening"]

    if company_obj.candidate_scope == "self":
        type_of_subscription = [
            "free_screening",
            "starter_screening",
            "starter_screening_plus",
            "silver_screening",
            "silver_screening_plus",
            "gold_screening",
            "gold_screening_plus",
            "platinum_screening",
            "platinum_screening_plus",
            "custom_screening",
            "free"
        ]

    return Subscription.objects.filter(
        company_id=company_obj,
        type__in=type_of_subscription,
        is_expired=False,
        reveals_left__gt=0,
    ).order_by("reveals_left")


def reveal_candidate_and_update_subscription(
    job_posting_candidate, request_user_id, role,valid_subscriptions=None, credits_to_deduct=None
):
    has_been_revealed = JobPostingReveals.objects.filter(
        job_posting_id_id=job_posting_candidate.job_posting_id_id,
        candidate_id_id=job_posting_candidate.candidate_id_id,
    ).exists()
    
    if has_been_revealed:
        return False

    if(role == 'employer'):
        for subscription in valid_subscriptions:
            if subscription.reveals_left >= credits_to_deduct:
                JobPostingReveals.objects.create(
                    job_posting_id_id=job_posting_candidate.job_posting_id_id,
                    candidate_id_id=job_posting_candidate.candidate_id_id,
                    revealed_by_id=str(request_user_id),
                    subscription_id_id=subscription.id,
                )
                subscription.reveals_left -= credits_to_deduct
                subscription.save()
                return True
    elif(role == 'hiring_manager'):
        user = UserCredits.objects.filter(user_id=request_user_id).first()
        if(user.credits >= credits_to_deduct):
            JobPostingReveals.objects.create(
                    job_posting_id_id=job_posting_candidate.job_posting_id_id,
                    candidate_id_id=job_posting_candidate.candidate_id_id,
                    revealed_by_id=str(request_user_id),
            )
            user.credits -= credits_to_deduct
            user.save()
            return True

    return False
