from datetime import datetime, timezone
from machine_learning.models import MLTrainingData
from candidate.services import _create_candidate
from payment_history.services import validate_screening_records_left, deduct_screening_record
from powered_by.models import PoweredByRequestAttachment
from decouple import config
import requests
from company.models import Company
from accounts.services import get_employee_credits

class PoweredByWebhooks:

    def selector(self, webhook, payload):
        webhook_type = webhook.type
        try:
            if webhook_type == 'success.parse_resume':
                self.process_parsed_resume(payload)
                webhook.refresh_from_db()
                webhook.status = 'success'
            if webhook_type == 'failed.parse_resume' or webhook_type == 'unable.parse_resume':
                self.process_failed_parse_resume(payload)
                webhook.refresh_from_db()
                webhook.status = 'success'
            if webhook_type == 'success.rank_resume':
                payload = payload.get('data')
                self.process_ranked_resume(payload)
                webhook.refresh_from_db()
                webhook.status = 'success'
            if webhook_type == 'failed.rank_resume':
                payload = payload.get('data')
                self.process_failed_rank_resume(payload)
                webhook.refresh_from_db()
                webhook.status = 'success'
            webhook.save()
        except Exception as e:
            if webhook_type == 'success.parse_resume':
                attachment = PoweredByRequestAttachment.objects.get(id=payload.get('attachment_id'))
                attachment.processing_status = 'parsing_failed'
                attachment.save()
            if webhook_type == 'success.rank_resume':
                resumes = payload.get('data').get('candidate_resume')
                attachment = PoweredByRequestAttachment.objects.get(id=resumes[0].get('id'))
                attachment.processing_status = 'model_processing_failed'
                attachment.save()
            print(e)
            webhook.refresh_from_db()
            webhook.status = 'failed'
            webhook.save()

    def process_failed_parse_resume(self, payload):
        powered_by_request_attachment = PoweredByRequestAttachment.objects.get(id=payload.get('attachment_id'))
        powered_by_request_attachment.processing_status = 'parsing_failed'
        powered_by_request_attachment.save()

    def process_parsed_resume(self, payload):
        data = payload.get('data')
        powered_by_request_attachment = PoweredByRequestAttachment.objects.get(id=payload.get('attachment_id'))
        powered_by_request_attachment.processing_status = 'parsed'
        openai_stats_dict = {"openai_cost": data.get("open_ai_cost"), "openai_calls": data.get("total_openai_call")}
        if openai_stats_dict:
            powered_by_request_attachment.openai_stats = openai_stats_dict
        powered_by_request_attachment.save()

        if powered_by_request_attachment.powered_by_request_id.company_id.name != config('PLAYGROUND_COMPANY'):
            is_valid, screening_records = validate_screening_records_left(
                powered_by_request_attachment.powered_by_request_id.company_id)
            try:
                company = powered_by_request_attachment.powered_by_request_id.company_id
                user = powered_by_request_attachment.user
                if powered_by_request_attachment.user.role == "employer":
                    is_valid, screening_records = validate_screening_records_left(company)
                elif powered_by_request_attachment.user.role == 'hiring_manager':
                    screening_records = get_employee_credits(user)
            except Exception as e:
                screening_records = 0
                print("except:", e)
            powered_by_request_attachment.refresh_from_db()
            if not screening_records:
                powered_by_request_attachment.processing_status = 'avail_credits'
                powered_by_request_attachment.save()
            else:
                self.ranker_api_call(powered_by_request_attachment, data)
        else:
            self.ranker_api_call(powered_by_request_attachment, data)

    def process_ranked_resume(self, payload):
        resumes = payload.get('candidate_resume')
        for resume in resumes:
            powered_by_request_attachment = PoweredByRequestAttachment.objects.get(id=resume.get('id'))
            powered_by_request = powered_by_request_attachment.powered_by_request_id
            processed_candidates = powered_by_request.processed_response if powered_by_request.processed_response else []
            powered_by_request.refresh_from_db()
            processed_candidates.append(resume)
            powered_by_request.processed_response = processed_candidates
            powered_by_request.save()
            powered_by_request_attachment.processing_status = 'model_processed'
            powered_by_request_attachment.save()
            if powered_by_request.company_id.name != config('PLAYGROUND_COMPANY'):
                deduct_screening_record(powered_by_request.company_id,powered_by_request_attachment.user)
                powered_by_request.refresh_from_db()
                powered_by_request.credits_used = powered_by_request.credits_used + 1
                powered_by_request.completed_at = datetime.now(timezone.utc)
                powered_by_request.save()

    def process_failed_rank_resume(self, payload):
        resumes = payload.get('candidate_resume')
        for resume in resumes:
            powered_by_request_attachment = PoweredByRequestAttachment.objects.get(id=resume.get('id'))
            powered_by_request_attachment.processing_status = 'model_processing_failed'
            powered_by_request_attachment.save()

    def save_parsed_resume(self, webhook, payload):
        print("Payload: ", payload)
        data = payload.get('data')
        response = _create_candidate(data)
        if response.status_code == 200:
            powered_by_request_attachment = PoweredByRequestAttachment.objects.get(id=payload.get('attachment_id'))
            powered_by_request_attachment.candidate_id_id = response.data.get('candidate_id')
            powered_by_request_attachment.save()
            webhook.refresh_from_db()
            webhook.saving_status = 'success'
            webhook.save()
        else:
            webhook.refresh_from_db()
            webhook.saving_status = 'failed'
            webhook.save()

    def ranker_api_call(self, powered_by_request_attachment, resume_data):
        preset_weights = MLTrainingData.TARGET_LABELS
        
        try:
            resume_data.update({'id': str(powered_by_request_attachment.id)})
            api_request_data = {
                "queue_name": config('MODEL_PARSER_QUEUE_NAME'),
                "webhook_url": f"{config('API_DOMAIN')}/api/v1/powered_by/webhook",
                "model": powered_by_request_attachment.powered_by_request_id.model,
                "job_posting": powered_by_request_attachment.powered_by_request_id.request_body.get('job_posting'),
                "candidate_resume": [
                    resume_data
                ],
                "preset_weights": preset_weights
            }
            url = f"{config('PROCESS_QUEUE_DOMAIN')}/queue_job"
            headers = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            }
            response = requests.request("POST", url, headers=headers, json=api_request_data)
            if response.status_code == 200:
                powered_by_request_attachment.processing_status = 'model_processing'
                powered_by_request_attachment.save()
            else:
                powered_by_request_attachment.processing_status = 'rank_request_failed'
                powered_by_request_attachment.save()
                
        except Exception as e:
            print("Error: ", e)
