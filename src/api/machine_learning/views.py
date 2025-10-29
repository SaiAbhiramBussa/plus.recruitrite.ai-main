from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import prescreen_onsite_query_result, complete_candidate_data, write_candidate_file, \
    write_job_posting_file, un_publish_candidate, publish_candidate, alerts_data_see_all_profiles, model_refresh, \
    candidate_push_ml, \
    candidate_openai_push, ml_output_alert, encode_target_label, decode_target_label, ml_output_candidates_filter
from .models import MLTrainingData, MLProcess
from candidate.models import CandidateAttributes, CandidateWorkHistory, CandidateEducationHistory, CandidateSkill, Candidate
from job_posting.models import Skill, JobPosting, JobPostingSkill, JobPostingCandidate, JobPostingCandidateSkill
from company.models import Company, Location
import os
import shutil
import tempfile
from job_posting.services import is_valid_employer
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import AdminPermission, EmployerPermission


class PrescreenedCandidatesDisplay(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        result_from_query = prescreen_onsite_query_result(id)
        paginator = Paginator(result_from_query, per_page)
        result_set = paginator.get_page(page_number)
        candidate_response = []
        for entry in result_set:
            candidate = Candidate.objects.get(id=entry[0])
            candidate_data = complete_candidate_data(candidate)
            candidate_response.append(candidate_data)
        response = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "candidates": candidate_response,
        }
        return Response(response, content_type="application/json")


class TrainingPrescreenData(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        if not request.data['job_posting_id'] or not request.data['candidates_id']:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        job_posting_id = request.data['job_posting_id']
        candidates_id = request.data['candidates_id']
        duplicates = 0
        moved = 0
        total_count = len(candidates_id)
        for candidate in candidates_id:
            ml_training_object, object_flag = MLTrainingData.objects.get_or_create(candidate_id_id=candidate, job_posting_id_id=job_posting_id)
            if not object_flag:
                duplicates = duplicates + 1
            if object_flag:
                moved = moved + 1
        context = {
            "total_counts_requested": total_count,
            "moved_to_training": moved,
            "duplicates": duplicates,
        }
        return Response(context, status=status.HTTP_200_OK)

    def get(self, request, id):
        filter = request.query_params.get('filter')
        search = request.query_params.get('search')
        training_dataset = ml_output_candidates_filter(search, id, "ranked")
        if filter == 'unranked':
            training_dataset = training_dataset.filter(target_label__isnull=True).order_by('created_at')
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(training_dataset, per_page)
        training_data = paginator.get_page(page_number)
        candidate_response = []
        for candidate in training_data:
            candidate_data = complete_candidate_data(candidate.candidate_id)
            candidate_data.update({
                "labels": decode_target_label(candidate.target_label)
            })
            candidate_response.append(candidate_data)
        response = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "candidates": candidate_response,
        }
        return Response(response, content_type="application/json")

    def patch(self, request, id):
        ranked_candidates = request.data['candidates']
        for candidate in ranked_candidates:
            train_data = MLTrainingData.objects.get(candidate_id_id=candidate['candidate_id'], job_posting_id_id=id)
            train_data.target_label = encode_target_label(candidate)
            train_data.save()
        return Response(status=status.HTTP_200_OK)

    def delete(self, request):
        job_posting_id = request.data['job_posting_id']
        candidates_id = request.data['candidates_id']
        try:
            found = MLTrainingData.objects.filter(
                candidate_id_id__in=candidates_id, job_posting_id=job_posting_id)
            if len(found) != 0:
                deleted = len(found)
                found.delete()
                context = {
                    "message": "ML Output Data Deleted Successfully",
                    "total_count": len(candidates_id),
                    "deleted": deleted
                }
                return Response(context, status=status.HTTP_200_OK)
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(e, status=status.HTTP_400_BAD_REQUEST)


class DownloadTrainingCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        temp_dir = tempfile.mkdtemp()
        job_posting_id = id
        trained_candidates = MLTrainingData.objects.filter(job_posting_id_id=job_posting_id)
        jp_path = f"{temp_dir}/{job_posting_id}"
        os.mkdir(jp_path)
        candidate_path = f"{temp_dir}/{job_posting_id}/candidates"
        os.mkdir(candidate_path)
        candidate_response = []
        for entry in trained_candidates:
            candidate_skills = []
            candidate_skill_names = []
            candidate = Candidate.objects.get(id=entry.candidate_id_id)
            candidate_id = str(candidate.id)
            skills_id = CandidateSkill.objects.filter(candidate_id_id=candidate_id)
            for skill_id in skills_id:
                skill = Skill.objects.get(id=skill_id.skill_id_id)
                candidate_skill_names.append(skill.name)
                candidate_skills.append({
                    "skill": skill.name,
                    "candidate_skill_id": str(skill_id.id)
                })
            work_history_list = []
            work_history_data = CandidateWorkHistory.objects.filter(candidate_id_id=candidate_id).order_by("-from_date")
            for work_history in work_history_data:
                company = Company.objects.get(id=work_history.company_id_id)
                work_history_list.append({
                    "id": str(work_history.id),
                    "title": work_history.title,
                    "company": company.name,
                    "description": work_history.description,
                    "from_date": work_history.from_date,
                    "to_date": work_history.to_date,
                })
            education_history_list = []
            education_history_data = CandidateEducationHistory.objects.filter(candidate_id_id=candidate_id)
            for education_history in education_history_data:
                education_history_list.append({
                    "id": str(education_history.id),
                    "name": education_history.name,
                    "degree": education_history.degree,
                    "from_date": education_history.from_date,
                    "to_date": education_history.to_date
                })
            rank = entry.target_label
            if not rank:
                rank = ""
            with open(f'{candidate_path}/{rank}_{candidate_id}.txt', 'w') as f:
                f.write(f'Candidate Id: {candidate_id}\n')
                f.write(f'Job Posting Id: {job_posting_id}\n')
                if entry.target_label:
                    f.write(f'Candidate Rank: {entry.target_label}\n')
                f.write(f'Candidate Name: {candidate.first_name}\n')
                f.write(f'Summary: {candidate.summary}\n')
                f.write(f'Tags: {candidate.tags}\n')
                # f.write(f'Address: {address["city"] + ", " + address["state"]}\n')
                f.write(f'Skills: {", ".join(candidate_skill_names)}\n')
                f.write(f'# Work History:\n')
                for wh in work_history_list:
                    f.write(f'* Title: {wh["title"]}\n')
                    f.write(f'  Company: {wh["company"]}\n')
                    f.write(f'  Description: {wh["description"]}\n')
                    f.write(f'  From Date: {wh["from_date"]}\n')
                    f.write(f'  To Date: {wh["to_date"]}\n')
                f.write(f'# Education History:\n')
                for eh in education_history_list:
                    f.write(f'* School Name: {eh["name"]}\n')
                    f.write(f'  Degree: {eh["degree"]}\n')
                    f.write(f'  From Date: {eh["from_date"]}\n')
                    f.write(f'  To Date: {eh["to_date"]}\n')

        job_posting = JobPosting.objects.get(id=job_posting_id)
        location = Location.objects.get(id=job_posting.location_id_id)
        location = {
            "address": location.address,
            "city": location.city,
            "state": location.state,
        }
        job_posting_skills = []
        skills = []
        skill_names = []
        jp_skills_id = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)
        for jp_skill_id in jp_skills_id:
            skill = Skill.objects.get(id=jp_skill_id.skill_id_id)
            skill_names.append(skill.name)
            job_posting_skills.append({
                "skill": skill.name,
                "job_posting_skill_id": str(jp_skill_id.id)
            })

        with open(f'{jp_path}/{job_posting_id}.txt', 'w') as f:
            f.write(f'Job Posting Id: {job_posting_id}\n')
            f.write(f'Job Title: {job_posting.title}\n')
            f.write(f'Job Description: {job_posting.description}\n')
            f.write(f'Compensation: {job_posting.compensation}\n')
            f.write(f'Work Location Type: {job_posting.work_location_type}\n')
            # f.write(f'Location: {location["city"] + ", " + location["state"]}\n')
            f.write(f'Skills: {", ".join(skill_names)}\n')

        shutil.make_archive(jp_path, 'zip', jp_path)
        zip_file_path = f'{temp_dir}/{job_posting_id}.zip'
        response = HttpResponse(content_type='application/zip')
        print("here")
        print(zip_file_path)
        response['Content-Disposition'] = f'attachment; filename="{job_posting_id}.zip"'
        with open(zip_file_path, 'rb') as zip_file:
            response.write(zip_file.read())
        # shutil.rmtree(jp_path)
        # os.unlink(f'{temp_dir}/{job_posting_id}.zip')
        print(" deletion done ")
        return response


class DownloadPrescreenCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, id):
        temp_dir = tempfile.mkdtemp()
        job_posting_id = id
        result_set = prescreen_onsite_query_result(id)
        jp_path = f"{temp_dir}/{job_posting_id}"
        os.mkdir(jp_path)
        candidate_path = f"{temp_dir}/{job_posting_id}/candidates"
        os.mkdir(candidate_path)
        for entry in result_set:
            write_candidate_file(entry, candidate_path, job_posting_id)
        write_job_posting_file(jp_path, job_posting_id)
        shutil.make_archive(jp_path, 'zip', jp_path)
        zip_file_path = f'{temp_dir}/{job_posting_id}.zip'
        response = HttpResponse(content_type='application/zip')
        print("here")
        print(zip_file_path)
        response['Content-Disposition'] = f'attachment; filename="{job_posting_id}.zip"'
        with open(zip_file_path, 'rb') as zip_file:
            response.write(zip_file.read())
        shutil.rmtree(jp_path)
        os.unlink(f'{temp_dir}/{job_posting_id}.zip')
        print(" deletion done ")
        return response


