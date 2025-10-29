from celery import shared_task
from .models import GenProfileProcess
from candidate.models import Candidate
from .services import create_genai_candidate
from django.utils import timezone


@shared_task()
def gen_profile_task():
    # Calculate the datetime 5 minutes ago
    five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
    tasks = GenProfileProcess.objects.filter(
        status="pending", created_at__lt=five_minutes_ago
    ).order_by("created_at")
    if tasks:
        for task in tasks:
            task.status = "in_progress"
            task.save()
            candidate_id = task.candidate_id_id
            candidate_obj = Candidate.objects.filter(id=candidate_id)

            if (
                candidate_obj.exists()
                and candidate_obj.first().staged != "1111"
                and candidate_obj.first().ai_candidate_id is None
            ):
                gen_candidate_id = create_genai_candidate(candidate_obj)

                if gen_candidate_id:
                    task.status = "success"
                    task.gen_candidate_id = gen_candidate_id
                else:
                    task.status = "failed"
                task.save()

            else:
                task.status = "already_generated"
                task.save()
    else:
        print("No task found")
