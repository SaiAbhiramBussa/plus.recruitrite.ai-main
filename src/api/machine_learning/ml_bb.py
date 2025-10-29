# Imports for Model
from datetime import date
from natsort import natsorted
import pandas as pd
import torch
import tempfile
import torch.nn.functional as F
from transformers import BertTokenizer , BertForSequenceClassification, BigBirdTokenizer, BigBirdForSequenceClassification
from fuzzywuzzy import process, fuzz
from nltk import sent_tokenize
from nltk import word_tokenize
from nltk.stem import WordNetLemmatizer

device = torch.device('cuda')

print(device)

# Import for db and django
import os
import shutil
from job_posting.models import  JobPostingCandidate
from decouple import config
from django.db import DataError


candidate_bucket = config("CANDIDATE_POOL_BUCKET")
model = "bigbird"

def new_model_ranking(job_posting_id, result_set, pushed_candidates):
    from machine_learning.services import  write_candidate_file , write_job_posting_file , clear_phrases , summarize , upload_to_s3 , ranking_skill , create_candidate_skill
    
    accuracy_gre_50 = []
    accuracy_less_50 = []
    temp_dir = tempfile.mkdtemp()
    os.mkdir(f"{temp_dir}/ml_output_files")
    jp_path = f"{temp_dir}/ml_output_files/{job_posting_id}"
    os.mkdir(jp_path)
    candidate_path = f"{temp_dir}/ml_output_files/{job_posting_id}/candidates"
    os.mkdir(candidate_path)

    for entry in result_set:
        write_candidate_file(entry, candidate_path, job_posting_id)
    write_job_posting_file(jp_path, job_posting_id)

    file_list = os.listdir(f'{temp_dir}/ml_output_files/{job_posting_id}/candidates/')
    desc_file = open(
        f'{temp_dir}/ml_output_files/{job_posting_id}/{job_posting_id}.txt', 'r')
    job_desc_text = desc_file.read()
    job_skills = clean_skills(job_desc_text)
    sorted_list_file = natsorted(file_list)
    resume_directory = []
    for sorted_files in sorted_list_file:
        for file in file_list:
            if file == sorted_files:
                if not file.endswith('Job_Description.txt'):
                    file_data = open(
                        f'{temp_dir}/ml_output_files/{job_posting_id}/candidates/{file}', 'r')
                    resume = file_data.read()
                    resume = get_required(resume)
                    resume_directory.append({
                        'resume_id': file.split('.')[0],
                        'resume': resume})
    if model == "bert":
        job_text = clear_phrases(summarize(job_desc_text, 80))
        data = []
        for resume in resume_directory:
            # clean the data
            resume_text = clear_phrases(summarize(resume['resume'], 80))
            data.append({"candidate_id": resume['resume_id'],
                        "job_description": job_text, "resume": resume_text})
    else:
        job_text = bigbird_preprocess(job_desc_text)
        data = []
        for resume in resume_directory:
            resume_skills = clean_skills(resume['resume'])
            pred_skills = get_pred_skill(resume_skills, job_skills)
            resume_text = bigbird_preprocess(resume['resume'])
            data.append({"candidate_id": resume['resume_id'],
                        "job_description": job_text, "resume": resume_text, "pred_skills":pred_skills})


    if data:
        test_df = pd.DataFrame(
            data, columns=['candidate_id', 'job_description', 'resume', "pred_skills"])
        if model == "bert":
            candidate_pool_csv = new_model_prediction(test_df, 'bert-base-uncased')
        else:
            candidate_pool_csv = bb_model_prediction(test_df, 'google/bigbird-roberta-base')
        if candidate_pool_csv is not None:
            current_date = date.today().strftime("%Y-%m-%d")
            file_name = f"{job_posting_id}/{current_date}.csv"
            upload_to_s3(candidate_pool_csv, candidate_bucket, file_name)

            for index, data in candidate_pool_csv.iterrows():
                    if not JobPostingCandidate.objects.filter(candidate_id_id=data['candidate_id'], job_posting_id_id=job_posting_id).exists():
                        JobPostingCandidate.objects.create(
                            candidate_id_id=data['candidate_id'], job_posting_id_id=job_posting_id, accuracy=round(data['pred']*100, 4))

                    if JobPostingCandidate.objects.filter(candidate_id_id=data['candidate_id'], job_posting_id_id=job_posting_id).exists():
                        for resume in resume_directory:
                            if resume['resume_id'] == data['candidate_id']:
                                output = ranking_skill(
                                    resume['resume'], job_desc_text, data['candidate_id'])
                                if output:
                                    for match in output:
                                        skill_name, accuracy = match[0], match[1]
                                        try:
                                            create_candidate_skill(job_posting_id, data['candidate_id'], skill_name, accuracy)
                                        except DataError:
                                            continue
                                        
                    if pushed_candidates:
                        if round(round(data['pred']*100, 4)) > 50.0000:
                            accuracy_gre_50.append(
                                {"candidate_id_id": data['candidate_id'], "job_posting_id_id": job_posting_id})
                        else:
                            accuracy_less_50.append(
                                {"candidate_id_id": data['candidate_id'], "job_posting_id_id": job_posting_id})
                            
                        
    shutil.rmtree(jp_path)
    print(" deletion done ")
    
    if pushed_candidates:
        return accuracy_gre_50, accuracy_less_50


