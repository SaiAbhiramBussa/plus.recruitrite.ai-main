import io
import boto3
from candidate.aws import read_excel_file, s3
from celery_jobs.models import BackgroundJob
import pandas as pd
from candidate.models import Candidate, CandidateEducationHistory, CandidateAttributes, CandidateWorkHistory, \
    CandidateSkill
from company.models import Company, Location
from job_posting.models import Skill
from startdate import settings
from django.db.models import F


class DuxSoupTask:

    def extract_candidate_excel(self):
        pending_files = BackgroundJob.objects.filter(
            status='pending'
        )
        count = 0
        for file in pending_files:
            pending_file = read_excel_file(file.key)
            df_test = pd.read_excel(pending_file)
            df = df_test.fillna("")
            try:
                status_list = []
                for i, row in df.iterrows():
                    count = count+1
                    status = ''
                    try:
                        if Candidate.objects.filter(external_id=row['id']).exists():
                            print("candidate exists")
                            candidate_obj = Candidate.objects.get(
                                external_id=row['id'])
                            status = 'Update'
                        else:
                            candidate_obj = Candidate(external_id=row['id'], first_name=row['First Name'],
                                                      last_name=row['Last Name'], profile=row['Profile'])
                            print("candidate does not exist.Created!")
                            status = 'Insert'
                            candidate_obj.save()
                        cand_id = candidate_obj.id
                        try:
                            com_attribute, attribute_flag = CandidateAttributes.objects.get_or_create(
                                candidate_id_id=cand_id, address=row['Location'])
                        except Exception as e:
                            status = 'Failed'
                            status_list.append[status]
                            continue

                        skill_counter = 0
                        while True:
                            if row[f'Skill-{skill_counter}'] == "":
                                break
                            if Skill.objects.filter(name=row[f'Skill-{skill_counter}']).exists():
                                skill_obj = Skill.objects.get(
                                    name=row[f'Skill-{skill_counter}'])
                            else:
                                skill_obj = Skill(
                                    name=row[f'Skill-{skill_counter}'])
                                skill_obj.save()
                            skill_obj_id = skill_obj.id
                            candidate_skill_object = CandidateSkill(
                                skill_id_id=skill_obj_id, candidate_id_id=cand_id)
                            candidate_skill_object.save()
                            skill_counter = skill_counter + 1

                        for education_counter in range(3):
                            if row[f'School-{education_counter}-Name'] != "":
                                education_obj, edu_flag = CandidateEducationHistory.objects.get_or_create(candidate_id_id=cand_id,
                                                                                                          name=row[
                                                                                                              f'School-{education_counter}-Name'],
                                                                                                          degree=row[f'School-{education_counter}-Degree'])

                        for work_history_counter in range(5):
                            if row[f'Position-{work_history_counter}-Company'] != "":
                                try:
                                    if Company.objects.filter(
                                            name=row[f'Position-{work_history_counter}-Company']).exists():
                                        company_object = Company.objects.get(
                                            name=row[f'Position-{work_history_counter}-Company'])
                                    else:
                                        company_object = Company(
                                            name=row[f'Position-{work_history_counter}-Company'])
                                        company_object.save()
                                    company_object_id = company_object.id
                                except Exception as e:
                                    continue
                                if row[f'Position-{work_history_counter}-Location'] != "":
                                    if Location.objects.filter(company_id_id=company_object_id, address=row[
                                            f'Position-{work_history_counter}-Location']).exists():
                                        location_object = Location.objects.get(company_id_id=company_object_id, address=row[
                                            f'Position-{work_history_counter}-Location'])
                                    else:
                                        location_object = Location(company_id_id=company_object_id,
                                                                   address=row[f'Position-{work_history_counter}-Location'])
                                        location_object.save()
                                    location_object_id = location_object.id
                                    work_history_obj, work_flag = CandidateWorkHistory.objects.get_or_create(company_id_id=company_object_id,
                                                                                                             location_id_id=location_object_id,
                                                                                                             candidate_id_id=cand_id,
                                                                                                             title=row[
                                                                                                                 f'Position-{work_history_counter}-Title'],
                                                                                                             description=row[
                                                                                                                 f'Position-{work_history_counter}-Description'],
                                                                                                             )
                                else:
                                    work_history_obj, work_flag = CandidateWorkHistory.objects.get_or_create(company_id_id=company_object_id,
                                                                                                             candidate_id_id=cand_id,
                                                                                                             title=row[
                                                                                                                 f'Position-{work_history_counter}-Title'],
                                                                                                             description=row[
                                                                                                                 f'Position-{work_history_counter}-Description'],
                                                                                                             )

                    except Exception as e:
                        print("Exception")
                    status_list.append(status)
                file.status = 'success'
                df["status"] = status_list
                with io.BytesIO() as output:
                    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                        df.to_excel(writer)
                    data = output.getvalue()

                s3.Bucket(settings.AWS_STORAGE_BUCKET_NAME).put_object(Key=f'imported/dux-soup/{file.key}', Body=data)
            except Exception as e:
                print(e)
                status = 'Failed'
            print(file.status)

            file.save()
            return
