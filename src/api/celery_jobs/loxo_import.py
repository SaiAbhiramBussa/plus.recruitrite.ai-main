import requests
from candidate.models import Candidate, CandidateAttributes, CandidateWorkHistory, CandidateSkill, \
    CandidateEducationHistory
from company.models import Company
from job_posting.models import Skill, JobPosting
from job_posting.tasks import process_candidates, process_candidates_into_ml


def people_search_api(current_title, scroll_id):
    url = f'https://app.loxo.co/api/startdate-inc/people?per_page=100'
    if current_title:
        url = url + f'&query=current_title%3A{current_title}'
    if scroll_id:
        url = url + "&scroll_id=" + scroll_id

    headers = {
        "accept": "application/json",
        "authorization": "Basic c3RhcnRkYXRlLWluY19hcGk6cWZkMmNlciFqcHI0S1pHKmdjbQ=="
    }

    response = requests.get(url, headers=headers)
    data = response.json()
    return data


def complete_person_search_api(person_id):
    url = f'https://app.loxo.co/api/startdate-inc/people/{person_id}'

    headers = {
        "accept": "application/json",
        "authorization": "Basic c3RhcnRkYXRlLWluY19hcGk6cWZkMmNlciFqcHI0S1pHKmdjbQ=="
    }

    response = requests.get(url, headers=headers)
    data = response.json()
    return data


def import_candidates_work_education_history(person_id, candidate_id):
    complete_person_search_response = complete_person_search_api(person_id)
    for education_profile in complete_person_search_response['education_profiles']:
        education_history = {
            'name': education_profile['school'],
            'degree': education_profile['degree'],
            'candidate_id_id': candidate_id
        }
        education_history_object = CandidateEducationHistory.objects.get_or_create(**education_history)[0]

    for job_profile in complete_person_search_response['job_profiles']:
        company_id = None
        if job_profile['company']['name'] is not None:
            company_object = Company.objects.get_or_create(name=job_profile['company']['name'])[0]
            company_id = company_object.id
        from_date = None
        to_date = None
        if job_profile['month'] != 0 and job_profile['month'] is not None and job_profile['year'] != 0 and job_profile['year'] is not None:
            from_date = str(job_profile['year']) + '-' + str(job_profile['month']) + '-01'

        if job_profile['end_month'] != 0 and job_profile['end_month'] is not None and job_profile['end_year'] != 0 and job_profile['end_year'] is not None:
            to_date = str(job_profile['end_year']) + '-' + str(job_profile['end_month']) + '-15'

        work_history = {
            'title': job_profile['title'],
            'description': job_profile['description'],
            'from_date': from_date,
            'to_date': to_date,
            'candidate_id_id': candidate_id,
            'company_id_id': company_id,
        }
        work_history_object = CandidateWorkHistory.objects.get_or_create(**work_history)[0]


def loxo_import_candidates(current_title, scroll_id):
    # total_count = 90000
    # imported_count = 0
    # failed_count = 0
    # scroll_id = None

    # while total_count > 0 and imported_count < total_count:
    # print(f'imported_count: {imported_count}, total_count: {total_count},scroll_id: {scroll_id}, failed_count: {failed_count}')
    people_search_api_response = people_search_api(current_title, scroll_id)
    scroll_id = people_search_api_response['scroll_id']
    # total_count = people_search_api_response['total_count']

    if people_search_api_response['people'] is None:
        print(" people_search_api_response['people'] is None ")
        quit()

    for candidate in people_search_api_response['people']:
        try:
            try:
                emails = []
                for email_data in candidate['emails']:
                    emails.append(email_data['value'])
                email = ', '.join(emails)
            except:
                email = None

            try:
                phones = []
                for phone_data in candidate['phones']:
                    phones.append(phone_data['value'])
                phone = ', '.join(phones)
            except:
                phone = None

            candidate_data = {
                'first_name': candidate['name'],
                'email': email,
                'phone': phone,
                'profile': candidate['linkedin_url'],
                'picture': candidate['profile_picture_thumb_url'],
                'source': "Loxo",
                'external_id': candidate['id'],
                'address': candidate['address']
            }

            # find_by_external_id
            candidate_object = Candidate.objects.create(**candidate_data)
            candidate_id = candidate_object.id

            candidate_attributes_data = {
                'address': candidate['location'],
                'candidate_id_id': candidate_id,
                'zip': candidate['zip']
            }
            candidate_attributes_object = CandidateAttributes.objects.get_or_create(**candidate_attributes_data)[0]
            skills = []
            if candidate['skillsets'] is not None:
                skills = candidate['skillsets'].split(', ')

            if len(skills) != 0:
                for skill in skills:
                    if len(skill) <= 255:
                        if not Skill.objects.filter(name=skill).exists():
                            skill_obj = Skill.objects.create(name=skill)
                        else:
                            skill_obj = Skill.objects.filter(name=skill).first()
                        candidate_skill = CandidateSkill.objects.get_or_create(candidate_id_id=candidate_id, skill_id_id=skill_obj.id)[0]

            import_candidates_work_education_history(candidate['id'], candidate_id)

            # imported_count = imported_count + 1
        except Exception as e:
            print(e)
            # imported_count = imported_count + 1
            # failed_count = failed_count + 1
            continue
    if people_search_api_response['scroll_id']:
        loxo_import_candidates(current_title=None, scroll_id=people_search_api_response['scroll_id'])
        print(f'scroll_id: {scroll_id}')
    print("here at the end where no one can reach")


def loop_through_titles():
    job_postings = JobPosting.objects.filter(created_by_id='c95565ad-9876-4f68-bf78-fa3eb46dfffd')
    for job_posting in job_postings:
        print(f'getting candidates for job title: {job_posting.title}')
        try:
            loxo_import_candidates(current_title=job_posting.title, scroll_id=None)
        except Exception as e:
            print(e)
