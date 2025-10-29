from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from accounts.services import StartdateTokenAuthentication
from company.models import Location
from location.serializers import LocationSerializer, LocationWithUsersSerializer, AdminUpdateLocationSerializer
from job_posting.permissions import AdminPermission


class LocationsOfCompany(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def post(self, request, company_id):
        if request.data:
            request.data.update({'company_id': company_id})
            location_serializer = LocationSerializer(data=request.data)
            if location_serializer.is_valid():
                location_serializer.save()
                return Response(location_serializer.data, status=status.HTTP_200_OK)
            return Response(location_serializer.errors, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, company_id):
        locations = Location.objects.filter(company_id_id=company_id)
        locations_serializer = LocationSerializer(instance=locations, many=True)
        return Response(locations_serializer.data, status=status.HTTP_200_OK)


class SpecificLocationOfCompany(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)

    def get(self, request, company_id, location_id):
        location = Location.objects.filter(id=location_id).first()
        if not location:
            return Response({"Error": "Location Not Found"}, status=status.HTTP_404_NOT_FOUND)
        location_user_serializer = LocationWithUsersSerializer(instance=location)
        return Response(location_user_serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, company_id, location_id):
        location = Location.objects.filter(id=location_id).first()
        if not location:
            return Response({"Error": "Location Not Found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUpdateLocationSerializer(location, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"Message": "Location Updated Successfully"}, status=status.HTTP_200_OK)
        return Response({"Error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, company_id, location_id):
        location = Location.objects.filter(id=location_id).first()
        if not location:
            return Response({"Error": "Location Not Found"}, status=status.HTTP_404_NOT_FOUND)
        location.delete()
        return Response({"Message": "Location Deleted Successfully"}, status=status.HTTP_200_OK)
