import os
from datetime import timedelta
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'startdate.settings')
app = Celery('startdate')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

CELERY_ROUTES = {
    'powered_by.tasks.*': {'queue': 'powered_by'},
    'machine_learning.tasks.*': {'queue': 'mlqueue'},
    'accounts.tasks.*': {'queue': 'mlqueue'}
}

app.conf.beat_schedule = {

    'candidate.retry_every_5_minutes': {
        'task': 'celery_jobs.tasks.extract_candidate_excel',
        'schedule': 300.0,
    },
    'apollo_candidate.retry_every_2_minutes': {
        'task': 'candidate.tasks.apollo_candidate_extract',
        'schedule': 20.0,
    },
    'is_expired_subscription.retry_every_5_minutes': {
        'task': 'payment_history.tasks.check_expired_subscription',
        'schedule': 300.0,
    },
    'model_ranking_scheduler.retry_every_2_minutes': {
        'task': 'machine_learning.tasks.model_ranking_scheduler',
        'schedule': 120.0,
        'options': {'queue': 'mlqueue'}
    },
    'subscription_webhook_process.retry_every_1_minutes': {
        'task': 'payment_history.tasks.process_stripe_webhook',
        'schedule': 60.0,
    },
    
    # 'genai_profile.retry_every_30_second': {
    #     'task': 'genai_profile.tasks.gen_profile_task',
    #     'schedule': 30.0,
    # },
    
    # 'check_candidate_stage.retry_every_1_minutes': {
    #     'task': 'candidate.tasks.check_stage_candidate',
    #     'schedule': 60.0,
    # },
    'adwerks_send_mail': {
                    'task': 'adwerks.tasks.send_adwerk_mail',
                    'schedule': crontab(hour=13,minute=0,day_of_week=1,day_of_month='*',month_of_year='*') # 13 at every monday
                },
    'adwerks_job_scrapper': {
                        'task': 'adwerks.tasks.monthly_adwerk_jobs',
                        'schedule': crontab(hour=11,minute=30,day_of_week=1,day_of_month='*',month_of_year='*') # 11:30 am at every monday
                    },
    'adwerks_manual_send_mail': {
                    'task': 'adwerks.tasks.manual_adwerk_mail',
                    'schedule': crontab(hour=13,minute=0,day_of_week='*',day_of_month='*',month_of_year='*') # 13 at every day
                },
    'imprimis_partial_sync': {
                    'task': 'celery_jobs.tasks.imprimis_partial_sync_message_publish',
                    'schedule': crontab(hour=13,minute=0,day_of_week='*',day_of_month='*',month_of_year='*') # 13 at every day
                },
    'parsed_powered_by_webhook_process.retry_every_3_seconds': {
        'task': 'powered_by.tasks.process_parsed_powered_by_webhook',
        'schedule': 3.0,
        'options': {'queue': 'powered_by'}
    },
    'ranked_powered_by_webhook_process.retry_every_3_seconds': {
        'task': 'powered_by.tasks.process_ranked_powered_by_webhook',
        'schedule': 3.0,
        'options': {'queue': 'powered_by'}
    },
    'saving_powered_by_webhook_process.retry_every_3_seconds': {
        'task': 'powered_by.tasks.process_powered_by_webhook_for_saving',
        'schedule': 3.0,
        'options': {'queue': 'powered_by'}
    },
    'send_message_notification_email.retry_every_300_seconds': {
        'task': 'accounts.tasks.send_message_notification_email',
        'schedule': 300.0,
        'options': {'queue': 'mlqueue'}
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# start the celery: celery -A startdate worker -l info -B --scheduler django_celery_beat.schedulers:DatabaseScheduler
