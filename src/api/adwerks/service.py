import os
import json
import csv
import tempfile
import requests
import time
import datetime
import secrets
import string
from datetime import date
from bs4 import BeautifulSoup
from django.db import IntegrityError
from django.conf import settings
from candidate.aws import upload_image_from_link
import boto3
from botocore.exceptions import ClientError
import time
import re
from urllib.parse import urlparse
from django.db import connection
from decouple import config
from rest_framework import status
from rest_framework.response import Response
from django.core.mail import EmailMessage
from startdate.settings import EMAIL_CLIENT
from urllib.parse import urlencode
from django.template.loader import render_to_string
from adwerks.models import AdwerkUnsubscribe ,AdwerkMailRecords
from job_posting.models import JobPosting , JobPostingCandidate , JobPostingCandidateSkill , Skill
from company.models import Location, Company
from candidate.models import Candidate, CandidateWorkHistory, CandidateAttributes , CandidateSkill
from accounts.models import User
from machine_learning.models import MLProcess

# Global variable
HEADERS = {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json'
}
APOLLO_API_KEY = config('APOLLOIO_API_KEY')
ADWERK_JOB_POSTING_URL = config('APOLLO_JOB_POSTING_URL')
APOLLO_MIXED_COMPANIES_URL = config('APOLLO_MIXED_COMPANIES_URL')
APOLLO_MIXED_PEOPLE_URL = config('APOLLO_MIXED_PEOPLE_URL')
S3_ACCESS_KEY = config("S3_ACCESS_KEY")
S3_SECRET_KEY = config("S3_SECRET_KEY")
NEXT_APP_DOMAIN_LINK = config("NEXT_APP_DOMAIN_LINK")
DEFAULT_EMAIL = config("DEFAULT_EMAIL")
ENVIRONMENT = config("ENVIRONMENT")

# Create your views here.
STARTDATE_IMAGES_BUCKET = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME


def get_companies_id(account_label_ids):
    # check for the instance

    company_ids = []
    body = {"api_key": APOLLO_API_KEY, "account_label_ids": account_label_ids, "per_page": 100}
    total_entries = post_request(APOLLO_MIXED_COMPANIES_URL, body)
    total_pages  = total_entries.get("pagination").get("total_pages")

    if total_pages:
        for i in range(1,total_pages +1):
            body = {"api_key": APOLLO_API_KEY, "account_label_ids": account_label_ids, "page":i,"per_page": 100}
            list_data = post_request(APOLLO_MIXED_COMPANIES_URL, body)

            if list_data["accounts"]:
                for acc in list_data["accounts"]:
                    company_ids.append({"name": acc.get("name"),
                                        "company_id": acc.get("organization_id"),
                                        "logo": acc.get("logo_url"),
                                        "domain": acc.get("domain"),
                                        "organization_city": acc.get("organization_city"),
                                        "organization_state": acc.get("organization_state"),
                                        "organization_country": acc.get("organization_country"),
                                        "organization_postal_code": acc.get("organization_postal_code"),
                                        })

    if company_ids:
        print("len of companies :",len(company_ids))
        return company_ids
    else:
        return None


def adwerk_job_posting_data(company_id):
    if company_id:
        full_url = ADWERK_JOB_POSTING_URL + company_id + \
            "/job_postings?api_key=" + APOLLO_API_KEY
        
        request_call = requests.get(full_url, headers=HEADERS)
        request_call.raise_for_status()  # raises exception when not a 2xx response

        if request_call.status_code == 429:
            time.sleep(int(response.headers["Retry-After"]))


        if request_call.status_code == 200:
            response = request_call.json()
            return response


def people_search(params, company_domain):
    try:
        person_titles = params.get("person_titles")
        person_locations = params.get("locations")
        req_body = {"api_key": APOLLO_API_KEY, "q_organization_domains": company_domain,
                    "organization_job_locations": person_locations, "contact_email_status": ["verified"],
                    "person_titles": person_titles, 'person_locations': person_locations, 'per_page': 100}

        people_list = post_request(APOLLO_MIXED_PEOPLE_URL, req_body)

        return people_list

    except Exception as e:
        print(e)


