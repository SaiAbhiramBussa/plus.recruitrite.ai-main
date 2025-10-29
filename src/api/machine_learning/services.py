from django.db import connection, DataError
from django.template.loader import render_to_string
from sklearn.feature_extraction.text import TfidfVectorizer
from django.db.models import Q, Subquery
from machine_learning.models import MLTrainingData
from candidate.aws import get_presigned_url
from candidate.models import (
    CandidateAttributes,
    CandidateWorkHistory,
    CandidateEducationHistory,
    CandidateSkill,
    Candidate,
    Resumes,
    CandidateMaskSettings,
)
from job_posting.models import (
    Skill,
    JobPosting,
    JobPostingSkill,
    JobPostingCandidate,
    JobPostingCandidateSkill,
    JobPostingReveals,
)
from company.models import Company, Location, KanbanBoard, Subscription
from celery_jobs.models import ApolloJobs
from machine_learning.tasks import ml_push_candidate, openai_push
from accounts.models import User
from payment_history.services import deduct_screening_record, validate_screening_records_left
from .models import MLProcess, MLTrainingData
import re
import datetime
import requests
import json
import tempfile
import csv
from django.core.mail import EmailMessage
from urllib.parse import urlencode
from startdate import settings
import boto3
from rest_framework.response import Response
from rest_framework import status
from decouple import config
import shutil
import base64
# OPENAI IMPORTS
import os
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders import UnstructuredFileLoader


# Imports for Model
import spacy
from fuzzywuzzy import process, fuzz, utils
from collections import Counter
from datetime import date
from natsort import natsorted
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from io import BytesIO
from nltk import sent_tokenize  # this helps to split text into Sentences
from nltk import word_tokenize  # this helps to split text into individual Words
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer
from sentence_transformers import SentenceTransformer
from transformers import BertTokenizer
from transformers import BertForSequenceClassification
import pandas as pd
import numpy as np
import torch
from django.core.exceptions import MultipleObjectsReturned


device = torch.device("cuda")

print(device)


DEFAULT_EMAIL = config("DEFAULT_EMAIL")
OPENAI_KEY = config("OPENAI_KEY")
OPENAI_MODEL = config("OPENAI_MODEL")
RESUME_BUCKET = settings.AWS_RESUME_STORAGE_BUCKET_NAME
candidate_bucket = config("CANDIDATE_POOL_BUCKET")
NEXT_APP_DOMAIN_LINK = config("NEXT_APP_DOMAIN_LINK")
ENVIRONMENT = config("ENVIRONMENT")
SUPPORT_EMAIL = config("SUPPORT_EMAIL")
EMAIL_CLIENT = settings.EMAIL_CLIENT

# nltk.download('punkt')
# nltk.download('stopwords')
# nltk.download('wordnet')


def prescreen_onsite_query_result(job_posting_id):
    (
        title_parameter,
        city,
        state,
        country,
        work_location_type,
        remote_type,
        company,
    ) = append_job_posting_skills(job_posting_id)
    if work_location_type == "onsite" or work_location_type == "hybrid":
        query = """
        SELECT DISTINCT cw.candidate_id_id
                FROM candidate_work_history cw
                JOIN candidate c ON cw.candidate_id_id = c.id JOIN candidate_attributes cl ON cl.candidate_id_id = c.id
                WHERE to_tsvector(cw.title) @@ to_tsquery(%s)
                AND (c.staged = '1101' OR c.staged = '1011' OR c.staged = '1111' OR c.staged = '1100' OR c.staged = '1010' OR c.staged = '1110') AND 
                (to_tsvector(cl.city) @@ to_tsquery(%s) OR to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.state) @@ to_tsquery(%s))
        """
        params = [title_parameter, city, city, state, state]
        if company.candidate_scope == "self":
            query = """
            SELECT DISTINCT cw.candidate_id_id
                FROM candidate_work_history cw
                JOIN companies_candidates cc ON cw.candidate_id_id = cc.candidate_id_id
                JOIN candidate c ON cc.candidate_id_id = c.id 
                JOIN candidate_attributes cl ON cl.candidate_id_id = c.id
                WHERE to_tsvector(cw.title) @@ to_tsquery(%s)
                AND (c.staged = '1101' OR c.staged = '1011' OR c.staged = '1111' OR c.staged = '1100' OR c.staged = '1010' OR c.staged = '1110') AND 
                (to_tsvector(cl.city) @@ to_tsquery(%s) OR to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.state) @@ to_tsquery(%s))
                AND cc.company_id_id = %s
            """
            params = [title_parameter, city, city, state, state, str(company.id)]
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
            return result

    elif work_location_type == "remote":
        query = """
                SELECT DISTINCT cw.candidate_id_id
                FROM candidate_work_history cw
                JOIN candidate c ON cw.candidate_id_id = c.id 
                JOIN candidate_attributes cl ON cl.candidate_id_id = c.id
                WHERE to_tsvector(cw.title) @@ to_tsquery(%s)
                AND (c.staged = '1101' OR c.staged = '1011' OR c.staged = '1111' OR c.staged = '1100' OR c.staged = '1010' OR c.staged = '1110')
            """
        params = [title_parameter]
        if company.candidate_scope == "self":
            query = """
                SELECT DISTINCT cw.candidate_id_id
                FROM candidate_work_history cw
                JOIN companies_candidates cc ON cw.candidate_id_id = cc.candidate_id_id
                JOIN candidate c ON cc.candidate_id_id = c.id 
                JOIN candidate_attributes cl ON cl.candidate_id_id = c.id
                WHERE to_tsvector(cw.title) @@ to_tsquery(%s)
                AND (c.staged = '1101' OR c.staged = '1011' OR c.staged = '1111' OR c.staged = '1100' OR c.staged = '1010' OR c.staged = '1110')
                AND cc.company_id_id = %s
            """
            params = [title_parameter, str(company.id)]
        if remote_type == "state":
            append_query = """
                AND (to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.state) @@ to_tsquery(%s))
            """
            query = query + append_query
            params += [state, state]
        elif remote_type == "country":
            append_query = """
                AND (to_tsvector(cl.address) @@ to_tsquery(%s) OR to_tsvector(cl.country) @@ to_tsquery(%s))
            """
            query = query + append_query
            params += [country, country]

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
            return result


def get_candidate_skills(candidate):
    candidate_skills = []
    candidate_skill_names = []
    skills_id = CandidateSkill.objects.filter(candidate_id=candidate)
    for skill_id in skills_id:
        skill = Skill.objects.filter(id=skill_id.skill_id_id).first()
        candidate_skill_names.append(skill.name)
        candidate_skills.append(
            {"skill": skill.name, "candidate_skill_id": str(skill_id.id)}
        )
    return candidate_skills


def get_candidate_attributes(candidate):
    candidate_attributes = CandidateAttributes.objects.filter(
        candidate_id=candidate
    ).first()
    if candidate_attributes:
        return {
            "id": str(candidate_attributes.id),
            "address": candidate_attributes.address,
            "city": candidate_attributes.city,
            "state": candidate_attributes.state,
            "zip_code": candidate_attributes.zip,
        }
    else:
        return {}


def get_education_history(candidate):
    education_history_list = []
    education_history_data = CandidateEducationHistory.objects.filter(
        candidate_id=candidate
    ).order_by("-from_date")
    for education_history in education_history_data:
        education_history_list.append(
            {
                "id": str(education_history.id),
                "name": education_history.name,
                "degree": education_history.degree,
                "from_date": education_history.from_date,
                "to_date": education_history.to_date,
            }
        )
    return education_history_list


def get_resumes(candidate, doc_masked=False, video_masked=False):
    resumes_list = []
    resumes_data = Resumes.objects.filter(candidate_id=candidate)
    for resume in resumes_data:
        url = get_presigned_url(RESUME_BUCKET, resume.key, expiration=1800)
        if resume.type == 'doc' and not doc_masked:
            resumes_list.append(
                {
                    "resume_id": str(resume.id),
                    "resume_type": resume.type,
                    "resume_url": url,
                }
            )
        if resume.type == 'video' and not video_masked:
            resumes_list.append(
                {
                    "resume_id": str(resume.id),
                    "resume_type": resume.type,
                    "resume_url": url,
                }
            )
    return resumes_list


def get_work_history(candidate, company_masked=False, title_masked=False):
    work_history_list = []
    work_history_data = CandidateWorkHistory.objects.filter(
        candidate_id=candidate
    ).order_by("-from_date")
    for work_history in work_history_data:
        company = work_history.company_id
        work_history_list.append(
            {
                "id": str(work_history.id),
                "title": None if not work_history.to_date and title_masked else work_history.title,
                "company": None if not work_history.to_date and company_masked else company.name,
                "description": work_history.description,
                "from_date": work_history.from_date,
                "to_date": work_history.to_date,
            }
        )
    return work_history_list


def candidate_admin_card(candidate):
    candidate_skills = get_candidate_skills(candidate)
    address = get_candidate_attributes(candidate)

    candidate_data = {
        "candidate_id": str(candidate.id),
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "credentials": candidate.credentials,
        "phone_code": ("+" + str(candidate.phone.country_code))
        if candidate.phone
        else None,
        "phone": str(candidate.phone.national_number) if candidate.phone else None,
        "linked_in": candidate.profile,
        "picture": candidate.picture,
        "summary": candidate.summary,
        "email": candidate.email,
        "skills": candidate_skills,
        "address": address,
        "staged": candidate.staged,
    }
    return candidate_data


def applied_candidate_data(candidate):
    mc_settings = CandidateMaskSettings.objects.filter(candidate_id=candidate).first()
    if not mc_settings:
        return complete_candidate_data(candidate)
    if not mc_settings.is_active:
        return complete_candidate_data(candidate)
    candidate_skills = get_candidate_skills(candidate)
    address = get_candidate_attributes(candidate)
    work_history_list = get_work_history(candidate, mc_settings.current_company, mc_settings.current_title)
    education_history_list = get_education_history(candidate)
    resumes_list = get_resumes(candidate, mc_settings.resume, mc_settings.video_resume)

    candidate_data = {
        "candidate_id": str(candidate.id),
        "first_name": candidate.first_name if not mc_settings.name else None,
        "last_name": candidate.first_name if not mc_settings.name else None,
        "credentials": candidate.credentials,
        "phone_code": ("+" + str(candidate.phone.country_code))
        if candidate.phone and candidate.phone.country_code and (not mc_settings.contact) else None,
        "phone": str(
            candidate.phone.national_number) if candidate.phone and candidate.phone.national_number and mc_settings.contact else candidate.phone.raw_input if candidate.phone and (not mc_settings.contact) else None,
        "linked_in": candidate.profile if not mc_settings.contact else None,
        "picture": candidate.picture if not mc_settings.picture else None,
        "summary": candidate.summary,
        "email": candidate.email if not mc_settings.contact else None,
        "skills": candidate_skills,
        "address": address,
        "work_history": work_history_list,
        "education_history": education_history_list,
        "resumes": resumes_list,
        "staged": candidate.staged,
    }
    return candidate_data


