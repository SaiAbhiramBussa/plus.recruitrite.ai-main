from .models import JobTitleMapping


def past_title_handler(job_title_object, past_mappings):
    past_mappings_list = [JobTitleMapping(from_title_id=past_title['id'], to_title=job_title_object) for past_title in
                          past_mappings if past_title.get('action') == 'add']
    JobTitleMapping.objects.bulk_create(past_mappings_list, ignore_conflicts=True)
    remove_mappings_list = [future_title['id'] for
                            future_title in past_mappings if future_title.get('action') == 'delete']
    JobTitleMapping.objects.filter(to_title=job_title_object, from_title__in=remove_mappings_list).delete()


def future_titles_handler(job_title_object, future_mappings):
    future_mappings_list = [JobTitleMapping(from_title=job_title_object, to_title_id=future_title['id']) for
                            future_title in future_mappings if future_title.get('action') == 'add']
    JobTitleMapping.objects.bulk_create(future_mappings_list, ignore_conflicts=True)
    remove_mappings_list = [future_title['id'] for
                            future_title in future_mappings if future_title.get('action') == 'delete']
    JobTitleMapping.objects.filter(from_title=job_title_object, to_title__in=remove_mappings_list).delete()


def mappings_response(title):
    future_mappings = JobTitleMapping.objects.filter(from_title=title)
    past_mappings = JobTitleMapping.objects.filter(to_title=title)
    future_mapped_titles = [{'id': mapped.to_title.id, 'title': mapped.to_title.title} for mapped in future_mappings]
    past_mapped_titles = [{'id': mapped.from_title.id, 'title': mapped.from_title.title} for mapped in past_mappings]
    return {
        'id': title.id,
        'job_title': title.title,
        'future_mappings': future_mapped_titles,
        'past_mappings': past_mapped_titles,
    }