def unsubscribe(email):
    try:
      # Create an AdwerkUnsubscribe object with the candidate and email
        unsubscribe_filter = [obj.unsubscribe_email for obj in AdwerkUnsubscribe.objects.filter(
            unsubscribe_email=email)]
        print(unsubscribe_filter)
        if email in unsubscribe_filter:
            message = {"status": True,
                       "message":  "You have already unsubscribed"}
        else:
            unsubscribe_obj, unsubscribe_flag = AdwerkUnsubscribe.objects.get_or_create(
                unsubscribe_email=email,
                unsubscribe_at=datetime.datetime.now(),
            )
            message = {"status": True,
                       "message":  "You have been unsubscribed."}
        return message
    except Exception as e:
        raise e


def Unsubscribe_email_list(email_to):
    try:
        unsubscribe_filter = [obj.unsubscribe_email for obj in AdwerkUnsubscribe.objects.filter(
            unsubscribe_email=email_to)]
        return unsubscribe_filter
    except Exception as e:
        pass


def generate_password(length=128):
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password


def post_request(url, body):
    # For post call
    try:
        response = requests.post(url, headers=HEADERS, json=body)
        return response.json()
    except requests.exceptions.HTTPError as err:
        raise SystemExit(err)


def fetch_object_from_s3_url_with_retry(url, max_retries=3, retry_delay=300):
    parsed_url = urlparse(url)
    bucket_name = parsed_url.netloc
    file_key = parsed_url.path.lstrip('/')

    retries = 0

    while retries < max_retries:
        try:
            # Create an S3 client
            s3 = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)

            # Read the file from S3
            response = s3.get_object(Bucket=bucket_name, Key=file_key)

            # Get the contents of the file
            file_contents = response['Body'].read().decode('utf-8')

            # Return the file contents
            return file_contents

        except ClientError as e:
            # Error occurred, print the error message
            print(f"Error fetching object from S3: {e}")

            retries += 1
            if retries < max_retries:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)

    return None


def alternate_job_scrapper(url, title):
    try:
        response = requests.get(url)

        with tempfile.NamedTemporaryFile(mode="w", prefix=title, delete=False) as temp_file:
            temp_file.write(response.text)
            temp_file_path = temp_file.name
        # Read the saved HTML file
        with open(temp_file_path, "r", encoding="utf-8") as file:
            html_content = file.read()

        # Parse the HTML using BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")

        description = soup.find('div', attrs={
                                'class': 'show-more-less-html__markup show-more-less-html__markup--clamp-after-5 relative overflow-hidden'})

        if description is None:
            description = soup.find('div', attrs={
                                    'class': 'jobs-box__html-content jobs-description-content__text t-14 t-normal jobs-description-content__text--stretch'})

        if description:
            description_resp = description.get_text().strip()

        if description_resp:
            return description_resp

    except Exception as e:
        pass