def complete_candidate_data(candidate):
    try:
        candidate_skills = get_candidate_skills(candidate)
        address = get_candidate_attributes(candidate)
        work_history_list = get_work_history(candidate)
        education_history_list = get_education_history(candidate)
        resumes_list = get_resumes(candidate)
        candidate_data = {
            "candidate_id": str(candidate.id),
            "first_name": candidate.first_name,
            "last_name": candidate.last_name,
            "credentials": candidate.credentials,
            "phone_code": ("+" + str(candidate.phone.country_code))
            if candidate.phone and candidate.phone.country_code else None,
            "phone": str(candidate.phone.national_number) if candidate.phone and candidate.phone.national_number else candidate.phone.raw_input if candidate.phone else None,
            "linked_in": candidate.profile,
            "picture": candidate.picture,
            "summary": candidate.summary,
            "email": candidate.email,
            "skills": candidate_skills,
            "address": address,
            "work_history": work_history_list,
            "education_history": education_history_list,
            "resumes": resumes_list,
            "staged": candidate.staged,
        }
        return candidate_data
    except Exception as e:
        print(e)


def shareable_link_candidate_card(candidate):
    candidate_id = str(candidate.id)
    candidate_skills = get_candidate_skills(candidate)
    work_history_list = get_work_history(candidate)
    education_history_list = get_education_history(candidate)

    candidate_data = {
        "candidate_id": candidate_id,
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "phone": '',
        "linked_in": '',
        "picture": candidate.picture,
        "summary": candidate.summary,
        "email": '',
        "skills": candidate_skills,
        "address": {},
        "work_history": work_history_list,
        "education_history": education_history_list,
    }
    return candidate_data


def write_candidate_file(entry, candidate_path, job_posting_id):
    candidate_skills = []
    candidate_skill_names = []
    candidate = Candidate.objects.get(id=entry[0])
    candidate_id = str(candidate.id)
    skills_id = CandidateSkill.objects.filter(candidate_id_id=candidate_id)
    for skill_id in skills_id:
        skill = Skill.objects.get(id=skill_id.skill_id_id)
        candidate_skill_names.append(skill.name)
        candidate_skills.append(
            {"skill": skill.name, "candidate_skill_id": str(skill_id.id)}
        )
    candidate_attributes = CandidateAttributes.objects.filter(
        candidate_id_id=candidate_id
    ).first()
    address = {
        "id": str(candidate_attributes.id),
        "address": candidate_attributes.address,
        "city": candidate_attributes.city,
        "state": candidate_attributes.state,
    }
    work_history_list = []
    work_history_data = CandidateWorkHistory.objects.filter(
        candidate_id_id=candidate_id
    ).order_by("-from_date")
    for work_history in work_history_data:
        company = Company.objects.get(id=work_history.company_id_id)
        work_history_list.append(
            {
                "id": str(work_history.id),
                "title": work_history.title,
                "company": company.name,
                "description": work_history.description,
                "from_date": work_history.from_date,
                "to_date": work_history.to_date,
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
                "name": education_history.name,
                "degree": education_history.degree,
                "from_date": education_history.from_date,
                "to_date": education_history.to_date,
            }
        )

    with open(f"{candidate_path}/{candidate_id}.txt", "w") as f:
        f.write(f"Candidate Id: {candidate_id}\n")
        f.write(f"Job Posting Id: {job_posting_id}\n")
        f.write(f"Candidate Name: {candidate.first_name}\n")
        f.write(f"Summary: {candidate.summary}\n")
        f.write(f"Tags: {candidate.tags}\n")
        # f.write(f'Address: {address["city"] + ", " + address["state"]}\n')
        f.write(f'Skills: {", ".join(candidate_skill_names)}\n')
        f.write(f"# Work History:\n")
        for wh in work_history_list:
            f.write(f'* Title: {wh["title"]}\n')
            f.write(f'  Company: {wh["company"]}\n')
            f.write(f'  Description: {wh["description"]}\n')
            f.write(f'  From Date: {wh["from_date"]}\n')
            f.write(f'  To Date: {wh["to_date"]}\n')
        f.write(f"# Education History:\n")
        for eh in education_history_list:
            f.write(f'* School Name: {eh["name"]}\n')
            f.write(f'  Degree: {eh["degree"]}\n')
            f.write(f'  From Date: {eh["from_date"]}\n')
            f.write(f'  To Date: {eh["to_date"]}\n')


def write_job_posting_file(jp_path, job_posting_id):
    job_posting = JobPosting.objects.get(id=job_posting_id)
    skill_names = []
    jp_skills_id = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)
    for jp_skill_id in jp_skills_id:
        skill = Skill.objects.get(id=jp_skill_id.skill_id_id)
        skill_names.append(skill.name)

    with open(f"{jp_path}/{job_posting_id}.txt", "w") as f:
        f.write(f"Job Posting Id: {job_posting_id}\n")
        f.write(f"Job Title: {job_posting.title}\n")
        f.write(f"Job Description: {job_posting.description}\n")
        f.write(f"Compensation: {job_posting.compensation}\n")
        f.write(f"Work Location Type: {job_posting.work_location_type}\n")
        f.write(f'Skills: {", ".join(skill_names)}\n')


def append_job_posting_skills(job_posting_id):
    job_posting = JobPosting.objects.get(id=job_posting_id)
    title = job_posting.title
    title = re.sub(r"[^\w\s]+", "", title)
    title = re.sub(r"\d+", " ", title)
    title = re.sub(r"\s+", " ", title).strip()
    print(title, " - title")
    # title_string = '&'.join(title)
    title_string = title.replace(" ", "&")
    job_skills = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)
    skill_names = []
    for skill in job_skills:
        try:
            skill_object = Skill.objects.get(id=skill.skill_id_id)
            skill_name = skill_object.name
            skill_name = skill_name.split()
            skill_name = "&".join(skill_name)
            skill_names.append(skill_name)
        except Exception as e:
            print(e)
    skills_string = "|".join(skill_names)
    # combined_string = skills_string + '|' + title_string
    combined_string = title_string

    city_string = job_posting.city.replace(" ", "|") if job_posting.city else None
    state_string = job_posting.state.replace(" ", "|") if job_posting.state else None
    country_string = (
        job_posting.country.replace(" ", "|") if job_posting.country else None
    )
    work_location_type = job_posting.work_location_type
    remote_type = job_posting.remote_type
    company = job_posting.location_id.company_id
    return (
        combined_string,
        city_string,
        state_string,
        country_string,
        work_location_type,
        remote_type,
        company,
    )


def un_publish_candidate(request):
    job_posting_id = request.data["job_posting_id"]
    candidates_id = request.data["candidates_id"]
    already_un_published = JobPostingCandidate.objects.filter(
        candidate_id_id__in=candidates_id,
        job_posting_id_id=job_posting_id,
        published="False",
    )
    JobPostingCandidate.objects.filter(
        candidate_id_id__in=candidates_id, job_posting_id_id=job_posting_id
    ).update(
        published="False", hiring_stage_id_id=None, updated_at=datetime.datetime.now()
    )
    context = {
        "un_published": already_un_published.count(),
        "total_requested_count": len(candidates_id),
    }
    return context


