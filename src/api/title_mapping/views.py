from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import AdminPermission
from .models import JobTitle, JobTitleMapping
from .services import future_titles_handler, past_title_handler, mappings_response


class JobTitlesView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    # This endpoint to show all titles Or to search based on title.
    def get(self, request):
        title = request.query_params.get('title')
        if title:
            titles = JobTitle.objects.filter(title__icontains=title).order_by('-created_at')
        else:
            titles = JobTitle.objects.all().order_by('-created_at')
        job_titles_list = []
        for title in titles:
            job_titles_list.append({
                'id': title.id,
                'title': title.title,
                'past_title_mappings': len(JobTitleMapping.objects.filter(to_title=title)),
                'future_title_mappings': len(JobTitleMapping.objects.filter(from_title=title))
            })
        return Response(job_titles_list, status=status.HTTP_200_OK)

    # Create new job title, accepted format { 'job_title': 'Job Title' }
    def post(self, request):
        job_title = request.data.get('job_title')
        job_title_object = JobTitle.objects.get_or_create(title=job_title.lower())[0]
        context = {
            'id': job_title_object.id,
            'job_title': job_title_object.title
        }
        return Response(context, status=status.HTTP_201_CREATED)


class JobTitlesSpecificView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    # It deletes Job title and it's mappings.
    def delete(self, request, job_title_id):
        job_title_object = JobTitle.objects.filter(id=job_title_id).first()
        print(job_title_object)
        if not job_title_object:
            return Response({'Error': 'Job Title Not Found'}, status=status.HTTP_404_NOT_FOUND)
        JobTitleMapping.objects.filter(to_title=job_title_object).delete()
        JobTitleMapping.objects.filter(from_title=job_title_object).delete()
        job_title_object.delete()
        return Response({"Message": f"Title: {job_title_object.title} deleted successfully"}, status=status.HTTP_200_OK)


class JobMappingsView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    # It will allow user to map past and future title mappings.
    def post(self, request, job_title_id):
        past_mappings = request.data.get('past_mappings')
        future_mappings = request.data.get('future_mappings')
        job_title_object = JobTitle.objects.filter(id=job_title_id).first()
        if past_mappings:
            past_title_handler(job_title_object, past_mappings)
        if future_mappings:
            future_titles_handler(job_title_object, future_mappings)
        mappings = mappings_response(job_title_object)
        return Response(mappings, status=status.HTTP_200_OK)

    # Based on job title ID, it will return complete mappings of a job title.
    def get(self, request, job_title_id):
        title = JobTitle.objects.filter(id=job_title_id).first()
        mappings = mappings_response(title)
        return Response(mappings, status=status.HTTP_200_OK)

    # It will allow users to delete only mappings, title will remain in the list.
    def delete(self, request, job_title_id):
        if not job_title_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        job_title_object = JobTitle.objects.filter(id=job_title_id).first()
        if not job_title_object:
            return Response({'Error': 'Job Title Not Found'}, status=status.HTTP_400_BAD_REQUEST)
        JobTitleMapping.objects.filter(to_title=job_title_object).delete()
        JobTitleMapping.objects.filter(from_title=job_title_object).delete()
        return Response({"Message": "Mappings Deleted Successfully"}, status=status.HTTP_200_OK)