def adwerks_job_posting_creation(params):
    from candidate.services import address_correction 
    error_users = []
    try:
        titles = params.get("titles")
        locations = params.get("locations")
        account_label_ids = params.get("account_label_ids")
        if titles is None or locations is None or account_label_ids is None:
            return Response("Params Not Valid", status=status.HTTP_404_NOT_FOUND)

        _filter_dict = {}
        _filter_dict['titles'] = titles
        _filter_dict['locations'] = locations

    except Exception as e:
        print(" Exception getting params --------------------- ", e)

    try:
        companies = get_companies_id(account_label_ids)
        count = 0
    except Exception as e:
       print(" Exception getting companies--------------------- ", e)

    try:
        for company in companies:
            try:
                company_id = company.get("company_id")
                company_name = company.get("name")
                company_logo = company.get("logo")
                company_domain = company.get("domain")
                # company_city = company.get('organization_city')
                # company_state = company.get('organization_state')
                # company_country = company.get('organization_country')
                # company_zip = extract_zip(
                #     company.get("organization_postal_code"))

            except Exception as e:
                print(" Exception getting companies data--------------------- ", e)
                pass
                

            print(
                f"company_id {company_id} company_name : {company_name} company domain : {company_domain}")

            if company_domain and company_id is not None:
                # create or get company object
                job_posting_data = adwerk_job_posting_data(company_id)

                if job_posting_data['organization_job_postings']:
                    mixed_peoples = people_search(params, company_domain)
                    company_instance, flag = Company.objects.get_or_create(
                        name=company_name)

                    # upload logo to s3
                    file_key = f'companies/{str(company_instance.id)}'
                    response = upload_image_from_link(
                        STARTDATE_IMAGES_BUCKET, file_key, company_logo)

                    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                        company_instance.logo = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
                        
                        company_instance.save()

                    

                    for job_data in job_posting_data['organization_job_postings']:
                        title = job_data.get('title')
                        title_match = check_job_title(title, titles)
                        if title_match:
                            url = job_data.get('url')
                            scarp_data = alternate_job_scrapper(url, title)

                            if scarp_data:
                                count += 1
                                print("job title : ", title)

                                location_fix = {
                                        'address': "",
                                        'city': job_data.get('city'),
                                        'state': job_data.get('state'),
                                        'country': job_data.get('country')
                                }
                                address = address_correction(location_fix)

                                location_object = Location.objects.filter(state=address['state'], city=address['city'], country=address['country'], company_id_id=company_instance.id).first()

                                if not location_object:
                                    # location_object, flag = Location.objects.get_or_create(address = address['address'] ,state=address['state'], city=address['city'], country=address['country'], zip=address['zip'], company_id_id=company_instance.id)
                                    location_fix.update({"company_id_id":company_instance.id})
                                    location_object = Location.objects.create(**location_fix)

                                    
                                print("location created :", location_object.id,
                                    location_object.city, location_object.state, company_instance.id)
                                
                                location_id = location_object.id

                                # FIXME : ADD created by column to admin user 
                                job_posting_object, job_posting_flag = JobPosting.objects.get_or_create(
                                                                                                        title=title, work_location_type='remote', description=scarp_data, 
                                                                                                        status='active', location_id_id=location_id,
                                                                                                        city = job_data.get('city'),country = job_data.get('country'),state=job_data.get('state'),
                                                                                                        source='adwerks')

                                if job_posting_flag:
                                    MLProcess.objects.create(
                                        status='pending', job_posting_id=job_posting_object)
                        else:
                            print("no matching job posting found ")

                    if mixed_peoples['people']:
                        for people in mixed_peoples['people']:
                            create_candidate(
                                people, company_id_id=company_instance.id)
                            location_obj = Location.objects.filter(company_id_id=company_instance.id).first()
                            if location_obj:
                                if people['email']:
                                    print("creating User", people['email'])
                                    user_obj = {
                                        'first_name': people['first_name'],
                                        'last_name': people['last_name'],
                                        'email': people['email'],
                                        'role': 'employer',
                                        'location_id_id': location_obj.id,
                                        # 'password': generate_password()
                                    }

                                    try:

                                        user_create_obj = User.objects.filter( email=user_obj["email"])

                                        if not user_create_obj:
                                            user_obj['password'] = generate_password()
                                            new_user =  User.objects.create(**user_obj)

                                            candidate_obj = Candidate.objects.filter(email=user_obj["email"])[0]
                                            candidate_obj.user_id_id = new_user.id
                                            candidate_obj.save()

                                            print("new user : ",new_user)

                                    except IntegrityError as e:
                                        del user_obj["password"]
                                        error_users.append(user_obj)
                                        pass


                                if error_users:
                                    today = datetime.date.today().strftime("%Y-%m-%d")
                                    fieldnames = ['first_name', 'last_name',
                                                'email', 'role', 'location_id_id']

                                    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
                                        csv_filename = temp_file.name

                                        with open(csv_filename, mode='w', newline='') as csvfile:
                                            writer = csv.DictWriter(
                                                csvfile, fieldnames=fieldnames)
                                            writer.writeheader()
                                            writer.writerows(error_users)

                                    # uploading the csv to s3
                                    s3 = boto3.client(
                                        's3', aws_access_key_id=S3_ACCESS_KEY, aws_secret_access_key=S3_SECRET_KEY)
                                    s3.upload_file(
                                        csv_filename, "startdate-deploy-scripts", f'adwerks/exception_error_{today}.csv')

                else:
                    print(f'No job posting found {company_id}')
            else:
                print(
                    f"Comapny domain not found :{company_id} comapny name {company_name} ")
    except Exception as e:
        print(e)