def publish_candidate(request):
    job_posting_id = request.data["job_posting_id"]
    candidates_id = request.data["candidates_id"]
    company_id = request.data["company_id"]
    if not Subscription.objects.filter(
        job_posting_id=job_posting_id, company_id_id=company_id
    ).exists():
        return Response(
            {"Error": "Activate Full Service for this Job Posting"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
    already_published = JobPostingCandidate.objects.filter(
        candidate_id_id__in=candidates_id,
        job_posting_id_id=job_posting_id,
        published="True",
    )
    board_stage = KanbanBoard.objects.get(
        stage_name="Sourced", company_id_id=company_id
    )
    JobPostingCandidate.objects.filter(
        candidate_id_id__in=candidates_id, job_posting_id_id=job_posting_id
    ).update(
        published="True",
        updated_at=datetime.datetime.now(),
        hiring_stage_id=board_stage,
    )
    context = {
        "published": already_published.count(),
        "total_requested_count": len(candidates_id),
    }
    return context


def get_similar_phrases(job_desc_file, resume_file, n):
    try:
        # get sentences from job description

        resume_sentences = nltk.sent_tokenize(job_desc_file)

        # get tf-idf vector representation of job description sentences and resume
        vectorizer = TfidfVectorizer()
        tfidf_resume = vectorizer.fit_transform(resume_sentences)
        tfidf_job_desc = vectorizer.transform([job_desc_file])

        # get similar phrases between job description and resume
        similar_phrases = []

        for i in range(len(resume_sentences)):
            sentence = resume_sentences[i]
            score = (tfidf_job_desc * tfidf_resume[i].T).toarray()[0][0]
            if score >= 0 and sentence != ".":
                similar_phrases.append((sentence, score))

        # sort the similar phrases in descending order of score
        similar_phrases = sorted(similar_phrases, key=lambda x: x[1], reverse=True)

        # return the top n similar phrases
        return similar_phrases[:n]

    except Exception as e:
        print(e)
        similar_phrases = []
        return similar_phrases


def clean_text_mod(text):
    # Remove email addresses
    text = re.sub(r"\S+@\S+", "", text)

    # Remove phone numbers
    text = re.sub(r"\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}", "", text)

    # Remove specific strings and insert newline character
    text = re.sub(
        r"(Skills.*(?:\n|$)|Job.*(\n)|Other Address:.*(?:\n|$)|Candidate Rank:.*(?:\n|$)|<br><br>.*(?:\n|$)|<br>\.*(?:\n|$)|Candidate Id:.*(?:\n|$)|Job Posting Id:.*(?:\n|$)|Candidate Name:.*(?:\n|$)|Summary:|Tags:|Work History:|#|Title:.*(?:\n|$)|Company:.*(?:\n|$)|Description:|From Date:|To Date:|Education History:*(?:\n|$)|School Name:*(?:\n|$)|School Name:.*(?:\n|$)|Degree:.*(?:\n|$)|\*)",
        r"\n",
        text,
    )

    # Remove dates
    text = re.sub(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "", text)

    # Add space after .
    text = re.sub(r"\.(?![^\S\r\n])", " . ", text)

    # Add space after :
    text = re.sub(r"\:(?![^\S\r\n])", ": ", text)

    # replace &amp string with &
    text = re.sub(r"&amp;|&amp", "&", text)

    # fixing *some* formatting issues found in record
    text = re.sub(r"\*", " . ", text)
    text = re.sub(r"\|", ".", text)
    text = re.sub(r";\.", ".", text)
    text = re.sub(r"( - )| -|\^-", r"\n", text)

    # Remove 'None'
    text = re.sub(r"None", "", text)

    # Remove strings with pattern "four digits - two digits - two digits"
    text = re.sub(r"\d{4}-\d{2}-\d{2}", "", text)

    # reverse bullet point formatting
    if "•" or "●" or "*" in text:
        text = re.sub(r"•|●|\*", "\.\n", text)
        text = re.sub(r"\.{2,}", "\.", text)

    # cleaning up whitespaces and extra periods
    text = re.sub(r"\s\.", ".", text)
    text = re.sub(r"\n", ". ", text)
    text = re.sub(r"\.{2,}", ". ", text)

    return text.strip()


def clean_skills(skill_section):
    # Find string starting with "Skills:" and ending with a newline

    match = re.search(r"Skills:.*\n", skill_section)
    if match:
        # Get the matched string and remove leading/trailing whitespaces
        skill_section = match.group(0).strip()
    else:
        # Return an empty string if no match is found
        skill_section = ""

    # cleaning skills
    skill_section = re.sub(r"Skills:", "", skill_section)
    skill_section = re.sub(r", and", "", skill_section)
    skill_section = re.sub(r"(\.|\;|\,)", r"\1\n", skill_section)
    skill_section = re.sub(r",", ".", skill_section)

    return skill_section


def get_matching_skill_score(resume, job_desc, candidate_id):
    # Read the resume file
    resume = resume

    # Read the job description file
    jd = job_desc

    # Clean the resume file and job description file
    skills_file = clean_skills(resume)
    resume_file = clean_text_mod(resume)
    job_desc_file = clean_text_mod(jd)

    similar_skills = []

    # checking if the skills and phrases have content
    check_skills = re.sub(r"[^\w\s]", "", skills_file).replace(" ", "")
    print(f"first time to calculate check skills : {check_skills} ")
    check_resume = re.sub(r"[^\w\s]", "", resume_file).replace(" ", "")

    similar_output = " "

    flag = None

    # Determine which function to use based on the contents of the resume file
    if len(check_skills) != 0:
        similar_skills = get_similar_phrases(skills_file, job_desc_file, n=8)
        similar_output = sorted(similar_skills, key=lambda x: x[1], reverse=True)

        if len(similar_output) > 1:
            flag = "skill"

    return similar_output, flag


def preprocess(text):
    # Tokenize the text into sentences and words
    sentences = sent_tokenize(text)
    words = [word_tokenize(sentence.lower()) for sentence in sentences]

    # Remove stop words and punctuations
    stop_words = set(stopwords.words("english"))
    words = [
        [word for word in sentence if word.isalnum() and word not in stop_words]
        for sentence in words
    ]

    # Lemmatize the words
    lemmatizer = WordNetLemmatizer()
    words = [[lemmatizer.lemmatize(word) for word in sentence] for sentence in words]

    # Combine the words back into sentences
    sentences = [" ".join(sentence) for sentence in words]
    return " ".join(sentences)


def clean_data(data):
    text = re.sub(r"\[[0-9]*\]", " ", data)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r",", " ", text)
    return text


def summarize(cleaned_article_content, num_of_sentence):
    cleaned_article_content = clean_data(cleaned_article_content)
    cleaned_article_content = preprocess(cleaned_article_content)
    summarized_text = ""
    parser = PlaintextParser.from_string(cleaned_article_content, Tokenizer("english"))
    summarizer = LexRankSummarizer()
    summary = summarizer(parser.document, num_of_sentence)
    for sentence in summary:
        summarized_text = summarized_text + str(sentence)
        return summarized_text


def clear_phrases(text):
    pattern = r"candidate rank \d+"
    text = re.sub(pattern, "", text)

    pattern = r"\b\w+\snone\b"
    text = re.sub(pattern, "", text)

    phrases = [
        "candidate id",
        "job posting id",
        "candidate name",
        "date",
        "title",
        "br",
    ]

    for phrase in phrases:
        text = text.replace(phrase, "")
    return text.strip()


def clean_html(raw_html):
    cleanr = re.compile("<.*?>")  # Regex to identify HTML tags
    cleantext = re.sub(cleanr, "", str(raw_html))  # Remove HTML tags
    cleantext = re.sub(
        r'\sstyle="[^"]+"', "", cleantext, flags=re.I
    )  # Remove inline CSS (case insensitive)
    return cleantext


def alerts_data_see_all_profiles(job_posting):
    company = job_posting.location_id.company_id
    ml_process_data = {
        "job_posting_id": str(job_posting.id),
        "title": job_posting.title,
        "location": {"city": job_posting.city, "state": job_posting.state},
        "company_id": str(company.id),
        "company": company.name,
        "created_at": job_posting.created_at,
    }
    created_by = None
    if job_posting.created_by:
        created_by = {
            "email": job_posting.created_by.email,
            "first_name": job_posting.created_by.first_name,
            "last_name": job_posting.created_by.last_name,
        }
    ml_process_data.update({"created_by": created_by})
    return ml_process_data


def email_recommended_candidates_alert(alert_type, mail_data):
    email_body = render_to_string("alert.html", mail_data)
    subject_data = {"alert_type": alert_type}
    subject = render_to_string("alert_subject.txt", subject_data)
    cc = "employer@navtech.io"
    to_email = DEFAULT_EMAIL
    from_email = DEFAULT_EMAIL
    
    message = {
            "senderAddress": DEFAULT_EMAIL,  
            "recipients": {
                "to": [{"address": to_email}]
            },
            "content": {
                "subject": subject,
                "html": email_body
            }
         }
    EMAIL_CLIENT.begin_send(message)


def upload_to_s3(csv_data, bucket, file_name):
    client_s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    try:
        csv_buffer = BytesIO()
        # Convert DataFrame to CSV and store in buffer
        csv_data.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)  # Reset the buffer position to the beginning
        client_s3.upload_fileobj(csv_buffer, bucket, file_name)
        print(f"File uploaded successfully to s3://{bucket}/{file_name}")
    except Exception as e:
        print(f"Error uploading file: {e}")


def model_refresh(request, id):
    try:
        data = {"job_posting_id_id": id, "status": "pending"}
        ml_inprogress_obj = MLProcess.objects.filter(
            job_posting_id_id=id, status="in_progress"
        )
        ml_pending_obj = MLProcess.objects.filter(
            job_posting_id_id=id, status="pending"
        )
        if ml_inprogress_obj or ml_pending_obj:
            return {
                "message": "Candidate refresh already initiated",
                "status_code": 403,
            }
        else:
            MLProcess.objects.create(**data)
            return {
                "message": "Candidate refresh initiated successfully",
                "status_code": 200,
            }

    except Exception as e:
        print(e)
        return {"message": f"{e}", "status_code": 500}


