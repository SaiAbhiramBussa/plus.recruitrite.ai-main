from django.db.models import Q


class AdvancedSearchCandidate:
    def selector(self, query_set, query_field):
        candidate_fields = ['first_name', 'last_name', 'email', 'source ', 'staged', 'credentials']
        location_fields = ['city', 'state', 'country', 'zip']
        work_history_fields = ['title', 'company']
        education_history_fields = ['institute', 'degree']
        if query_field in candidate_fields:
            return self.candidate_fields_condition(query_set, query_field)
        if query_field in location_fields:
            return self.location_fields_condition(query_set, query_field)
        if query_field in work_history_fields:
            return self.work_history_fields_condition(query_set, query_field)
        if query_field in education_history_fields:
            return self.education_history_fields_condition(query_set, query_field)
        return None

    def candidate_fields_condition(self, query_set, query_field):
        value = query_set.get(query_field)
        if not value:
            return None
        return Q(**{f'{query_field}__icontains':value})

    def location_fields_condition(self, query_set, query_field):
        value = query_set.get(query_field)
        if not value:
            return None
        return Q(**{f'candidateattributes__{query_field}__icontains':value})

    def work_history_fields_condition(self, query_set, query_field):
        value = query_set.get(query_field)
        if not value:
            return None
        if query_field == 'company':
            return Q(**{'candidateworkhistory__company_id__name__icontains':value})
        if query_field == 'title':
            return Q(**{'candidateworkhistory__title__icontains':value})
        return None

    def education_history_fields_condition(self, query_set, query_field):
        value = query_set.get(query_field)
        if not value:
            return None
        if query_field == 'institute':
            return Q(**{'candidateeducationhistory__name__icontains':value})
        if query_field == 'degree':
            return Q(**{'candidateeducationhistory__degree__icontains':value})
        return None