def create_candidate(people, company_id_id):
    if people['email']:
        print("creating candidate :",
              people['email'], "Company id : ", company_id_id)
        try:
            for contact in people['phone_numbers']:
                phone = contact['sanitized_number']
        except:
            phone = ""

        candidate_data = {
            'first_name': people['first_name'],
            'last_name': people['last_name'],
            'email': people['email'],
            'profile': people['linkedin_url'],
            'picture': people['photo_url'],
            'phone': phone,
            'source': "Adwerk",
            'external_id': people['id']
        }
        try:
            candidate_object, candidate_created = Candidate.objects.get_or_create(
                **candidate_data)

            candidate_id = candidate_object.id

            location_fix_att = {
                                        'address': "",
                                        'city': people['city'],
                                        'state': people['state'],
                                        'country': people['state'],
                                }
            address = address_correction(location_fix_att)



            candidate_attributes_data = {
                'city': address['city'],
                'state': address['state'],
                'country': address['country'],
                'candidate_id_id': candidate_id
            }
            candidate_attributes_object = CandidateAttributes.objects.get_or_create( **candidate_attributes_data)
            for experience in people['employment_history']:
                company_data = {
                    'name': experience['organization_name']
                }
                # company_object = Company.objects.filter(name=company_data['name'])[0]
                company_object_id = company_id_id
                candidate_work_history_data = {
                    'title': experience['title'],
                    'from_date': experience['start_date'],
                    'description': experience['description'],
                    'company_id_id': company_object_id,
                    'candidate_id_id': candidate_id
                }
                candidate_workhistory_object = CandidateWorkHistory.objects.get_or_create(
                    **candidate_work_history_data)

            people["candidate_id"] = candidate_id

        except (Exception, IntegrityError) as e:
            print("Exception on creating user",e)
            pass
    else:
        print("No data to populate")


def check_job_title(job_title, title_list):
    for title in title_list:
        pattern = re.compile(r'\b' + re.escape(title) + r'\b', re.IGNORECASE)
        if pattern.search(job_title):
            return True
    return False


def extract_zip(s):
    if s:
        # Remove non-numeric characters from the string using str.isdigit()
        numeric_part = ''.join(filter(str.isdigit, s))
        return int(numeric_part)

def find_matching_jobs_for_candidate(source='Adwerk'):
    # Step 1: Fetch candidates with the given source
    candidates = Candidate.objects.filter(source=source)

    # Step 2: Initialize a dictionary to store job postings grouped by location_id
    location_jobs = {}

    # Step 3: Loop through the candidates and find matching jobs
    for candidate in candidates:
        user_id = candidate.user_id_id

        try:
            # Step 4: Find the user with the user_id
            user = User.objects.get(id=user_id)

            # Step 5: Get the location_id of the user
            location_id = user.location_id_id

            # Step 6: Check if the location_id is already in the dictionary
            if location_id not in location_jobs:
                # Step 7: Find all job postings with the same location_id and store them in a list
                matching_job_postings = JobPosting.objects.filter(
                    location_id_id=location_id)
                location_jobs[location_id] = matching_job_postings
        except User.DoesNotExist:
            # Handle the case if the user does not exist for a given candidate
            pass

    # Step 8: Create pairs of users and job_postings with the same location_id
    matching_user_job_pairs = []
    for location_id, job_postings in location_jobs.items():
        users_with_location = User.objects.filter(location_id_id=location_id)
        for user in users_with_location:
            for job_posting in job_postings:
                matching_user_job_pairs.append((user, job_posting))

    return matching_user_job_pairs


