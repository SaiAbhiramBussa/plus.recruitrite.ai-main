import datetime
from celery import shared_task
from .dux_soup import DuxSoupTask
from decouple import config
import requests


@shared_task()
def extract_candidate_excel():
    dux_soup_obj = DuxSoupTask()
    dux_soup_obj.extract_candidate_excel()


@shared_task()
def imprimis_partial_sync_message_publish():
    if config("ENVIRONMENT") == "Production":
        try:
            to_date = datetime.datetime.now()
            from_date = to_date - datetime.timedelta(days=1)
            url = f"{config('PROCESS_QUEUE_DOMAIN')}/queue_job"
            context_data = {
                "queue_name": "imprimis_sync",
                "type": "partial_sync",
                "from_date": str(from_date),
                "to_date": str(to_date),
                "use_parser": True,
            }
            headers = {"Cache-Control": "no-cache", "Content-Type": "application/json"}
            response = requests.request("POST", url, headers=headers, json=context_data)

        except Exception as e:
            print(e)
            pass