def new_model_prediction(final_csv, model_name):
    try:
        from keras.preprocessing.sequence import pad_sequences
    except ImportError as e:
        print(e)
        from keras.preprocessing.sequence import pad_sequences
        
    tokenizer = BertTokenizer.from_pretrained(model_name, do_lower_case=True)
    model = BertForSequenceClassification.from_pretrained(
        config('SAVED_MODEL'))

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
        encoded_sent = tokenizer(
            sentA[i],
            sentB[i],
            add_special_tokens=True)

        sent_ids.append(encoded_sent['token_type_ids'])
        input_ids.append(encoded_sent['input_ids'])

    # Example of the first sentence
    print('Pair Sentence: {0} {1}'.format(sentA[0], sentB[0]))
    print('Sentence IDS:', sent_ids[0])
    print('BERT tokens IDs:', input_ids[0])

    # Set the maximum sequence length. It needs to be larger than 4577
    max_len = max([len(sent) for sent in input_ids]) + 3

    print('Padding all the sentences to:', max_len)

    # Set PAD IDs as value=0 for the attention mask
    # "post" means that we add those special characters to the end of the sentence
    input_ids = pad_sequences(input_ids, maxlen=max_len, dtype="long",
                              value=0, truncating="post", padding="post")

    # SEt the PAD IDs as 1, as we move them to the back of the sentence
    sent_ids = pad_sequences(sent_ids, maxlen=max_len, dtype="long",
                             value=1, truncating="post", padding="post")

    print('Padding completed!')

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

    for input_id, att_mask, sent_id, candidate_id, job_desc, resume in zip(input_ids, att_masks, sent_ids, final_csv['candidate_id'], final_csv['job_description'], final_csv['resume']):

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

        b_input_ids = torch.cat([b_input_ids, torch.zeros(
            (b_input_ids.size(0), padding_length), dtype=torch.long, device=device)], dim=1)
        b_input_mask = torch.cat([b_input_mask, torch.zeros(
            (b_input_mask.size(0), padding_length), dtype=torch.long, device=device)], dim=1)
        b_sent_ids = torch.cat([b_sent_ids, torch.zeros(
            (b_sent_ids.size(0), padding_length), dtype=torch.long, device=device)], dim=1)

        # Tell the model not to compute or store gradients
        with torch.no_grad():

            # Perform the forward pass. This output will return the predictions, because we haven't specified the labels
            outputs = model(b_input_ids,
                            # Same as "segment ids", which differentiates sentence 1 and 2
                            token_type_ids=b_sent_ids,
                            attention_mask=b_input_mask)

        # Get the "logits" output, which are the predictions befroe applying the activation function (e.g., softmax)
       
        logits = outputs.logits
        
        probabilities = F.softmax(logits, dim=1)
        
        final_pred = probabilities[0][1].detach().cpu().numpy()

        preds.append({"candidate_id": candidate_id, "job_description": job_desc,
                     'resume': resume, "pred": final_pred})

    # making the candidate pool csv
    if preds:
        prediction_csv = pd.DataFrame(
            preds, columns=['candidate_id', 'job_description', 'resume', 'pred'])
        return prediction_csv

    else:
        return None

### BIG BIRD PREDICTIONS 
        