def adwerks_mail_service(ENVIRONMENT,from_email,potential_candidates,user,job_posting,location_obj):


    if ENVIRONMENT == 'Local':
        email_to = 'umang.d@navtech.io'
        time_interval  = datetime.timedelta(seconds=1)
    
    elif ENVIRONMENT == 'Staging':
        email_to = 'ch@startdate.co'
        time_interval  = datetime.timedelta(hours=8)
    
    elif ENVIRONMENT == 'Production':
        email_to = user.email
        time_interval  = datetime.timedelta(hours=166)

    email_encode = urlencode({"email": email_to})
    encode_data = urlencode({"source": "Adwerk", "email": email_to,
                            "first_name": user.first_name, "last_name": user.last_name, "job_id": job_posting.id})

    if ENVIRONMENT == 'Local':
        unsubscribelink = f"{NEXT_APP_DOMAIN_LINK}/unsubscribe/{email_encode}"
        activate_link = f'{NEXT_APP_DOMAIN_LINK}/?{encode_data}'
    else:
        unsubscribelink = f"{NEXT_APP_DOMAIN_LINK}/unsubscribe?{email_encode}"
        activate_link = f'{NEXT_APP_DOMAIN_LINK}/?{encode_data}'

    user_data = {"first_name": user.first_name, "title": job_posting.title,
                    "location": location_obj.state, "matched_candidates": potential_candidates,
                    "StartDatelink": f'https://startdate.co/', "FlatFeelink": "https://startdate.co/flat-fee-recruitment", "FullServicelink": "https://startdate.co/full-service-recruiting", "help_employer": "https://startdate.co/recruiting-help-for-employers",
                    "unsubscribe_link": unsubscribelink, "activate_link": activate_link}
    
    reply_email = 'ch@startdate.co'
    headers = {'Reply-To': reply_email}
    to_email = email_to

    try:
        if email_to:

            # First mail is follow up 0
            # Second follow up mail is 1
            # Third follow up mail is 2

            #FIXME : For staging i am putting the time interval of 8hrs  for all the follow up mails

            # Get the current offset-aware datetime
            current_datetime = datetime.datetime.now(datetime.timezone.utc)

            email_obj = AdwerkMailRecords.objects.filter(sent_to=email_to,job_posting_id = job_posting.id).exists()

            if email_obj:

                email_follow_obj = AdwerkMailRecords.objects.filter(sent_to=email_to,job_posting_id = job_posting.id)[0]
                db_datetime = datetime.datetime.strptime(str(email_follow_obj.send_at), "%Y-%m-%d %H:%M:%S.%f%z")

                # Calculate the time difference
                time_difference = current_datetime - db_datetime

                print("time difference :",time_difference ,  "delta time : ",time_interval)

                if email_follow_obj.follow_up == 0 and (time_difference >= time_interval):

                    print(" follow up : ",email_follow_obj.follow_up)

                    # If first mail already sent then send follow up 1
                    subject_data = {"title": job_posting.title, "location": location_obj.state}

                    email_body = render_to_string( "follow_up1.html", user_data)
                    subject = render_to_string( "message_subject1.txt", subject_data)

                    _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=1,type="")


                elif email_follow_obj.follow_up == 1 and (time_difference >= time_interval):
                    # If second mail already sent then send follow up 2      

                    print(" follow up : ",email_follow_obj.follow_up)

                    subject_data = {"title": job_posting.title, "location": location_obj.state}

                    email_body = render_to_string( "follow_up2.html", user_data)
                    subject = render_to_string( "message_subject2.txt", subject_data)

                    _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=2,type="")

            else:
                # If first mail not sent then send follow up 0     

                subject_data = {"title": job_posting.title, "location": location_obj.state}

                email_body = render_to_string( "follow_up0.html", user_data)
                subject = render_to_string( "message_subject0.txt", subject_data)

                _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=0,type="")

    except Exception as e:
        print("Exception during sending the mail : ",e)



def _send_mail(to_email,from_email, headers ,subject  ,email_body,job_posting_id,follow_up,type):

    unsubscribe_email_list = Unsubscribe_email_list(to_email)

    if unsubscribe_email_list is None or to_email not in unsubscribe_email_list:
        message = {
                    "senderAddress": from_email,  
                    "recipients": {
                        "to": [{"address":to_email}]
                    },
                    "content": {
                        "subject": subject,
                        "html": email_body
                    },
                    "headers": headers
        }
        EMAIL_CLIENT.begin_send(message)
        try:
            if follow_up == 0:
                data = {"sent_from": from_email, "sent_to": to_email, "subject": subject,
                        "status": "sent", "send_at": datetime.datetime.now(),"follow_up":follow_up,'job_posting_id_id':job_posting_id,"type":type}

                AdwerkMailRecords.objects.create(**data)
                print("Data saved to db : ", data)
            
            elif follow_up == 1:
                print("follow up : ",follow_up)
                mail_sent_obj = AdwerkMailRecords.objects.filter(sent_to=to_email,follow_up=0)[0]
                mail_sent_obj.follow_up = 1
                mail_sent_obj.save()

            elif follow_up == 2:
                print("follow up : ",follow_up)
                mail_sent_obj = AdwerkMailRecords.objects.filter(sent_to=to_email,follow_up=1)[0]
                mail_sent_obj.follow_up = 2
                mail_sent_obj.save()


        except Exception as e:

            not_data = {"sent_from": from_email, "sent_to": to_email, "subject": subject,
                    "status": "not_sent", "send_at": datetime.datetime.now(),"follow_up":follow_up,'job_posting_id_id':job_posting_id}

            AdwerkMailRecords.objects.create(**not_data)
            print("Not sent data saved to db : ", data)
    else:
        print("Email in unsubscribe list : ", to_email)



