# Imports for Model
from datetime import date
from transformers import BigBirdTokenizer, BigBirdModel
from job_posting.models import JobPostingCandidate, JobPosting, JobPostingLabelWeight, JobPostingSkill, Skill
from django.db import DataError
import pandas as pd
import torch
import os
from candidate.models import Candidate, CandidateWorkHistory, CandidateSkill
from company.models import Company
from machine_learning.ml_bb import candidate_bucket
from decouple import config
import torch
import numpy as np
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def new_model_ranking_v2(job_posting_id, result_set, pushed_candidates):
    from machine_learning.services import upload_to_s3, ranking_skill, create_candidate_skill, clean_html, calculate_skill_prob, main_preprocess

    accuracy_gre_50 = []
    accuracy_less_50 = []
    unformatted_candidates_work_history = []
    candidates_work_history = []
    candidate_ids = []
    candidate_skills = []
    candidate_pred_skills = []

    for entry in result_set:
        candidate = Candidate.objects.get(id=entry[0])
        candidate_id = str(candidate.id)
        candidate_ids.append(candidate_id)
        work_history_data = CandidateWorkHistory.objects.filter(candidate_id_id=candidate_id).order_by("-from_date")
        candidate_skill_names = []
        skills_id = CandidateSkill.objects.filter(candidate_id_id=candidate_id)

        for skill_id in skills_id:
            skill = Skill.objects.get(id=skill_id.skill_id_id)
            candidate_skill_names.append(skill.name)

        candidate_skill = f'Skills: {", ".join(candidate_skill_names)}\n'
        candidate_work_history = ""

        for index in range(len(work_history_data)):
            work_history = work_history_data[index]
            company = Company.objects.get(id=work_history.company_id_id)
            if index == 0:
                candidate_work_history += "[currently working as]\n"
            elif index == 1:
                candidate_work_history += "[recent skip title]\n"
            else:
                candidate_work_history += "[other titles]\n"
            
            candidate_work_history += f'Title: {work_history.title} \nCompany: {company.name} \nDescription: {clean_html(work_history.description)} \nFrom Date: {work_history.from_date} \nTo Date: {work_history.to_date}\n'

            if index == len(work_history_data) - 1:
                candidate_work_history += f'Summary: {candidate.summary} \n{candidate_skill} \n'
            
        candidates_work_history.append(candidate_work_history)
        unformatted_candidates_work_history.append(main_preprocess(candidate_work_history))
        candidate_skills.append(candidate_skill)
    
    job_posting = JobPosting.objects.get(id=job_posting_id)
    skill_names = []
    jp_skills_id = JobPostingSkill.objects.filter(job_posting_id_id=job_posting_id)

    for jp_skill_id in jp_skills_id:
        skill = Skill.objects.get(id=jp_skill_id.skill_id_id)
        skill_names.append(skill.name)

    unformatted_candidates_job_description = []
    job_details = f'Job Title: {job_posting.title} \nJob Description: {clean_html(job_posting.description)} \nCompensation: {job_posting.compensation} \nWork Location Type: {job_posting.work_location_type} \nSkills: {", ".join(skill_names)} \n'
    unformatted_job_details = main_preprocess(job_details)
    
    for index in range(len(result_set)):
        unformatted_candidates_job_description.append(unformatted_job_details)
        pred_skills = calculate_skill_prob(job_details, candidate_skills[index])
        candidate_pred_skills.append(pred_skills)

    headers = ['job_description', 'resume', 'pred_skills', 'candidate_id']
    data = {
        'job_description': unformatted_candidates_job_description,
        'resume': unformatted_candidates_work_history,
        "pred_skills": candidate_pred_skills,
        'candidate_id': candidate_ids,
    }
    
    preset_weights_objs = JobPostingLabelWeight.objects.filter(job_posting_id_id=job_posting_id).values()
    preset_weights = {}
    
    for weigths in preset_weights_objs:
        preset_weights[weigths['type']] = weigths['weightage']
    # print(data, "here", preset_weights)
    if data:
        test_df = pd.DataFrame(data, columns=headers)
        candidate_pool_csv = bb_model_prediction(test_df, 'google/bigbird-roberta-base', preset_weights)

        if candidate_pool_csv is not None:
            current_date = date.today().strftime("%Y-%m-%d")
            file_name = f"{job_posting_id}/{current_date}.csv"
            upload_to_s3(candidate_pool_csv, candidate_bucket, file_name)

            for index, data in candidate_pool_csv.iterrows():
                if not JobPostingCandidate.objects.filter(candidate_id_id=data['candidate_id'],
                                                          job_posting_id_id=job_posting_id).exists():
                    JobPostingCandidate.objects.create(
                        candidate_id_id=data['candidate_id'], job_posting_id_id=job_posting_id,
                        accuracy=round(data['pred'] * 100, 4))

                if JobPostingCandidate.objects.filter(candidate_id_id=data['candidate_id'], job_posting_id_id=job_posting_id).exists():
                    idx = candidate_ids.index(data['candidate_id'])
                    output = ranking_skill(candidates_work_history[idx], job_details, data['candidate_id'])

                    if output:
                        for match in output:
                            skill_name, accuracy = match[0], match[1]
                            try:
                                create_candidate_skill(job_posting_id, data['candidate_id'], skill_name, accuracy)
                            except DataError:
                                continue

                if pushed_candidates:
                    if round(round(data['pred'] * 100, 4)) > 50.0000:
                        accuracy_gre_50.append(
                            {"candidate_id_id": data['candidate_id'], "job_posting_id_id": job_posting_id})
                    else:
                        accuracy_less_50.append(
                            {"candidate_id_id": data['candidate_id'], "job_posting_id_id": job_posting_id})

    if pushed_candidates:
        return accuracy_gre_50, accuracy_less_50