def bb_model_prediction(final_csv, model_name):
    try:
        from tensorflow.keras.preprocessing.sequence import pad_sequences
    except ImportError as e:
        print(e)
        from tensorflow.keras.preprocessing.sequence import pad_sequences
    # from torch.nn.utils.rnn import pad_sequence
    print("tokenizer")
    tokenizer = BigBirdTokenizer.from_pretrained(model_name)
    print("loading model")
    model = BigBirdForSequenceClassification.from_pretrained(config('SAVED_MODEL'))
    model.to(device)

    sentA = final_csv.job_description.values
    sentB = final_csv.resume.values

    # Tokenize all the sentences and map the tokens to thier word IDs.
    input_ids = []
    sent_ids = []
    attention_masks = []
    for i in range(0, sentA.shape[0]):
        # 'encode' will tokenize every word in the sentence,
        # Add [CLS] and [SEP] special characters to the beggining and end of the sentence (also add [SEP] between sentA and B)
        # Finally map every token to their ID
        encoded_sent = tokenizer(
            sentA[i],
            sentB[i],
            add_special_tokens=True,
            return_token_type_ids=True)

        sent_ids.append(encoded_sent['token_type_ids'])
        input_ids.append(encoded_sent['input_ids'])
        # input_ids.append(encoded_sent['input_ids'])
        # attention_masks.append(encoded_sent['attention_mask'])


    # Example of the first sentence
    print('Pair Sentence: {0} {1}'.format(sentA[0], sentB[0]))
    print('Sentence IDS:', sent_ids[0])
    print('BERT tokens IDs:', input_ids[0])

    # Set the maximum sequence length. It needs to be larger than 4577
    max_len = max([len(sent) for sent in input_ids]) + 3

    # print('Padding all the sentences to:', max_len)



    # Set PAD IDs as value=0 for the attention mask
    # "post" means that we add those special characters to the end of the sentence
    input_ids = pad_sequences(input_ids, maxlen=max_len, dtype="long",
                              value=0, truncating="post", padding="post")

    # SEt the PAD IDs as 1, as we move them to the back of the sentence
    sent_ids = pad_sequences(sent_ids, maxlen=max_len, dtype="long",
                             value=1, truncating="post", padding="post")

    print('Padding completed!')

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

    for input_id, att_mask, sent_id, candidate_id, job_desc, resume, pred_skills in zip(input_ids, att_masks, sent_ids, final_csv['candidate_id'], final_csv['job_description'], final_csv['resume'], final_csv['pred_skills']):

        input_id = torch.tensor(input_id).unsqueeze(0)
        att_mask = torch.tensor(att_mask).unsqueeze(0)
        sent_id = torch.tensor(sent_id).unsqueeze(0)

        # print(input_id.shape)

        b_input_ids = input_id.to(device)
        b_input_mask = att_mask.to(device)
        b_sent_ids = sent_id.to(device)

        max_length = 4096

        b_input_ids = b_input_ids[:, :max_length]
        b_input_mask = b_input_mask[:, :max_length]
        b_sent_ids = b_sent_ids[:, :max_length]

        padding_length = max_length - b_input_ids.size(1)

        b_input_ids = torch.cat([b_input_ids, torch.zeros(
            (b_input_ids.size(0), padding_length), dtype=torch.long, device=device)], dim=1)
        b_input_mask = torch.cat([b_input_mask, torch.zeros(
            (b_input_mask.size(0), padding_length), dtype=torch.long, device=device)], dim=1)
        b_sent_ids = torch.cat([b_sent_ids, torch.zeros(
            (b_sent_ids.size(0), padding_length), dtype=torch.long, device=device)], dim=1)

        # Tell the model not to compute or store gradients
        with torch.no_grad():

            # Perform the forward pass. This output will return the predictions, because we haven't specified the labels
            outputs = model(b_input_ids,
                            # Same as "segment ids", which differentiates sentence 1 and 2
                            token_type_ids=b_sent_ids,
                            attention_mask=b_input_mask)

        # Get the "logits" output, which are the predictions befroe applying the activation function (e.g., softmax)
       
        logits = outputs.logits
        probabilities = torch.sigmoid(logits)
        final_pred = probabilities[0][1].detach().cpu().numpy()
        calculated_pred = 0.85 * final_pred + 0.15 * (pred_skills/100)
        print(resume, calculated_pred, "\n")
        preds.append({"candidate_id": candidate_id, "job_description": job_desc,
                     'resume': resume, "pred": calculated_pred})

    # making the candidate pool csv
    if preds:
        prediction_csv = pd.DataFrame(
            preds, columns=['candidate_id', 'job_description', 'resume', 'pred'])
        return prediction_csv
    else:
        return None
       
def resume_json_to_text(resume_json):
    result = ""
    result += resume_json['summary'] + "\n\n"
    result += f"Skills: {', '.join(skill['skill'] for skill in resume_json['skills'])}"
    result += "\n"
    # Extract Work History
    for wh in resume_json['work_history']:
        result += f'* Title: {wh["title"]}\n'
        result += f'  Company: {wh["company"]}\n'
        result += f'  Description: {wh["description"]}\n'
        
    for eh in resume_json['education_history']:
        result += f'* School Name: {eh["name"]}\n'
        result += f'  Degree: {eh["degree"]}\n'

    return result

