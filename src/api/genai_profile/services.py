import datetime
import json
import os
from decouple import config
from django.conf import settings
from .models import GenProfileProcess
from langchain.chat_models import ChatOpenAI
from candidate.models import Candidate, CandidateAttributes, CandidateWorkHistory, Resumes, CandidateSkill ,CandidateEducationHistory
from company.models import Company
from job_posting.models import  Skill
from machine_learning.services import complete_candidate_data
from candidate.aws import upload_image_from_link
from candidate.services import convert_to_standard_date , query_data


OPENAI_KEY = config("OPENAI_KEY")
OPENAI_MODEL = config("OPENAI_MODEL")
PROFILE_PICTURE_BUCKET = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME

# convert the datetime obj
def convert_date_to_string(obj):
    if isinstance(obj, datetime.date):
        return obj.strftime('%Y-%m-%d')
    return obj


# Generate profile for the candidate with 1000 CPWS staged
def candidate_data(candidate_obj):
    try:
        incomplete_candidate  = complete_candidate_data(candidate_obj)
        incomplete_candidate_json  = json.loads(json.dumps(incomplete_candidate, default=convert_date_to_string, indent=2))
        
        return incomplete_candidate_json
    except Exception as e:
        print(e)


# prompting
def promt_query(data):
    none_keys_list = find_none_keys(data)
    prompt_keys = []
    
    for key in none_keys_list:
        if key.lower() in ['summary', 'description', 'skills', 'skill']:
            prompt_keys.append(key)
        
    _prompt = f"""Context : {data}
                  Objective : Generate the missing values which are {",".join(prompt_keys)} in the Context
                  Format : Result format will be same as Context with generated data which is json format
                  Please put all string in double quotes and in small caps
                """
            
    return _prompt


# generating data
def generate_complete_profile(incomplete_candidate_json):
    
    try:
        os.environ['OPENAI_API_KEY'] = OPENAI_KEY

        query = promt_query(incomplete_candidate_json)
        llm=ChatOpenAI(openai_api_key=os.environ['OPENAI_API_KEY'], model_name=OPENAI_MODEL)
        result = llm.predict(query)
        try:
            #data_string = result.replace("'", "\"").replace('\n', '').replace('None', 'null').replace('True', 'true').replace('False', 'false')
            json_result = json.loads(result)
            print(json_result)
            return json_result
        except json.JSONDecodeError as e:
            return None
    except Exception as e:
        print(e, 'here')
    
def create_genai_candidate(candidate_obj, max_retries=3):
    candidate_staged = candidate_obj.first().staged
    ai_profile_id = candidate_obj.first().ai_candidate_id
    gen_candidate_id = None
    has_gen_data = True
    
    if candidate_staged != '1111' and ai_profile_id is None:
        incomplete_candidate_json = candidate_data(candidate_obj.first())
        
        print(incomplete_candidate_json)
        
        genai_candidate_data = generate_complete_profile(incomplete_candidate_json)
        
        none_keys_genai = find_none_keys(genai_candidate_data)
        for key in none_keys_genai:
            if key.lower() in ['summary','description','skills','skill']:
                has_gen_data = False
        
        if genai_candidate_data and isinstance(genai_candidate_data,dict) and has_gen_data:
            
            gen_candidate_id = ai_candidate_create(genai_candidate_data)
            
            if gen_candidate_id:
                update_candidate_obj = Candidate.objects.filter(email=candidate_obj.first().email).first()
                
                update_candidate_obj.ai_candidate_id = gen_candidate_id
                update_candidate_obj.save()
                return gen_candidate_id
        
        else:
            Genai_obj = GenProfileProcess.objects.filter(candidate_id_id=candidate_obj.first().id).first()
            Genai_obj.status = 'failed'
            Genai_obj.save()   

    