def adwerk_manual_entry(job_posting_id,data):
    user_list = data.get("user_list")

    if job_posting_id is None:
        message = {"Error":"Job posting id not found !!!"}
        return Response(message, status=status.HTTP_404_NOT_FOUND)
    
    try:
        job_posting_obj = JobPosting.objects.filter(id=job_posting_id)
        if not job_posting_obj.exists():
            message = {"Error":f"This {job_posting_id} not found !!!"}
            return Response(message, status=status.HTTP_404_NOT_FOUND)
        
    
        location_id = job_posting_obj.first().location_id_id

        location_obj = Location.objects.get(id=location_id)

        if user_list:
            user_obj = []
            job_company = location_obj.company_id

            filtered_obj = User.objects.filter(id__in=user_list)

            for user in filtered_obj:
                user_company  = Location.objects.filter(id=user.location_id_id).first().company_id

                if user_company == job_company:
                    user_obj.append(user)

            print(user_obj)

            if len(user_obj) == 0:
                message = {"Error":f"No user found  from this user list  {user_list}!!!"}
                return Response(message, status=status.HTTP_404_NOT_FOUND)
            
            job_posting_candidate_obj = JobPostingCandidate.objects.filter(job_posting_id_id = job_posting_id )

            if not job_posting_candidate_obj.exists():
                message = {"Error":f"Job posting candidate for {job_posting_obj[0].title} not found !!!"}
                return Response(message, status=status.HTTP_404_NOT_FOUND)
            

            potential_candidates = potential_candidate_pool(job_posting_candidate_obj,location_id)

            for user in user_obj:
                _send_adwerk_manual_email(potential_candidates, user,job_posting_obj.first() , location_obj )
        

            message = {"Message":f"Job {job_posting_obj[0].title} added to Adwerk campaign"}
            return Response(message, status=status.HTTP_200_OK)

        else:
            message = {"Error":"Please select the user !!!"}
            return Response(message, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(e)
        message = {"Error":f"Errror : {e} !!!"}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)
    


def potential_candidate_pool(job_posting_candidate_obj,location_id):
    try:
        potential_candidates = []

        location_obj = Location.objects.get(id=location_id)

        job_posting_candidate = job_posting_candidate_obj.order_by("-accuracy")[:4]

        for job_cad in job_posting_candidate:
            candidate_obj = Candidate.objects.get(id=job_cad.candidate_id_id)
            job_post_cad_dict = {}
            job_post_cad_dict["first_name_cad"] = candidate_obj.first_name
            job_post_cad_dict["loc"] = location_obj.state
            job_post_cad_dict["picture"] = candidate_obj.picture if candidate_obj.picture else None
            job_post_cad_dict["accuracy"] = round(job_cad.accuracy)

            job_posting_candidate_skill = JobPostingCandidateSkill.objects.filter(job_posting_candidate_id_id=job_cad.id)

            skill_list = []
            if job_posting_candidate_skill.exists():
                for candidate_skill in job_posting_candidate_skill:
                    if candidate_skill.candidate_skill_id_id:
                        candidate_skill_obj = CandidateSkill.objects.filter(id=candidate_skill.candidate_skill_id_id).first()

                        skill_obj = Skill.objects.get(id=candidate_skill_obj.skill_id_id)
                        skill_list.append(skill_obj.name)
                    else:
                        skill_list.append(candidate_skill.skill_name)

                
                job_post_cad_dict["skill"] = skill_list



            potential_candidates.append(job_post_cad_dict)
        

        if potential_candidates:
            if len(potential_candidates) > 3 and len(potential_candidates) < 6:
                potential_candidates = potential_candidates[:3]
            
            elif len(potential_candidates) < 3 :
                potential_candidates = potential_candidates

            elif len(potential_candidates) >= 6:
                potential_candidates = potential_candidates[:6]

        return potential_candidates
    
    except Exception as e:
        message = {"Error":f"Errror : {e} !!!"}
        print(message)
        return None
    