def get_required(file_content):
  start_index_skills = file_content.find("Skills:")
  end_index_skills = file_content.find("# Work History:", start_index_skills)
  skills = file_content[start_index_skills:end_index_skills].strip()

  summary_match = re.search(r"Candidate Name:(.*?)# Work History:", file_content, re.DOTALL)
  summary_section = summary_match.group(1).strip() if summary_match else ""
  # Extract the first work history title and description
  start_index_work_history = file_content.find("* Title:", end_index_skills)
  end_index_work_history = file_content.find("# Education History:", start_index_work_history)
  if end_index_work_history == -1:
      # If there are no more work history details, extract until the end of the file
      extracted_work_history = file_content[start_index_work_history:].strip()
  else:
      extracted_work_history = file_content[start_index_work_history:end_index_work_history].strip()
#   print(extracted_work_history, "\n")
  return  extracted_work_history+" "+skills + " "+summary_section



def job_json_to_text(job_json):
    result = ""
    result += f"Title: {job_json['title']} \n"
    result += f"Skills: {job_json['skills']} \n"
    result += f"Description: {job_json['description']} \n"
    
    return result

def json_clear_phrases(text):
    phrases = ["Skills:", "Summary:","* Title:", "Company:", "Description:", "* School Name:", "\n" , "Title:", "•", "●"]

    for phrase in phrases:
        text = text.replace(phrase, '')
    return text.strip()

def rank_skill_matching(job_json,candidate_data):
    resume_skill = [skill['skill'].strip() for skill in candidate_data['skills']]
    job_skill = job_json['skills'].split(",")
    
    skill_with_percentage = []
    
    job_text = json_clear_phrases(job_json_to_text(job_json))
    resume_text  = json_clear_phrases(resume_json_to_text(candidate_data))
    
    for skill in resume_skill:
        Str_Partial_Match = fuzz.partial_ratio(skill,job_text)
        skill_with_percentage.append((skill,Str_Partial_Match))
        
    job_skill_with_percentage = []
    
    for skill in job_skill:
        Str_Partial_Match = fuzz.partial_ratio(skill.strip(),resume_text)
        job_skill_with_percentage.append((skill.strip(),Str_Partial_Match))
        
    if skill_with_percentage is None:
        return job_skill_with_percentage
    
    return skill_with_percentage

import re
def clean_bb(data):
    # text = re.sub(r"\[[0-9]*\]"," ",data)
    
    text = data.lower()
    text = re.sub(r'\s+'," ",text)
    text = re.sub(r","," ",text)
    uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    text = re.sub(uuid_pattern, '', text)
    return text

def preprocess_bb(text):
    # Tokenize the text into sentences and words
    sentences = sent_tokenize(text)
    words = [word_tokenize(sentence.lower()) for sentence in sentences]

    # Lemmatize the words
    lemmatizer = WordNetLemmatizer()
    words = [[lemmatizer.lemmatize(word) for word in sentence] for sentence in words]

    # Combine the words back into sentences
    sentences = [' '.join(sentence) for sentence in words]
    return ' '.join(sentences)

def clear_phrases_bb(text):
    pattern = r"candidate rank \d+"
    text = re.sub(pattern, '', text)
    pattern = r"\b\w+\snone\b"
    text = re.sub(pattern, '', text)
    phrases = ["candidate id", "job posting id", "candidate name","date" ,"Title" ,"br", "description", "job", "posting id", "Company", "None", "title", "*:", "|", "#", "summary", "skills", ":", "*","•"]
    for phrase in phrases:
        text = text.replace(phrase,'')
    return text.strip()

def bigbird_preprocess(text):
    cleaned_article_content = clean_bb(text)
    cleaned_article_content = clear_phrases_bb(cleaned_article_content)
    cleaned_article_content = preprocess_bb(cleaned_article_content)
    return cleaned_article_content

def clean_skills(skill_section):
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
    skill_section = re.sub(r"(\.|\;|\,)", r" ", skill_section)
    skill_section = re.sub(r",", " ", skill_section)
    skill_section = re.sub(r"  ", " ", skill_section)
    return skill_section.lower()

def get_pred_skill(resume_skills, job_skills):

    if len(job_skills) == 0 or len(resume_skills) == 0:
        return 0
    value = fuzz.token_set_ratio(resume_skills, job_skills)
    return value