def ai_candidate_create(data):
    try:
        genai_candidate_id = genai_create_candidate(data)
        
        if genai_candidate_id:
            skill_created = genai_skill_created(data,genai_candidate_id)
            wh_created = genai_create_work_history(data, genai_candidate_id)    
            
            if skill_created and wh_created:
                return genai_candidate_id
            
    except Exception as e:
        print("exception on create candidate : ",e)
    
    
def genai_create_candidate(data):
    
    gen_candidate_context = {
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'summary': data.get('summary'),
            'email': None,
            'profile': None,
            'picture': data.get('photo_url',None),
            'phone': data.get('phone'),
            'source': 'Gen_ai',
        }

    print("genai_create_candidate : ",gen_candidate_context)
    
    try:
        gen_candidate_object, candidate_created = Candidate.objects.get_or_create(**gen_candidate_context)
        if gen_candidate_object.picture:
            file_key = f'candidates/{str(gen_candidate_object.id)}'
            response = upload_image_from_link(PROFILE_PICTURE_BUCKET, file_key, gen_candidate_object.picture)
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                gen_candidate_object.picture = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
                gen_candidate_object.save()

        gen_candidate_id = gen_candidate_object.id

        address = data.get("address")
        
        if address:
            gen_candidate_attributes_data = {
                'city': address.get('city'),
                'state': address.get('state'),
                'country': address.get('country'),
                'candidate_id_id': gen_candidate_id
            }

            candidate_attributes_object = CandidateAttributes.objects.get_or_create(**gen_candidate_attributes_data)[0]

        print("gen_candidate_id : ",gen_candidate_id)
        return  gen_candidate_id
    except Exception as e:
        print({"Error Message": f"Exception{e}"})
        gen_candidate_id = None
        return 
    
    
def genai_skill_created(data,gen_candidate_id):
    
    skill_created = False
    
    Skills  = data.get("skills")
    
    print("skill data : ",Skills)
        
    if Skills : 
        for skill_object in Skills:
            
            if isinstance(skill_object,dict):
                skill_object = skill_object.get("skill")
                
            skill, flag = Skill.objects.get_or_create(name=skill_object)
            if skill:
                CandidateSkill.objects.create(candidate_id_id=gen_candidate_id, skill_id_id=skill.id)    
                print("after : ",skill, flag)
                skill_created = True
                
    return skill_created

def genai_create_work_history(data,gen_candidate_id):
    
    work_history_created = False
    
    work_history  = data.get("work_history")
    
    print("work_history data : ",work_history)

    for experience in work_history:

        title = query_data(experience,'title')
        company = query_data(experience,'company')
        description = query_data(experience,'description')
        from_date = query_data(experience,'from_date')
        to_date = query_data(experience,'to_date')

        if from_date in ['Unknown',None]:
            from_date = None
        else :
            from_date = convert_to_standard_date(from_date)

        if to_date in ['Unknown',None]:
            to_date = None
        else :
            to_date = convert_to_standard_date(to_date)

        if title and company:
            company_data = {
                'name': company
            }
            company_object = Company.objects.get_or_create(name=company_data['name'])[0]

            company_object_id = company_object.id

            populate_data = { "title" : title if title else None,
                                "description" : description if description else None,
                                "from_date" : from_date if from_date else None,
                                "to_date" : to_date if to_date else None,
                                'company_id_id': company_object_id,
                                'candidate_id_id': gen_candidate_id
                            }

            candidate_workhistory_object = CandidateWorkHistory.objects.update_or_create(title = title , company_id_id = company_object_id , candidate_id_id = gen_candidate_id ,
                                                                                         defaults = populate_data)[0]
            print("candidate_workhistory_object : ",candidate_workhistory_object.id)
            
            work_history_created = True
            
    return work_history_created


def find_none_keys(data):
    none_keys = []
    for key, value in data.items():
        if value is None or (isinstance(value, list) and len(value) == 0):
            none_keys.append(key)
        elif isinstance(value, dict):
            none_keys.extend(find_none_keys(value))
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    none_keys.extend(find_none_keys(item))
    return none_keys