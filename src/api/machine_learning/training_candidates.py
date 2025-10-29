from datetime import date
from django.http import HttpResponse
from rest_framework.views import APIView
from .models import MLTrainingData
from candidate.models import CandidateWorkHistory, CandidateEducationHistory, CandidateSkill, Candidate
from job_posting.models import Skill, JobPosting, JobPostingSkill
from company.models import Company, Location
import os
import shutil
import pandas as pd
import tempfile
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import AdminPermission
from .services import evaluate_work_history, get_training_candidates, prescreen_onsite_query_result, clean_html


class DownloadTrainingCandidatesV2(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        temp_dir = tempfile.mkdtemp()
        job_posting_id = id
        job_posting = JobPosting.objects.get(id=job_posting_id)
        jp_path = f"{temp_dir}/{job_posting_id}"
        os.mkdir(jp_path)

        df = get_training_candidates([job_posting_id])
        
        csv_file_path = f'{jp_path}/{job_posting_id}.csv'
        df.to_csv(csv_file_path, index=False)
        response = HttpResponse(headers={'Access-Control-Expose-Headers': 'Content-Disposition', 'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="{job_posting.title}-{job_posting_id}.csv"'})

        with open(csv_file_path, 'rb') as csv_file:
            response.write(csv_file.read())

        os.unlink(csv_file_path)
        shutil.rmtree(temp_dir)
        
        return response


class DownloadPrescreenCandidatesV2(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        temp_dir = tempfile.mkdtemp()
        job_posting_id = id
        result_set = prescreen_onsite_query_result(id)
        jp_path = f"{temp_dir}/{job_posting_id}"
        os.mkdir(jp_path)
        candidates_work_history = []
        candidate_ids = []
        candidate_labels = {
            'recent_title': [],
            'recent_skip_title': [],
            'exists_anywhere': [],
            'summary': []
        }

        for entry in result_set:
            candidate = Candidate.objects.get(id=entry[0])
            candidate_id = str(candidate.id)

            candidate_ids.append(candidate_id)
            work_history_data = CandidateWorkHistory.objects.filter(candidate_id_id=candidate_id).order_by("-from_date")

            for candidate_label in candidate_labels:
                candidate_labels[candidate_label].append("0")

            candidate_work_history = ""
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
                
            candidates_work_history.append(candidate_work_history + f'Summary: {candidate.summary}\n')

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

        candidates_job_description = []
        job_details = f'Job Title: {job_posting.title} \nJob Description: {clean_html(job_posting.description)} \nCompensation: {job_posting.compensation} \nWork Location Type: {job_posting.work_location_type} \nSkills: {", ".join(skill_names)}\n'

        for _ in range(len(result_set)):
            candidates_job_description.append(job_details)

        headers = ['job_description', 'resume', 'recent_title', 'recent_skip_title', 'other_titles', 'summary',
                   'candidate_id']
        data = {
            'job_description': candidates_job_description,
            'resume': candidates_work_history,
            'recent_title': candidate_labels['recent_title'],
            'recent_skip_title': candidate_labels['recent_skip_title'],
            'other_titles': candidate_labels['exists_anywhere'],
            'summary': candidate_labels['summary'],
            'candidate_id': candidate_ids,
        }

        df = pd.DataFrame(data, columns=headers)
        csv_file_path = f'{jp_path}/{job_posting_id}.csv'
        df.to_csv(csv_file_path, index=False)
        response = HttpResponse(headers={'Access-Control-Expose-Headers': 'Content-Disposition', 'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="{job_posting.title}-{job_posting_id}.csv"'})
        
        with open(csv_file_path, 'rb') as csv_file:
            response.write(csv_file.read())

        os.unlink(csv_file_path)
        shutil.rmtree(temp_dir)
        
        return response

    
class DownloadMultipleTrainingCandidatesV2(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        temp_dir = tempfile.mkdtemp()
        job_posting_ids = request.data['job_posting_ids']
        
        if type(job_posting_ids) is not list:
            return HttpResponse(status=400, content='Invalid object! job_posting_ids must be an array of job posting ids.')
        
        jp_path = f'{temp_dir}/training-candidates-{date.today()}'
        os.mkdir(jp_path)
        print(job_posting_ids)
        df = get_training_candidates(job_posting_ids)
        
        csv_file_path = f'{jp_path}/training-candidates-${date.today()}.csv'
        df.to_csv(csv_file_path, index=False)
        response = HttpResponse(headers={'Access-Control-Expose-Headers': 'Content-Disposition', 'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="training-candidates-{date.today()}.csv"'})

        with open(csv_file_path, 'rb') as csv_file:
            response.write(csv_file.read())

        os.unlink(csv_file_path)
        shutil.rmtree(temp_dir)
        
        return response