def model_ranking(model_name, job_posting_id, result_set, pushed_candidates):
    accuracy_gre_50 = []
    accuracy_less_50 = []

    jp_path = f"ml_output_files/{job_posting_id}"
    os.mkdir(jp_path)
    candidate_path = f"ml_output_files/{job_posting_id}/candidates"
    os.mkdir(candidate_path)

    for entry in result_set:
        write_candidate_file(entry, candidate_path, job_posting_id)
    write_job_posting_file(jp_path, job_posting_id)

    file_list = os.listdir(f"ml_output_files/{job_posting_id}/candidates/")
    desc_file = open(f"ml_output_files/{job_posting_id}/{job_posting_id}.txt", "r")
    job_desc_text = desc_file.read()
    sorted_list_file = natsorted(file_list)
    resume_directory = []
    for sorted_files in sorted_list_file:
        for file in file_list:
            if file == sorted_files:
                if not file.endswith("Job_Description.txt"):
                    file_data = open(
                        f"ml_output_files/{job_posting_id}/candidates/{file}", "r"
                    )
                    resume = file_data.read()
                    resume_directory.append(
                        {"resume_id": file.split(".")[0], "resume": resume}
                    )

    cosine_model = SentenceTransformer(model_name)
    scores = []
    job_text = clear_phrases(summarize(job_desc_text, 80))
    data = []
    for resume in resume_directory:
        # clean the data
        resume_text = clear_phrases(summarize(resume["resume"], 80))
        data.append(
            {
                "candidate_id": resume["resume_id"],
                "job_description": job_text,
                "resume": resume_text,
            }
        )

    if data:
        test_df = pd.DataFrame(
            data, columns=["candidate_id", "job_description", "resume"]
        )
        candidate_pool_csv = model_prediction(test_df, "bert-base-uncased")
        if candidate_pool_csv is not None:
            current_date = date.today().strftime("%Y-%m-%d")
            file_name = f"{job_posting_id}/{current_date}.csv"
            upload_to_s3(candidate_pool_csv, candidate_bucket, file_name)

            for index, data in candidate_pool_csv.iterrows():
                if data["pred"] == 1:
                    documents1 = [data["job_description"], data["resume"]]
                    text_embeddings1 = cosine_model.encode(
                        documents1, show_progress_bar=True
                    )
                    similarities1 = cosine_similarity(text_embeddings1)
                    similarities_sorted1 = similarities1.argsort()
                    id_1 = []
                    id_2 = []
                    score = []
                    temp = similarities1[0][similarities_sorted1[-2]]
                    scores.append(temp[0])
                    for index, array in enumerate(similarities_sorted1):
                        id_1.append(index)
                        id_2.append(array[-2])
                        score.append(similarities1[index][array[-2]])

                    if pushed_candidates:
                        if not JobPostingCandidate.objects.filter(
                            candidate_id_id=data["candidate_id"],
                            job_posting_id_id=job_posting_id,
                        ).exists():
                            JobPostingCandidate.objects.create(
                                candidate_id_id=data["candidate_id"],
                                job_posting_id_id=job_posting_id,
                                accuracy=round(score[0] * 100, 4),
                            )

                        if JobPostingCandidate.objects.filter(
                            candidate_id_id=data["candidate_id"],
                            job_posting_id_id=job_posting_id,
                        ).exists():
                            for resume in resume_directory:
                                if resume["resume_id"] == data["candidate_id"]:
                                    output = ranking_skill(
                                        resume["resume"],
                                        job_desc_text,
                                        data["candidate_id"],
                                    )
                                    if output:
                                        for match in output:
                                            skill_name, accuracy = match[0], match[1]
                                            try:
                                                create_candidate_skill(
                                                    job_posting_id,
                                                    data["candidate_id"],
                                                    skill_name,
                                                    accuracy,
                                                )
                                            except DataError:
                                                continue

                        if round(score[0] * 100, 4) > 50.0000:
                            accuracy_gre_50.append(
                                {
                                    "candidate_id_id": data["candidate_id"],
                                    "job_posting_id_id": job_posting_id,
                                }
                            )
                        else:
                            accuracy_less_50.append(
                                {
                                    "candidate_id_id": data["candidate_id"],
                                    "job_posting_id_id": job_posting_id,
                                }
                            )

                    if (
                        round(score[0] * 100, 4) > 50.0000
                        and pushed_candidates is False
                    ):
                        if not JobPostingCandidate.objects.filter(
                            candidate_id_id=data["candidate_id"],
                            job_posting_id_id=job_posting_id,
                        ).exists():
                            JobPostingCandidate.objects.create(
                                candidate_id_id=data["candidate_id"],
                                job_posting_id_id=job_posting_id,
                                accuracy=round(score[0] * 100, 4),
                            )

                        if JobPostingCandidate.objects.filter(
                            candidate_id_id=data["candidate_id"],
                            job_posting_id_id=job_posting_id,
                        ).exists():
                            for resume in resume_directory:
                                if resume["resume_id"] == data["candidate_id"]:
                                    output = ranking_skill(
                                        resume["resume"],
                                        job_desc_text,
                                        data["candidate_id"],
                                    )
                                    if output:
                                        for match in output:
                                            skill_name, accuracy = match[0], match[1]
                                            try:
                                                create_candidate_skill(
                                                    job_posting_id,
                                                    data["candidate_id"],
                                                    skill_name,
                                                    accuracy,
                                                )
                                            except DataError:
                                                continue

                elif data["pred"] == 0 and pushed_candidates:
                    accuracy_less_50.append(
                        {
                            "candidate_id_id": data["candidate_id"],
                            "job_posting_id_id": job_posting_id,
                            "accuracy": 0,
                        }
                    )

    shutil.rmtree(jp_path)
    print(" deletion done ")

    if accuracy_gre_50 or accuracy_less_50 or pushed_candidates:
        return accuracy_gre_50, accuracy_less_50


def ranking_skill(resume, job_desc_text, candidate_id):
    output, flag = get_matching_skill_score(resume, job_desc_text, candidate_id)

    if flag is None:
        output = smiliar_keywords(job_desc_text, resume)
        print(f"output : {output} candidate_id :  {candidate_id}")

        if output is None:
            output = []
            (
                matching_keywords,
                matching_keywords_percentages,
            ) = calculate_matching_keywords_and_percentage(job_desc_text, resume)

            print("Matching Keywords:", matching_keywords)
            print("Matching Keywords Percentages:")
            for keyword, percentages in matching_keywords_percentages.items():
                two_words = keyword.split(" ")
                if len(two_words) > 1 and "" not in two_words:
                    output.append((keyword, percentages[1]))
                    print(f"Keyword: {keyword}")
                    print(f"Percentage in Resume: {percentages[1]:.2f}%")

    return output


def create_candidate_skill(job_posting_id, candidate_id, skill_name, accuracy):
    skill_name = skill_name.replace(".", " ")

    if isinstance(accuracy, int):
        accuracy = accuracy
    else:
        accuracy = round(accuracy * 100, 4)

    skill_obj = Skill.objects.filter(name=skill_name.rstrip())

    if skill_obj.exists():
        skill_obj = skill_obj.first()
        try:
            candidate_skill_obj, created = CandidateSkill.objects.get_or_create(
                candidate_id_id=candidate_id, skill_id_id=skill_obj.id
            )
        except MultipleObjectsReturned:
            candidate_skill_obj = CandidateSkill.objects.filter(
                candidate_id_id=candidate_id, skill_id_id=skill_obj.id
            ).first()

        job_posting_candidate_obj = JobPostingCandidate.objects.filter(
            candidate_id_id=candidate_id, job_posting_id_id=job_posting_id
        ).first()

        if candidate_skill_obj and job_posting_candidate_obj:
            try:
                job_skill_cad_obj, created = JobPostingCandidateSkill.objects.get_or_create(
                    accuracy=accuracy,
                    candidate_skill_id_id=candidate_skill_obj.id,
                    job_posting_candidate_id_id=job_posting_candidate_obj.id,
                )
            except MultipleObjectsReturned:
                job_skill_cad_obj = JobPostingCandidateSkill.objects.filter(
                    accuracy=accuracy,
                    candidate_skill_id_id=candidate_skill_obj.id,
                    job_posting_candidate_id_id=job_posting_candidate_obj.id,
                ).first()

    else:
        job_posting_candidate_obj = JobPostingCandidate.objects.filter(
            candidate_id_id=candidate_id, job_posting_id_id=job_posting_id
        ).first()

        if job_posting_candidate_obj:
            try:
                job_skill_cad_obj, created = JobPostingCandidateSkill.objects.get_or_create(
                    accuracy=accuracy,
                    job_posting_candidate_id_id=job_posting_candidate_obj.id,
                    skill_name=skill_name,
                )
            except MultipleObjectsReturned:
                job_skill_cad_obj = JobPostingCandidateSkill.objects.filter(
                    accuracy=accuracy,
                    job_posting_candidate_id_id=job_posting_candidate_obj.id,
                    skill_name=skill_name,
                ).first()


def model_prediction(final_csv, model_name):
    from keras.preprocessing.sequence import pad_sequences

    tokenizer = BertTokenizer.from_pretrained(model_name, do_lower_case=True)
    model = BertForSequenceClassification.from_pretrained(
        "/home/ubuntu/saved_model/Model0.2"
    )

    model.to(device)

    sentA = final_csv.job_description.values
    sentB = final_csv.resume.values

    # Tokenize all the sentences and map the tokens to thier word IDs.
    input_ids = []
    sent_ids = []

    for i in range(0, sentA.shape[0]):
        # 'encode' will tokenize every word in the sentence,
        # Add [CLS] and [SEP] special characters to the beggining and end of the sentence (also add [SEP] between sentA and B)
        # Finally map every token to their ID
        encoded_sent = tokenizer(sentA[i], sentB[i], add_special_tokens=True)

        sent_ids.append(encoded_sent["token_type_ids"])
        input_ids.append(encoded_sent["input_ids"])

    # Example of the first sentence
    print("Pair Sentence: {0} {1}".format(sentA[0], sentB[0]))
    print("Sentence IDS:", sent_ids[0])
    print("BERT tokens IDs:", input_ids[0])

    # Set the maximum sequence length. It needs to be larger than 4577
    max_len = max([len(sent) for sent in input_ids]) + 3

    print("Padding all the sentences to:", max_len)

    # Set PAD IDs as value=0 for the attention mask
    # "post" means that we add those special characters to the end of the sentence
    input_ids = pad_sequences(
        input_ids,
        maxlen=max_len,
        dtype="long",
        value=0,
        truncating="post",
        padding="post",
    )

    # SEt the PAD IDs as 1, as we move them to the back of the sentence
    sent_ids = pad_sequences(
        sent_ids,
        maxlen=max_len,
        dtype="long",
        value=1,
        truncating="post",
        padding="post",
    )

    print("Padding completed!")

    # Create attention mask vector
    att_masks = []

    for sent in input_ids:
        # This vector will have two possible values [0,1]. All the padding tokens can't be masked, so we need to set them as 0, the rest as 1
        mask = [int(id > 0) for id in sent]
        att_masks.append(mask)

    preds = []

    input_ids = torch.tensor(input_ids)
    att_masks = torch.tensor(att_masks)
    sent_ids = torch.tensor(sent_ids)

    for input_id, att_mask, sent_id, candidate_id, job_desc, resume in zip(
        input_ids,
        att_masks,
        sent_ids,
        final_csv["candidate_id"],
        final_csv["job_description"],
        final_csv["resume"],
    ):
        input_id = torch.tensor(input_id).unsqueeze(0)
        att_mask = torch.tensor(att_mask).unsqueeze(0)
        sent_id = torch.tensor(sent_id).unsqueeze(0)

        # print(input_id.shape)

        b_input_ids = input_id.to(device)
        b_input_mask = att_mask.to(device)
        b_sent_ids = sent_id.to(device)

        max_length = 512

        b_input_ids = b_input_ids[:, :max_length]
        b_input_mask = b_input_mask[:, :max_length]
        b_sent_ids = b_sent_ids[:, :max_length]

        padding_length = max_length - b_input_ids.size(1)

        b_input_ids = torch.cat(
            [
                b_input_ids,
                torch.zeros(
                    (b_input_ids.size(0), padding_length),
                    dtype=torch.long,
                    device=device,
                ),
            ],
            dim=1,
        )
        b_input_mask = torch.cat(
            [
                b_input_mask,
                torch.zeros(
                    (b_input_mask.size(0), padding_length),
                    dtype=torch.long,
                    device=device,
                ),
            ],
            dim=1,
        )
        b_sent_ids = torch.cat(
            [
                b_sent_ids,
                torch.zeros(
                    (b_sent_ids.size(0), padding_length),
                    dtype=torch.long,
                    device=device,
                ),
            ],
            dim=1,
        )

        # Tell the model not to compute or store gradients
        with torch.no_grad():
            # Perform the forward pass. This output will return the predictions, because we haven't specified the labels
            outputs = model(
                b_input_ids,
                # Same as "segment ids", which differentiates sentence 1 and 2
                token_type_ids=b_sent_ids,
                attention_mask=b_input_mask,
            )

        # Get the "logits" output, which are the predictions befroe applying the activation function (e.g., softmax)
        logits = outputs[0]

        # Move logits and labels to CPU
        logits = logits.detach().cpu().numpy()

        preds.append(
            {
                "candidate_id": candidate_id,
                "job_description": job_desc,
                "resume": resume,
                "pred": np.argmax(logits),
            }
        )

    # making the candidate pool csv
    if preds:
        prediction_csv = pd.DataFrame(
            preds, columns=["candidate_id", "job_description", "resume", "pred"]
        )
        return prediction_csv

    else:
        return None


