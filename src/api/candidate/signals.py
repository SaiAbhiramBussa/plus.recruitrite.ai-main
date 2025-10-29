from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import (
    CandidateAttributes,
    Candidate,
    CandidateEducationHistory,
    CandidateWorkHistory,
)
from .services import candidate_address_generalise, check_cpws_candidate
from genai_profile.models import GenProfileProcess


@receiver(post_save, sender=CandidateAttributes)
def candidate_attributes_model_signal_receiver(instance, **kwargs):
    candidate_address_generalise(instance)


@receiver(post_save, sender=Candidate)
@receiver(post_save, sender=CandidateAttributes)
@receiver(post_save, sender=CandidateEducationHistory)
@receiver(post_save, sender=CandidateWorkHistory)
def update_candidate_cpws(instance, sender, **kwargs):
    candidate = instance if sender == Candidate else instance.candidate_id

    stage = check_cpws_candidate(candidate)
    Candidate.objects.filter(id=candidate.id).update(staged=stage)

    # gen_profile_obj = GenProfileProcess.objects.filter(candidate_id=candidate.id)

    # if (
    #     candidate.staged != "1111"
    #     and candidate.source != "Gen_ai"
    #     and not gen_profile_obj.exists()
    # ):
    #     print("Populating the Genprofile process")
    #     try:
    #         GenProfileProcess.objects.create(candidate_id=candidate, status="pending")
    #     except Exception as e:
    #         print(e)
    #         pass