# multi class classification

def bb_model_prediction(final_csv, model_name, preset_weights):
    from machine_learning.services import handle_list, calculate_prob
    # defining the tokenizer
    tokenizer = BigBirdTokenizer.from_pretrained(model_name)
    # target_list for model (target outputs)
    target_list = ['recent_title', 'recent_skip_title', 'other_titles', 'summary']
    if final_csv.empty:
        return pd.DataFrame(columns=['candidate_id', 'job_description', 'resume', 'pred'])

    try:
        final_csv['pred_skills'] = pd.to_numeric(final_csv['pred_skills'], errors='coerce').fillna(0)
        final_csv['job_description'] = final_csv['job_description'].astype(str)
        final_csv['resume'] = final_csv['resume'].astype(str)
        final_csv['candidate_id'] = final_csv['candidate_id'].astype(str)

        # Create combined column
        final_csv['combined'] = final_csv['job_description'] + "[SEP]" + final_csv['resume']

    except Exception as e:
        print(f"Error in data preparation: {str(e)}")
        return pd.DataFrame(columns=['candidate_id', 'job_description', 'resume', 'pred'])
    
    # defining the BigBirdClass for our custom usage
    class BigBirdClass(torch.nn.Module):            
        def __init__(self):
            super(BigBirdClass, self).__init__()
            self.bert_model = BigBirdModel.from_pretrained('google/bigbird-roberta-base', return_dict=True)
            self.linear = torch.nn.Linear(768, 4)

        def forward(self, input_ids, attn_mask, token_type_ids): # this method gets invoked
            output = self.bert_model(
                input_ids,
                attention_mask=attn_mask,
                token_type_ids=token_type_ids
            )
            pooled_output = output.pooler_output  # Use pooler_output for classification
            logits = self.linear(pooled_output)
            return logits
        
        
    class CustomDataset(torch.utils.data.Dataset):    # our custom dataset, same pattern for any pytorch data
        def __init__(self, df, tokenizer, max_len):
            self.tokenizer = tokenizer
            self.df = df
            self.combined = list(df['combined'])
            # self.res = list(df['resume'])
            # self.targets = self.df[target_list].values
            self.resume = list(df['resume'])
            self.id = list(df['candidate_id'])
            self.job_description = list(df['job_description'])
            self.pred_skills = list(df['pred_skills'])
            self.max_len = max_len

        def __len__(self):
            return len(self.combined)

        def __getitem__(self, index):    # goes as inputs to model

            inputs = self.tokenizer.encode_plus(
                self.combined[index],
                None,
                add_special_tokens=True,
                max_length=self.max_len,
                padding='max_length',
                return_token_type_ids=True,
                truncation=True,
                return_attention_mask=True,
                return_tensors='pt'
            )
            return {                   # returning the resume, jd, etc as the data
                'input_ids': inputs['input_ids'].flatten(),
                'attention_mask': inputs['attention_mask'].flatten(),
                'token_type_ids': inputs["token_type_ids"].flatten(),
                # 'targets': self.targets[index],
                'combined': self.combined[index],
                'res': self.resume[index],
                'id' : self.id[index],
                'job_description' : self.job_description[index],
                'pred_skills' : self.pred_skills[index]
                # 'res': self.res[index]
            }
    
    model = BigBirdClass()  # object for our custom class
    
    if torch.cuda.is_available(): # checking the availability of GPU
        model.load_state_dict(torch.load(os.path.join(config('SAVED_MODEL'))), strict=False)  # loading the model weights from .bin file
    else:
        model.load_state_dict(torch.load(os.path.join(config('SAVED_MODEL')), map_location=torch.device("cpu")), strict=False)
        
    model = model.to(device) # setting the model to device for faster computations
    
    val_dataset = CustomDataset(final_csv, tokenizer, 4096)
    val_data_loader = torch.utils.data.DataLoader(val_dataset,
    batch_size=1,
    shuffle=False,
    num_workers=0
     )
    
    model.eval() # setting the model in evaluation mode (basically testing mode)

    datas = []
    with torch.no_grad():  # not storing the gradients
        headers = ['candidate_id', 'job_description', 'resume', 'pred'] # headers for the result df

        for batch_idx, data in enumerate(val_data_loader, 0):
            ids = data['input_ids'].to(device, dtype = torch.long) # getting the 'combined' from data loader
            mask = data['attention_mask'].to(device, dtype = torch.long)
            token_type_ids = data['token_type_ids'].to(device, dtype = torch.long)
            # targets = data['targets'].to(device, dtype = torch.float)
            outputs = model(ids, mask, token_type_ids) # model's output
            prob = torch.sigmoid(outputs).detach().cpu() # applying sigmoid activation function to convert the logits into probabilities
            outputs = torch.sigmoid(outputs).cpu().detach().numpy() # converting tensors into numpy values (array type)
            outputs = np.where(outputs < 0.5, 0, 1) # setting outputs to 0,1 based on prob
            net_prob = calculate_prob(prob, preset_weights) * 0.85 * 0.01
            net_prob=round(net_prob, 4)
            skill_prob = data['pred_skills'] * 0.15 * 0.01
            # print(skill_prob)
            # skill_prob = round(skill_prob, 2)
            total_prob  = round(float(net_prob + skill_prob), 4)
            row=[handle_list(data['id']), handle_list(data['job_description']), handle_list(data['res']), total_prob]
            # print(handle_list(targets))
            datas.append(row)
            # datas.append([data["title"], targets, outputs, prob, net_prob])
        
        if datas:
            df = pd.DataFrame(datas, columns=headers)
            return df
        else:
            None