def PdfScraperOpenAi(file):
    try:
        os.environ["OPENAI_API_KEY"] = OPENAI_KEY

        loader = UnstructuredFileLoader(file)
        documents = loader.load()
        query = f""" Use the following context to answer the below question:
                    Context: 
                    ```
                    {documents[0].page_content}
                    ```
                    Question: Provide following details as it is in context
                    - name
                    - email
                    - phone_number
                    - address :  
                                - city
                                - state
                                - country
                                - zip-code
                    - summary
                    - skills
                    - education : 
                        - name 
                        - degree
                        - from_date
                        - to_date
                    - experience :
                        - title
                        - company
                        - description 
                        - from_date
                        - to_date
                    - public links 
                    Please respond with json format and please make every key in json small caps
                    """

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            json={
                "model": OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": query},
                ],
            },
            timeout=1000,
        )

        if response.status_code == 200:
            result = response.json()

            content = result["choices"][0]["message"]["content"]
            json_data = json.loads(content, strict=False)

            print("Json-data :", json_data)

            final_result = Formatting_openai_result(json_data)

            print("final_result :", final_result)

            return final_result

            # Handle the result here
        else:
            # Handle non-200 status codes (e.g., error responses)
            error = {"Error": f"{response.status_code}, {response.text}"}
            return error

    except requests.exceptions.Timeout as e:
        # Handle the timeout error here
        return e
    except Exception as e:
        # Handle other exceptions
        return e


def get_key(formatted_json, key1, key2):
    return (
        formatted_json.get(key1)
        if formatted_json.get(key1)
        else formatted_json.get(key2)
    )


def handle_skills(formatted_json):
    skills = get_key(formatted_json, "Skills", "skills")
    if not isinstance(skills, list):
        if isinstance(skills, str):
            if "," in skills:
                skills = skills.split(",")
            elif "|" in skills:
                skills = skills.split("|")
            else:
                skills = skills

        elif isinstance(skills, dict):
            _sk = skills.values()
            skill_list = []
            for skill in _sk:
                if "," in skill:
                    sk = skill.split(",")
                    skill_list.extend(sk)

                elif "|" in skill:
                    sk = skill.split("|")
                    skill_list.extend(sk)

            skills = skill_list

    skills = [{"skill": skill} for skill in skills]

    return skills


def handle_education(formatted_json):
    educations = get_key(formatted_json, "education", None)
    if not isinstance(educations, list):
        educations = [educations] if isinstance(educations, dict) else []
    return [
        {
            **edu,
            "from_date": convert_date(edu.get("from_date")),
            "to_date": convert_date(edu.get("to_date")),
        }
        for edu in educations
    ]


def handle_experience(formatted_json):
    experiences = get_key(formatted_json, "experience", None)
    if not isinstance(experiences, list):
        experiences = [experiences] if isinstance(experiences, dict) else []
    return [
        {
            **exp,
            "from_date": convert_date(exp.get("from_date")),
            "to_date": convert_date(exp.get("to_date")),
        }
        for exp in experiences
    ]


def convert_date(date_string):
    # Define the various possible date formats
    formats = [
        "%B %Y",
        "%b %Y",
        "%d %B %Y",
        "%d-%b-%Y",
        "%d/%m/%Y",
        "%d-%m-%y",
        "%y-%m-%d",
        "%m-%y",
        "%y-%m",
        "%Y",
        "%y",
        "%m/%y",
        "%m/%Y",
    ]

    # If the date string is "Present", return the current date
    if date_string == " ":
        return date_string

    elif date_string is None:
        date_string = " "
        return date_string

    elif date_string.lower() == "present":
        return datetime.datetime.now().strftime("%m-%d-%Y")

    elif date_string.lower() == "currently employed":
        return datetime.datetime.now().strftime("%m-%d-%Y")

    # Try to convert the date string into a datetime object
    for fmt in formats:
        try:
            date_object = datetime.datetime.strptime(date_string, fmt)
            return date_object.strftime("%m-%d-%Y")
        except ValueError:
            pass

    # If none of the formats match, return emplty string
    empty = " "
    return empty


def Formatting_openai_result(formatted_json):
    try:
        Context_json = {}

        Context_json["skills"] = handle_skills(formatted_json)

        phone_number = get_key(formatted_json, "contact phone number", "phone_number")
        address = get_key(formatted_json, "address", None)

        name_parts = formatted_json.get("name").split(" ")
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])

        Context_json["first_name"] = first_name
        Context_json["last_name"] = last_name

        Context_json["phone"] = extract_numbers_and_plus(phone_number)

        Context_json["summary"] = get_key(formatted_json, "Summary", "summary")

        Context_json["email"] = get_key(formatted_json, "contact email", "email")

        if address:
            Context_json["address"] = {
                "city": get_key(address, "city", "City"),
                "state": get_key(address, "State", "state"),
                "country": get_key(address, "country", "country"),
                "zip_code": get_key(address, "zip-code", "Zip-code"),
            }

        Context_json["education_history"] = handle_education(formatted_json)
        Context_json["work_history"] = handle_experience(formatted_json)

        Context_json["Public_links"] = get_key(formatted_json, "public links", None)

        return Context_json

    except Exception as e:
        print("Exception formatting json", e)
        return e


def extract_numbers_and_plus(input_string):
    if input_string:
        pattern = r"[0-9+]+"
        matches = re.findall(pattern, input_string)
        return "".join(matches)
    else:
        return None