def _send_adwerk_manual_email(potential_candidates,user,job_posting, location_obj ):

    from_email = DEFAULT_EMAIL
    
    if ENVIRONMENT == 'Local':
        email_to = 'umang.d@navtech.io'
        time_interval  = datetime.timedelta(seconds=1)
        print("time interval : ",time_interval)
    
    elif ENVIRONMENT == 'Staging':
        email_to = 'ch@startdate.co'
        time_interval  = datetime.timedelta(hours=8)
    
    elif ENVIRONMENT == 'Production':
        email_to = user.email
        time_interval  = datetime.timedelta(hours=166)

    email_encode = urlencode({"email": email_to})
    encode_data = urlencode({"source": "Adwerk", "email": email_to,
                            "first_name": user.first_name, "last_name": user.last_name, "job_id": job_posting.id})

    if ENVIRONMENT == 'Local':
        unsubscribelink = f"{NEXT_APP_DOMAIN_LINK}/unsubscribe/{email_encode}"
        activate_link = f'{NEXT_APP_DOMAIN_LINK}/?{encode_data}'
    else:
        unsubscribelink = f"{NEXT_APP_DOMAIN_LINK}/unsubscribe?{email_encode}"
        activate_link = f'{NEXT_APP_DOMAIN_LINK}/?{encode_data}'

    user_data = {"first_name": user.first_name, "title": job_posting.title,
                    "location": location_obj.state, "matched_candidates": potential_candidates,
                    "StartDatelink": f'https://startdate.co/', "FlatFeelink": "https://startdate.co/flat-fee-recruitment", "FullServicelink": "https://startdate.co/full-service-recruiting", "help_employer": "https://startdate.co/recruiting-help-for-employers",
                    "unsubscribe_link": unsubscribelink, "activate_link": activate_link}
    
    reply_email = 'ch@startdate.co'
    headers = {'Reply-To': reply_email}
    to_email = email_to


    try:
        if email_to:

            # First mail is follow up 0
            # Second follow up mail is 1
            # Third follow up mail is 2

            #FIXME : For staging i am putting the time interval of 8hrs  for all the follow up mails

            # Get the current offset-aware datetime
            current_datetime = datetime.datetime.now(datetime.timezone.utc)

            email_obj = AdwerkMailRecords.objects.filter(sent_to=email_to,job_posting_id = job_posting.id , type='Manual')

            if email_obj.exists():
                email_follow_obj = email_obj[0]
                db_datetime = datetime.datetime.strptime(str(email_follow_obj.updated_at), "%Y-%m-%d %H:%M:%S.%f%z")

                # Calculate the time difference
                time_difference = current_datetime - db_datetime

                print("time difference :",time_difference ,  "delta time : ",time_interval)

                if email_follow_obj.follow_up == 0 and (time_difference >= time_interval):

                    print(" follow up : ",email_follow_obj.follow_up)

                    # If first mail already sent then send follow up 1
                    subject_data = {"title": job_posting.title, "location": location_obj.state}

                    email_body = render_to_string( "follow_up1.html", user_data)
                    subject = render_to_string( "message_subject1.txt", subject_data)

                    _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=1,type="Manual")


                elif email_follow_obj.follow_up == 1 and (time_difference >= time_interval):
                    # If second mail already sent then send follow up 2      

                    print(" follow up : ",email_follow_obj.follow_up)

                    subject_data = {"title": job_posting.title, "location": location_obj.state}

                    email_body = render_to_string( "follow_up2.html", user_data)
                    subject = render_to_string( "message_subject2.txt", subject_data)

                    _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=2,type="Manual")

            else:
                # If first mail not sent then send follow up 0     

                subject_data = {"title": job_posting.title, "location": location_obj.state}

                email_body = render_to_string( "follow_up0.html", user_data)
                subject = render_to_string( "message_subject0.txt", subject_data)

                _send_mail(to_email,from_email,headers ,subject ,email_body,job_posting.id,follow_up=0,type="Manual")

    except Exception as e:
        print("Exception during sending the mail : ",e)