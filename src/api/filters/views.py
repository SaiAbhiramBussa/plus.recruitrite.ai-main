from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.services import StartdateTokenAuthentication
from job_posting.permissions import JobSeekerSpecificObjectPermission
from filters.serializers import FilterSerializer, FilterReadSerializer
from filters.models import *
from rest_framework import status


class Filters(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, candidate_id):
        filters = Filter.objects.filter(candidate_id_id=candidate_id).order_by('-created_at')
        if len(filters) > 0:
            serialize_data = FilterSerializer(instance=filters, many=True)
            return Response(serialize_data.data, content_type="application/json")
        return Response([], content_type="application/json")

    def post(self, request, candidate_id):
        job_filter = {
            "content": request.data,
            "candidate_id": candidate_id,
            "created_by_id":  request.user.id
        }
        job_filter = FilterSerializer(data=job_filter)
        if job_filter.is_valid():
            job_filter.save()
            return Response(job_filter.data, status=status.HTTP_201_CREATED, content_type="application/json")
        return Response(job_filter.errors, content_type="application/json")


class FiltersById(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (JobSeekerSpecificObjectPermission,)

    def get(self, request, candidate_id, filter_id):
        job_filter = Filter.objects.filter(candidate_id=candidate_id, id=filter_id).first()
        if job_filter:
            job_filter = FilterReadSerializer(instance=job_filter)
            return Response(job_filter.data, status=status.HTTP_200_OK, content_type="application/json")
        return Response({"Message": "Filter not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, candidate_id, filter_id):
        job_filter = Filter.objects.filter(candidate_id=candidate_id, id=filter_id).first()
        if job_filter:
            job_filter = {
                "content": request.data,
                "candidate_id": candidate_id,
                "created_by_id": request.user.id
            }
            job_filter = FilterSerializer(data=job_filter)
            if job_filter.is_valid():
                job_filter.save()
                return Response(job_filter.data, status=status.HTTP_200_OK, content_type="application/json")
            return Response(job_filter.errors, status=status.HTTP_400_BAD_REQUEST, content_type="application/json")
        return Response({"Error": "Filter not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, candidate_id, filter_id):
        job_filter = Filter.objects.filter(candidate_id=candidate_id, id=filter_id).first()
        if job_filter:
            job_filter.delete()
            return Response({"Message": "Filter Deleted Successfully"}, status=status.HTTP_200_OK)
        return Response({"Error": "Filter not found"}, status=status.HTTP_404_NOT_FOUND)