def candidate_push_ml(request=None, job_id=None, candidates=None, user=None,apollo_id=None):
    try:
        if request:
            data = request.data
            user_email = request.user.email
            user_name = request.user.first_name
            candidate_objs = []
            candidates = data.get("candidates")
            job_posting_id = data.get("job_posting")
        else:
            job_posting_id = job_id
            candidate_objs = []
            candidates = candidates
            user_email = user.email
            user_name = user.first_name

        if not job_posting_id:
            error_message = {"message": f"Job id not found {job_posting_id}"}
            return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

        if not JobPosting.objects.filter(id=job_posting_id).exists():
            error_message = {"message": f"Invalid Job id {job_posting_id}"}
            return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(candidates, list):
            error_message = {"message": f"Invalid Candidates Params {candidates}"}
            return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

        for candidate_id in candidates:
            if Candidate.objects.filter(id=candidate_id).exists():
                candidate_objs.append([candidate_id])

        if candidate_objs:
            try:
                if request:
                    ml_push_candidate.delay(
                        "bert-base-uncased",
                        job_posting_id,
                        candidate_objs,
                        user_email,
                        user_name,
                    )
                if not request and job_id:
                    ml_push_candidate.delay(
                        "bert-base-uncased",
                        job_posting_id,
                        candidate_objs,
                        user_email,
                        user_name,
                        user.id,
                        candidates,
                        apollo_id
                    )
                jobPostingname = JobPosting.objects.get(id=job_posting_id)
                response = {
                    "Message": f"Your candidates successfully pushed to ML for {jobPostingname.title}, you will get confirmation email shortly"
                }
                return Response(response, status=status.HTTP_200_OK)
            except Exception as e:
                print(str(e))
                resp = {"message": f"{e}"}
                return Response(resp, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        resp = {"message candidate_push_ml": f"{e}"}
        if(user and apollo_id):
            apollo_obj = ApolloJobs.objects.get(id=apollo_id)
            apollo_obj.status = 'failed'
            apollo_obj.save()
        return Response(resp, status=status.HTTP_400_BAD_REQUEST)


def email_pushed_candidates_to_ml(greater_50, less_50, user_email, user_name):
    full_candidates = {}
    full_candidates['all_candidates_list'] = []
    title = None

    if greater_50:
        for cad in greater_50:
            candidate_id, job_posting_id = (
                cad["candidate_id_id"],
                cad["job_posting_id_id"],
            )
            job_posting_cad = JobPostingCandidate.objects.filter(
                candidate_id_id=candidate_id, job_posting_id_id=job_posting_id
            )[0]

            job_obj = JobPosting.objects.filter(id=job_posting_id)[0]
            title = job_obj.title

            candidate_obj = Candidate.objects.filter(id=candidate_id)[0]

            _link = f'{NEXT_APP_DOMAIN_LINK}/admin/candidates?id={candidate_id}'
            
            full_candidates['all_candidates_list'].append({"id":candidate_id ,"name":candidate_obj.first_name,"number":candidate_obj.phone,"image":candidate_obj.picture,
                                                              "email":candidate_obj.email ,"location":candidate_obj.address,
                                                              "accuracy":job_posting_cad.accuracy,"link":_link})
    for cad in less_50:
        if cad.get("accuracy")==0:
            candidate_id , job_posting_id = cad['candidate_id_id'] , cad['job_posting_id_id']
            #job_posting_cad = JobPostingCandidate.objects.filter(candidate_id_id=candidate_id,job_posting_id_id=job_posting_id)[0]

            job_obj = JobPosting.objects.filter(id=job_posting_id)[0]
            title   = job_obj.title
            candidate_obj = Candidate.objects.filter(id=candidate_id)[0]

            _link = f'{NEXT_APP_DOMAIN_LINK}/admin/candidates?id={candidate_id}'

            accuracy = cad.get("accuracy") 
            full_candidates['all_candidates_list'].append({"id":candidate_id ,"name":candidate_obj.first_name,"number":candidate_obj.phone,"image":candidate_obj.picture,
                                                            "email":candidate_obj.email ,"location":candidate_obj.address,
                                                            "accuracy":accuracy,"link":_link})    
        else:
            candidate_id , job_posting_id = cad['candidate_id_id'] , cad['job_posting_id_id']
            job_posting_cad = JobPostingCandidate.objects.filter(candidate_id_id=candidate_id,job_posting_id_id=job_posting_id)[0]

            job_obj = JobPosting.objects.filter(id=job_posting_id)[0]
            title   = job_obj.title
            candidate_obj = Candidate.objects.filter(id=candidate_id)[0]

            _link = f'{NEXT_APP_DOMAIN_LINK}/admin/candidates?id={candidate_id}'

            accuracy = job_posting_cad.accuracy
            
            full_candidates['all_candidates_list'].append({"id":candidate_id ,"name":candidate_obj.first_name,"number":candidate_obj.phone,"image":candidate_obj.picture,
                                                            "email":candidate_obj.email ,"location":candidate_obj.address,
                                                            "accuracy":accuracy,"link":_link})

    today = date.today()

    full_candidates["date"] = today
    full_candidates["user_name"] = user_name

    email_body = render_to_string("ml-push.html", full_candidates)
    subject_data = {"date": today, "title": title}
    subject = render_to_string("admin_mail.txt", subject_data)

    to_email = user_email
    message = {
            "senderAddress": DEFAULT_EMAIL,  
            "recipients": {
                "to": [{"address": to_email}]
            },
            "content": {
                "subject": subject,
                "html": email_body
            }
    }
    EMAIL_CLIENT.begin_send(message)


def candidate_openai_push(request):
    data = request.data
    user_email = request.user.email
    user_name = request.user.first_name
    job_posting_id = data.get("job_posting_id", None)
    openai_candidate = []

    if not job_posting_id:
        error_message = {"message": f"Job id not found {job_posting_id}"}
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

    job_posting_instance = JobPosting.objects.filter(id=job_posting_id).first()

    if not job_posting_instance:
        error_message = {"message": f"Invalid Job id {job_posting_id}"}
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

    is_valid, screening_records = validate_screening_records_left(job_posting_instance.location_id.company_id)
    if not is_valid:
        return Response({
            'error': f"Sorry, you've exhausted your screening credits. Please purchase additional credits to continue accessing screenings. "},
            status=status.HTTP_400_BAD_REQUEST)

    subscription = Subscription.objects.filter(job_posting_id_id=job_posting_id)
    if subscription.exists():
        if subscription[0].type == "full_service":
            job_posting_candidate = JobPostingCandidate.objects.filter(
                job_posting_id_id=job_posting_id
            )

            job_posting_reveal = JobPostingReveals.objects.filter(
                job_posting_id_id=job_posting_id
            )

            if not job_posting_candidate.exists() and not job_posting_reveal.exists():
                error_message = {"message": f"No Candidate found  {job_posting_id}"}
                return Response(error_message, status=status.HTTP_404_NOT_FOUND)

            for candidate in job_posting_candidate:
                if candidate.published:
                    openai_candidate.append([candidate.candidate_id_id])

            if job_posting_reveal.exists():
                for candidate in job_posting_reveal:
                    openai_candidate.append([candidate.candidate_id_id])

    job_posting_reveal = JobPostingReveals.objects.filter(
        job_posting_id_id=job_posting_id
    )

    if job_posting_reveal.exists():
        for candidate in job_posting_reveal:
            openai_candidate.append([candidate.candidate_id_id])

    if openai_candidate:
        if screening_records < len(openai_candidate):
            return Response({
                'error': f"Sorry, you've exhausted your screening credits. Please purchase additional credits to continue accessing screenings. "},
                status=status.HTTP_400_BAD_REQUEST)
        # columns = ["job_description", "resume", "target","candidate_id"]
        openai_push.delay(
            openai_candidate, job_posting_id, DEFAULT_EMAIL, user_email, user_name
        )

        jobPostingname = JobPosting.objects.get(id=job_posting_id)
        response = {
            "Message": f"Your candidates successfully pushed to OpenAI for {jobPostingname.title} , you will get confirmation email shortly"
        }
        return Response(response, status=status.HTTP_200_OK)

    else:
        error = {
            "error": f"No Published or Reveal Candidate found for this Job id {job_posting_id}"
        }
        return Response(error, status=status.HTTP_404_NOT_FOUND)


def list_files_in_directory(job_documents, directory_path):
    try:
        data = []
        # List all files in the specified directory
        files = os.listdir(directory_path)

        # Print the list of files
        for file in files:
            full_path = os.path.join(directory_path, file)
            print(full_path)
            resume_loader = UnstructuredFileLoader(full_path)
            resume_documents = resume_loader.load()

            result = run_open_ai(job_documents, resume_documents)

            data.append(result)

        return data
    except OSError as e:
        print(f"Error: {e}")


def run_open_ai(job_documents, resume_documents):
    try:
        os.environ["OPENAI_API_KEY"] = OPENAI_KEY

        query1 = f"""
        Use the following job posting description and Resume of candidate to answer the below question:
        Job posting: 
        ```
        {job_documents[0].page_content}
        ```
        Resume of candidate: 
        ```
        {resume_documents[0].page_content}
        ```
        Question: Calculate the cosine similarity of resume for this job posting and Provide the following details:
                  1.candidate_name (enclose double quotes)
                  2.candidate_id (enclose in double quotes)
                  3.probability (enclose in double quotes)
                  4.matched_skills (list of skills which are matching with the job posting)        
        Please respond with json format and keep keys in small caps and exactly like I mentioned above
        Please provide a json object as a result and enclose the property names in double quotes. Do not send a json string and return the property names in double quotes.
        """

        llm = ChatOpenAI(
            openai_api_key=os.environ["OPENAI_API_KEY"],
            model_name=OPENAI_MODEL,
        )
        result = llm.predict(query1)
        return result
    except Exception as e:
        resp = {"message": f"{e}"}
        return resp


def formating_openai_result(result, job_posting_id):
    data_res = []
    job = JobPosting.objects.get(id=job_posting_id)
    for res in result:
        json_data = json.loads(res)
        print("---------------------------", json_data)
        candidate_name = json_data.get("candidate_name")
        candidate_id = json_data.get("candidate_id")
        Probability = None
        matched_skills = None

        if json_data.get("probability"):
            Probability = json_data.get("probability")
            if isinstance(Probability, str):
                try:
                    Probability = round(int(Probability) * 100, 4)
                except ValueError:
                    Probability = round(float(Probability) * 100, 4)

            else:
                Probability = round(Probability * 100, 4)

        if json_data.get("matched_skills"):
            matched_skills = json_data.get("matched_skills")

        data_res.append(
            {
                "candidate_name": candidate_name,
                "candidate_id": candidate_id,
                "Probability": Probability,
                "matched_skills": matched_skills,
            }
        )
        deduct_screening_record(job.location_id.company_id)
    return data_res


def opean_ai_csv(result, job_posting_id):
    csv_data = []
    for data in result:
        _skill_name = None
        candidate_csv_data = {}
        candidate_obj = Candidate.objects.filter(id=data.get("candidate_id"))[0]
        candidate_attributres = CandidateAttributes.objects.filter(
            candidate_id_id=candidate_obj.id
        )[0]

        candidate_csv_data["first_name"] = candidate_obj.first_name
        candidate_csv_data["last_name"] = candidate_obj.last_name
        candidate_csv_data["email"] = candidate_obj.email
        candidate_csv_data["phone"] = candidate_obj.phone

        candidate_csv_data["profile"] = (
            candidate_obj.profile if candidate_obj.profile else None
        )
        candidate_csv_data["picture"] = (
            candidate_obj.picture if candidate_obj.picture else None
        )

        candidate_csv_data["address"] = candidate_attributres.address
        candidate_csv_data["state"] = candidate_attributres.state
        candidate_csv_data["Probability"] = data.get("Probability")

        # candidate_skill
        candiate_skill = CandidateSkill.objects.filter(
            candidate_id_id=data.get("candidate_id")
        )

        if candiate_skill.exists():
            _skill = []
            for sk in candiate_skill:
                skill = Skill.objects.filter(id=sk.skill_id_id).first()
                _skill.append(skill.name)
            if _skill:
                _skill_name = ",".join(_skill)

        candidate_csv_data["Candidate_skill"] = _skill_name
        # Macthed skill
        candidate_csv_data["matched_skills"] = (
            ",".join(data.get("matched_skills")) if data.get("matched_skills") else None
        )

        csv_data.append(candidate_csv_data)

    print(csv_data)

    columns = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "profile",
        "picture",
        "address",
        "state",
        "Probability",
        "Candidate_skill",
        "matched_skills",
    ]

    with tempfile.NamedTemporaryFile(
        mode="w",
        prefix=f"opean_ai{job_posting_id}",
        suffix=".csv",
        delete=False,
        newline="",
    ) as temp_file:
        dict_writer = csv.DictWriter(temp_file, columns)
        dict_writer.writeheader()
        dict_writer.writerows(csv_data)

    print(temp_file.name)
    return temp_file.name, csv_data


def send_email_with_attachment(
    from_email, recipient_list, attachment_path, user_name, csv_data
):
    # Unsubscribe link
    email_encode = urlencode({"email": recipient_list[0]})

    subject = "StartDate's OpenAI Optimizing Results"

    message_data = {
        "user": user_name,
        "SUPPORT_EMAIL": SUPPORT_EMAIL,
        "candidates": csv_data,
    }
    message = render_to_string("openai.html", message_data)
    with open(attachment_path, "rb") as file:
        file_content = base64.b64encode(file.read())

    # Use the correct MIME type for a CSV file
    mime_type = "text/csv"
    # Extract the filename from the attachment_path
    file_name = os.path.basename(attachment_path)
    message = {
            "senderAddress": DEFAULT_EMAIL,  
            "recipients": {
                "to": [{"address": recipient_list}]
            },
            "content": {
                "subject": subject
            },
            "attachments": [
            {
                "name": file_name,
                "contentType": mime_type,
                "contentInBase64": file_content.decode()
            }
        ]
    }
    EMAIL_CLIENT.begin_send(message)