class MLOutputData(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, id):
        search = request.query_params.get('search')
        ml_output_dataset = ml_output_candidates_filter(search, id, "ml")
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(ml_output_dataset, per_page)
        ml_output_data = paginator.get_page(page_number)
        candidate_response = []
        for candidate in ml_output_data:
            candidate_object = Candidate.objects.get(id=candidate.candidate_id_id)
            candidate_data = complete_candidate_data(candidate_object)
            candidate_data.update({
                "candidate_accuracy": candidate.accuracy,
                "is_published": candidate.published,
                'source_type': candidate.source
            })

            candidate_response.append(candidate_data)
        response = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "candidates": candidate_response,
        }
        return Response(response, content_type="application/json")

    def delete(self, request):
        job_posting_id = request.data['job_posting_id']
        candidates_id = request.data['candidates_id']
        try:
            found = JobPostingCandidate.objects.filter(
                candidate_id_id__in=candidates_id, job_posting_id=job_posting_id)

            JobPostingCandidateSkill.objects.filter(job_posting_candidate_id__in=found).delete()
            if len(found) != 0:
                deleted = len(found)
                found.delete()
                context = {
                    "message": "ML Output Data Deleted Successfully",
                    "total_count": len(candidates_id),
                    "deleted": deleted
                }
                return Response(context, status=status.HTTP_200_OK)
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(e, status=status.HTTP_400_BAD_REQUEST)


class PublishCandidates(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        if request.data['type'] and request.data['type'] == 'un_publish':
            context = un_publish_candidate(request)
            return Response(context, status=status.HTTP_200_OK)
        try:
            context = publish_candidate(request)
            if isinstance(context, Response):
                return context
            return Response(context, status.HTTP_200_OK)
        except:
            return Response({"Message": "Please Confirm if Company's Full Service Subscription is Activated"}, status=status.HTTP_400_BAD_REQUEST)


class AdminSeeAllProfilesAlert(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request):
        alert_type = request.query_params.get('alert_type')
        if alert_type == 'high':
            ml_process_jobs = MLProcess.objects.filter(status='success', job_posting_candidate_count__gte=0, job_posting_candidate_count__lte=10).order_by('-created_at')
        if alert_type == 'medium':
            ml_process_jobs = MLProcess.objects.filter(status='success', job_posting_candidate_count__gt=10, job_posting_candidate_count__lte=35).order_by('-created_at')
        if alert_type == 'low':
            ml_process_jobs = MLProcess.objects.filter(status='success', job_posting_candidate_count__gt=35, job_posting_candidate_count__lte=50).order_by('-created_at')
        page_number = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        if not per_page:
            per_page = 50
        paginator = Paginator(ml_process_jobs, per_page)
        ml_process_jobs = paginator.get_page(page_number)
        alerts_data = []

        for ml_process in ml_process_jobs:
            job_posting = ml_process.job_posting_id
            ml_process_data = alerts_data_see_all_profiles(job_posting)
            ml_process_data.update({"job_posting_candidate_count": ml_process.job_posting_candidate_count, "alert_type": alert_type})
            alerts_data.append(ml_process_data)
        context = {
            "total_count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_number,
            "per_page": per_page,
            "alerts": alerts_data
        }
        return Response(context, content_type="application/json")


class ModelRefresh(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def get(self, request, id):
        job = JobPosting.objects.get(id=id)
        if request.user.role == 'employer':
            is_valid = is_valid_employer(request, job)
            if not is_valid:
                return Response({"Message": "Trying to Access Wrong Job Posting"}, status=status.HTTP_401_UNAUTHORIZED)
        response = model_refresh(request, id)
        if response['status_code'] == 200:
            context = {"message": response.get('message')}
            return Response(context, status.HTTP_200_OK)
        
        elif response['status_code'] == 403:
            context = {"message": response.get('message')}
            return Response(context, status.HTTP_403_FORBIDDEN)
        else:
            context = {"message": 'BAD_REQUEST'}
            return Response(context, status.HTTP_400_BAD_REQUEST)
        

class ModelPush(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request):
        response  = candidate_push_ml(request)
        return response


class OpenaiPush(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerPermission,)

    def post(self, request):
        response  = candidate_openai_push(request)
        return response
    


class MlOutputAlert(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request, id):
        response  = ml_output_alert(request,id) 
        return response