def preprocess_text(text):
    # Remove punctuation and special characters except spaces
    text = re.sub(r"[^\w\s]", "", text)
    return text


def calculate_matching_keywords_and_percentage(job_description, resume):
    # Load the English language model
    nlp = spacy.load("en_core_web_sm")

    job_description = preprocess_text(job_description)
    resume = preprocess_text(resume)

    doc_job = nlp(job_description)
    doc_resume = nlp(resume)

    # Extract lemmatized keywords (ignoring stop words) from both documents, considering up to 5 words for each keyword
    def extract_keywords(doc, max_word_count):
        keywords = []
        current_keyword = []
        for token in doc:
            if not token.is_stop:
                current_keyword.append(token.lemma_)
                if len(current_keyword) > max_word_count:
                    current_keyword.pop(0)
                keywords.append(" ".join(current_keyword))
            else:
                current_keyword = []
        return keywords

    max_word_count = 2
    keywords_job = extract_keywords(doc_job, max_word_count)
    keywords_resume = extract_keywords(doc_resume, max_word_count)

    matching_keywords = set(keywords_job).intersection(keywords_resume)

    keyword_counts_job = Counter(keywords_job)
    keyword_counts_resume = Counter(keywords_resume)

    matching_keywords_percentages = {}

    for keyword in matching_keywords:
        percentage_job = (keyword_counts_job[keyword] / len(keywords_job)) * 100
        percentage_resume = (
            keyword_counts_resume[keyword] / len(keywords_resume)
        ) * 100
        matching_keywords_percentages[keyword] = (percentage_job, percentage_resume)

    return matching_keywords, matching_keywords_percentages


def smiliar_keywords(job_description, resume):
    output = []
    _job_description = clean_text_mod(job_description)
    _resume = clean_text_mod(resume)

    resume_clean_skill = job_clean_skills(resume)
    print(f"Second time to calculate skills : {resume_clean_skill} ")
    job_desc_skill = job_clean_skills(job_description)

    if resume_clean_skill:
        if "|" in resume_clean_skill:
            _desc_skill = resume_clean_skill.split("|")
            print(f"After split time to calculate skills : {_desc_skill} ")
        else:
            _desc_skill = resume_clean_skill.split(",")
    else:
        _desc_skill = job_desc_skill.split(",")

    if job_desc_skill and isinstance(_desc_skill, list) and len(_desc_skill) > 0:
        for skill in _desc_skill:
            if len(skill) != 0:
                Str_Partial_Match = fuzz.partial_ratio(skill, _resume)
                output.append((skill, Str_Partial_Match / 100))
                print("reverse look for skills ", skill, Str_Partial_Match)

    elif resume_clean_skill and isinstance(_desc_skill, list) and len(_desc_skill) > 0:
        for skill in _desc_skill:
            if len(skill) != 0:
                Str_Partial_Match = fuzz.partial_ratio(skill, _job_description)
                output.append((skill, Str_Partial_Match / 100))
                print("reverse look for skills ", skill, Str_Partial_Match)

    else:
        print(f"output --- 1st----------------------------------------- {output}")
        output = final_output_skill(resume, _job_description)

    print(f"output -------------------------------------------- {output}")
    if output and len(output) > 6:
        i = len(output) - 1
        while i >= 0:
            len_matching_word = len(output[i][0].split(" "))
            if len_matching_word > 3 or len_matching_word == 1:
                output.pop(i)
            i -= 1

    # return sorted array list
    output_sort = set(sorted(output, key=lambda x: x[1]))

    return output_sort


def job_clean_skills(skill_section):
    # Find string starting with "Skills:" and ending with a newline

    match = re.search(r"Skills:.*\n", skill_section)
    if match:
        # Get the matched string and remove leading/trailing whitespaces
        skill_section = match.group(0).strip()
    else:
        # Return an empty string if no match is found
        skill_section = ""

    # cleaning skills
    skill_section = re.sub(r"Skills:", "", skill_section)
    return skill_section.strip()


def ml_output_alert(request, id):
    try:
        job_posting_id = id
        # check the source of job_posting
        job_posting_obj = JobPosting.objects.filter(id=job_posting_id).first()

        if not job_posting_obj.created_by_id:
            message = {"Error": f"This {job_posting_obj.name} job comes under Adwerks"}
            return Response(message, status=status.HTTP_400_BAD_REQUEST)

        ml_output_dataset = JobPostingCandidate.objects.filter(
            job_posting_id_id=job_posting_id
        )

        if not ml_output_dataset.exists():
            message = {
                "Error": f"This {job_posting_obj.name} job have no candidate right now"
            }
            return Response(message, status=status.HTTP_400_BAD_REQUEST)

        user_obj = User.objects.filter(id=job_posting_obj.created_by_id).first()

        location_obj = Location.objects.filter(id=job_posting_obj.location_id_id)[0]

        company_id = location_obj.company_id_id

        subscription = Subscription.objects.filter(
            company_id_id=company_id, type__in=["ai_silver", "ai_gold"]
        ).exists()

        total_candidate_count = ml_output_dataset.count()
        full_candidates = {}
        full_candidates["greater_candidate_list"] = []
        full_candidates["User_name"] = user_obj.first_name
        full_candidates["Job_title"] = job_posting_obj.title
        full_candidates["total_count"] = total_candidate_count

        for candidate in ml_output_dataset.order_by("-accuracy"):
            _data = {}
            candidate_obj = Candidate.objects.filter(
                id=candidate.candidate_id_id
            ).first()

            if subscription:
                _link = f"{NEXT_APP_DOMAIN_LINK}/signin"
                _data["name"] = "dummy name"
                _data["number"] = "+919412345654"
                _data["image"] = candidate_obj.picture
                _data["email"] = "dummy@gmail.com"
                _data["location"] = candidate_obj.address
                _data["accuracy"] = candidate.accuracy
                _data["link"] = _link

                full_candidates["greater_candidate_list"].append(_data)

            else:
                _link = f"{NEXT_APP_DOMAIN_LINK}/admin/candidates?id={candidate_obj.id}"
                _data["name"] = candidate_obj.first_name
                _data["number"] = candidate_obj.phone
                _data["image"] = candidate_obj.picture
                _data["email"] = candidate_obj.email
                _data["location"] = (candidate_obj.address,)
                _data["accuracy"] = candidate.accuracy
                _data["link"] = _link

                full_candidates["greater_candidate_list"].append(_data)

        if len(full_candidates["greater_candidate_list"]) > 5:
            full_candidates["greater_candidate_list"] = full_candidates[
                "greater_candidate_list"
            ][:5]

        email_body = (
            render_to_string("ml_output_alert_ai_sub.html", full_candidates)
            if subscription
            else render_to_string("ml_output_alert.html", full_candidates)
        )

        # subject_data = {"Job_title":job_posting_obj.title, "count": total_candidate_count}
        subject = f"Great news on your {job_posting_obj.title} job - {total_candidate_count} Candidates Found!!!"
        # subject = render_to_string("ml_output_subject_alert.txt", subject_data)

        to_email = user_obj.email
        from_email = DEFAULT_EMAIL

        message = {
                "senderAddress": from_email,  
                "recipients": {
                    "to": [{"address": to_email}]
                },
                "content": {
                    "subject": subject,
                    "html": email_body
                }
        }
        EMAIL_CLIENT.begin_send(message)

        message = {
            "Message": f"Alert send to user {user_obj.first_name} candidate count {total_candidate_count}"
        }
        return Response(message, status=status.HTTP_200_OK)
    except Exception as e:
        message = {"Error": f"Sorry alert not working due to :{e}"}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)


def clean_work_history(work_section):
    # Find all descriptions that start with "Title:" and end with "From Date:"
    descriptions = re.findall(r"Title:(.*?)From Date:", work_section, re.DOTALL)

    # Remove company name, title, and date, and add ". . . . " between descriptions
    cleaned_descriptions = []
    for desc in descriptions:
        # Remove "Company:", "Title:", and "Description:" labels
        desc = re.sub(r"Company:|Title:|Description:", "", desc, re.DOTALL).strip()

        desc = re.sub(r"\S+@\S+", "", desc)

        desc = re.sub(r", and", ",", desc)
        desc = re.sub(r"and", ",", desc)
        desc = re.sub(r"&", ",", desc)

        desc = re.sub(r"(\.|\;|\,)", r",", desc)
        desc = re.sub(r"•|●|\*", ",", desc)
        desc = re.sub(r",", ".\n", desc)
        desc = re.sub(r"\t", ".\n", desc)

        cleaned_descriptions.append(desc)

    # print(cleaned_descriptions)
    # Join the cleaned descriptions with ". . . . "
    work_history = "".join(cleaned_descriptions)
    return work_history


def clean_summary(summary_section):
    # Find string starting with "Skills:" and ending with a newline

    match = re.search(r"Summary:.*\n", summary_section)
    if match:
        # Get the matched string and remove leading/trailing whitespaces
        summary_section = match.group(0).strip()
        print(summary_section)
    else:
        # Return an empty string if no match is found
        summary_section = ""

    # cleaning skills
    summary_section = re.sub(r"Summary:", "", summary_section)
    summary_section = re.sub(r"Contact:", "", summary_section)
    summary_section = re.sub(r"\S+@\S+", "", summary_section)

    summary_section = re.sub(r", and", ",", summary_section)
    summary_section = re.sub(r"&", ",", summary_section)
    summary_section = re.sub(r"(\.|\;|\,)", r",", summary_section)
    summary_section = re.sub(r",", ".\n", summary_section)
    summary_section = re.sub(r"\t", ".\n", summary_section)

    return summary_section


def final_output_skill(resume, job_desc):
    print("final_output_skill ")
    output = []
    _work_history = clean_work_history(resume)
    _summary = clean_summary(resume)

    if _work_history and _work_history != " ":
        work_list = _work_history.split("\n")

        for skill in work_list:
            skill_name = skill.replace(".", " ")
            skill_name = skill_name.strip()

            Str_Partial_Match = fuzz.partial_ratio(skill_name, job_desc)
            if Str_Partial_Match > 0:
                output.append((skill_name, Str_Partial_Match))

    elif _summary and _summary != " ":
        summary_list = _summary.split("\n")

        for skill in summary_list:
            skill_name = skill.replace(".", " ")
            skill_name = skill_name.strip()

            Str_Partial_Match = fuzz.partial_ratio(skill_name, job_desc)
            if Str_Partial_Match > 0:
                output.append((skill_name, Str_Partial_Match))

    return output


def encode_target_label(candidate):
    labels = candidate.get('labels')
    binary_comb = ''
    if labels and labels.keys():
        for label in [label['type'] for label in MLTrainingData.TARGET_LABELS]:
            binary_comb += f"{int(labels.get(label) == True)}"
        return int(binary_comb, 2)


def decode_target_label(label):
    label = label if label else 0
    binary_comb = f"{int(label):b}".rjust(5, '0')
    target_label = {}
    for index, label in enumerate([label['type'] for label in MLTrainingData.TARGET_LABELS]):
        target_label[label] = bool(int(binary_comb[index]))
    return target_label


def calculate_skill_prob(job_description, candidate_resume):
    weights = [10, 5]
    total_score, max_score = 0, 0
    
    job_skills = re.findall(r'Skills:(.*)', job_description)
    job_skills = job_skills[0].split(",") if job_skills else None 
    resume_skills = re.findall(r'Skills:(.*)', candidate_resume)
    resume_skills = resume_skills[0].split(",") if resume_skills else None
    # print("Job Skills: ", job_skills, "Resume Skills: ", resume_skills)
    if not job_skills or not resume_skills:
        return 0
    
    for index in range(len(job_skills)):
        if not utils.full_process(job_skills[index]):
            continue
        
        skill, score = process.extractOne(job_skills[index], resume_skills, scorer=fuzz.token_set_ratio)
        if score < 50:
            continue
            
        if index < 2:  # Primary skills
            total_score += score * weights[0]
            max_score += 100 * weights[0]
        else:  # Secondary skills
            total_score += score * weights[1]
            max_score += 100 * weights[1]
        
        print("Total Score: ", total_score, "Max Score: ", max_score)

    # print("Primary Total Score: ", primary_total_score, "Primary Max Score: ", primary_max_score, "Secondary Total Score: ", secondary_total_score, "Secondary Max Score: ", secondary_max_score)
    if not max_score:
        return 0
    
    percentage_match = round((total_score / max_score) * 100, 2)
    return percentage_match


def ml_output_candidates_filter(search_query, id, type):
    dynamic_queryset = Q()

    if search_query:
        values_from_query = [search_query]
        if "," in search_query:
            values_from_query = values_from_query + search_query.split(", ")

        for value in values_from_query:
            dynamic_queryset |= Q(
                Q(candidate_id__first_name__icontains=value)
                | Q(candidate_id__last_name__icontains=value)
                | Q(candidate_id__email__icontains=value)
            )

        work_history_queryset = Q()
        for value in values_from_query:
            work_history_queryset |= Q(candidate_id__candidateworkhistory__title__icontains=value)
        work_history_candidate_ids = CandidateWorkHistory.objects.filter(work_history_queryset).values_list('candidate_id', flat=True).distinct()

        dynamic_queryset |= Q(candidate_id__in=work_history_candidate_ids)

    if type == "ranked":
        results = MLTrainingData.objects.filter(dynamic_queryset, job_posting_id=id)
    else:
        results = JobPostingCandidate.objects.filter(dynamic_queryset, job_posting_id=id).order_by('-accuracy')

    return results


def evaluate_work_history(index, work_history):
    company = Company.objects.get(id=work_history.company_id_id)
    candidate_work_history = ""

    if index == 0:
        candidate_work_history += "[currently working as]\n"
    elif index == 1:
        candidate_work_history += "[recent skip title]\n"
    else:
        candidate_work_history += "[other titles]\n"

    candidate_work_history += f'Title: {work_history.title} \nCompany: {company.name} \nDescription: {clean_html(work_history.description)} \nFrom Date: {work_history.from_date} \nTo Date: {work_history.to_date}\n'

    return candidate_work_history


def get_training_candidates(job_posting_ids):
    candidates_work_history = []
    candidates_job_description = []
    candidate_ids = []
    candidate_names = []
    candidate_labels = {
        'recent_title': [],
        'recent_skip_title': [],
        'exists_anywhere': [],
        'summary': []
    }
    
    for job_posting_id in job_posting_ids:
        trained_candidates = MLTrainingData.objects.filter(job_posting_id_id=job_posting_id)
        
        if not trained_candidates.exists():
            continue

        for entry in trained_candidates:
            candidate = Candidate.objects.get(id=entry.candidate_id_id)
            candidate_id = str(candidate.id)
            candidate_skill_names = []
            candidate_names.append(" ".join([candidate.first_name or "", candidate.middle_name or "", candidate.last_name or ""]))
            candidate_ids.append(candidate_id)
            
            skills_id = CandidateSkill.objects.filter(candidate_id_id=candidate_id)
            work_history_data = CandidateWorkHistory.objects.filter(candidate_id_id=candidate_id).order_by("-from_date")
            labels = decode_target_label(entry.target_label)

            for skill_id in skills_id:
                skill = Skill.objects.get(id=skill_id.skill_id_id)
                candidate_skill_names.append(skill.name)
                
            for candidate_label in candidate_labels:
                candidate_labels[candidate_label].append('1' if labels[candidate_label] else '0')
            
            candidate_work_history = ""
            candidate_skill = clean_html(f'{", ".join(candidate_skill_names)}\n')
            nullish_work_history = []
            work_history_index = 0
         
            for index in range(len(work_history_data)):
                work_history = work_history_data[index]
                
                if work_history.from_date is None and work_history.to_date is None:
                    nullish_work_history.append(work_history)
                    continue
                
                candidate_work_history += evaluate_work_history(work_history_index, work_history)
                work_history_index += 1
            
            for index in range(len(nullish_work_history)):
                work_history = nullish_work_history[index]
                candidate_work_history += evaluate_work_history(work_history_index, work_history)
                work_history_index += 1
                            
            candidates_work_history.append(candidate_work_history + f'Summary: {candidate.summary}\nSkills: {candidate_skill}')
        
        job_posting = JobPosting.objects.get(id=job_posting_id)
        job_posting_skills = []
        skill_names = []
        jp_skills_id = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)

        for jp_skill_id in jp_skills_id:
            skill = Skill.objects.get(id=jp_skill_id.skill_id_id)
            skill_names.append(skill.name)
            job_posting_skills.append({
                "skill": skill.name,
                "job_posting_skill_id": str(jp_skill_id.id)
            })

        job_details = f'Job Title: {job_posting.title} \nJob Description: {clean_html(job_posting.description)} \nCompensation: {job_posting.compensation} \nWork Location Type: {job_posting.work_location_type} \nSkills: {", ".join(skill_names)}\n'

        for _ in range(len(trained_candidates)):
            candidates_job_description.append(job_details)
            
    headers = ['job_description', 'resume', 'recent_title', 'recent_skip_title', 'other_titles', 'summary', 'candidate_id', 'candidate_name']
    data = {
        'job_description': candidates_job_description,
        'resume': candidates_work_history,
        'recent_title': candidate_labels['recent_title'],
        'recent_skip_title': candidate_labels['recent_skip_title'],
        'other_titles': candidate_labels['exists_anywhere'],
        'summary': candidate_labels['summary'],
        'candidate_id': candidate_ids,
        'candidate_name': candidate_names
    }
        
    return pd.DataFrame(data, columns=headers)


def handle_list(value):
    if isinstance(value, list):
        return value[0] if value else None
    return value    

def calculate_prob(prob, preset_weights):
    """
    Calculates probability based on weightage
    """
    data = np.array(prob)
    # Default weights
    if not preset_weights:
        for el in MLTrainingData.TARGET_LABELS:
            preset_weights[el['type']] = el['weightage']
    
    data = data[0]
    result = 0
    total_weight = 0

    if data[0] > 0.5:
        result += data[0] * preset_weights['recent_title']
        total_weight += preset_weights['recent_title']
    elif data[1] > 0.5:
        result += data[1] * preset_weights['recent_skip_title']
        total_weight += preset_weights['recent_skip_title']
    elif data[2] > 0.5:
        result += data[2] * preset_weights['exists_anywhere']
        total_weight += preset_weights['exists_anywhere']

    # Always consider the summary weight
    result += data[3] * preset_weights['summary']
    total_weight += preset_weights['summary']

    # Normalize the result to ensure it is within the range of 0-100%
    if total_weight > 100:
        normalization_factor = 100 / total_weight
        result *= normalization_factor
        total_weight = 100
    
    # print("Result: ", result, " with weight: ", preset_weights)
    
    return result


def main_preprocess(cleaned_article_content):
  cleaned_article_content = clean_data_v2(cleaned_article_content)
  cleaned_article_content = clear_phrases_v2(cleaned_article_content)
  cleaned_article_content = preprocess_v2(cleaned_article_content)

  return cleaned_article_content


def preprocess_v2(text):
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    
    # Tokenize the text into sentences and words
    sentences = sent_tokenize(text)
    words = [word_tokenize(sentence.lower()) for sentence in sentences]
    
    # Remove stopwords and lemmatize words
    words = [
        [lemmatizer.lemmatize(word) for word in sentence if word not in stop_words]
        for sentence in words
    ]
    
    # Reconstruct the sentences and return the processed text
    sentences = [' '.join(sentence) for sentence in words]
    return ' '.join(sentences)


def clear_phrases_v2(text):
    pattern = r"candidate rank \d+"
    text = re.sub(pattern, '', text)

    pattern = r"\b\w+\snone\b"
    text = re.sub(pattern, '', text)

    phrases = ["candidate id", "job posting id", "candidate name","date" ,"Title" ,"br", "description", "description:", "job", "posting id", "company", "None", "title", "*:", "|", "#", "skills", ":", "*","•", "[", "]", "responsibilities"]

    for phrase in phrases:
        text = text.replace(phrase,'')

    return text.strip()


def clean_data_v2(data):
  # text = re.sub(r""," ",data)
  text = data.lower()
  text = re.sub(r'\s+'," ",text)
  text = re.sub(r","," ",text)
  uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  text = re.sub(uuid_pattern, '', text)
  return text