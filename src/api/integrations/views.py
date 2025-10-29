import ast

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from uuid import uuid4
from accounts.services import StartdateTokenAuthentication
# Models
from integrations.models import IntegrationKey
# Serializers
from integrations.serializers import IntegrationCreateSerializer, IntegrationRetrieveSerializer
from job_posting.permissions import AdminPermission, EmployerSpecificObjectPermission
from .kms_encrypt_decrypt import encrypt_data_through_kms, decrypt_data_through_kms


class IntegrationListView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id):
        integration_type = request.query_params.get('type')
        integrations = IntegrationKey.objects.filter(company_id=company_id).order_by('-created_at')
        if integration_type:
            integrations = integrations.filter(type=integration_type)
        serializer = IntegrationRetrieveSerializer(instance=integrations, many=True)
        return Response(serializer.data, content_type='application/json')

    def post(self, request, company_id):
        data = request.data
        data.update({'company_id': company_id, 'key': f'sd_apik_{uuid4().hex}'})
        if request.user.role == 'employer':
            data.update({'type': 'poweredBy'})
        serializer = IntegrationCreateSerializer(data=data)
        credentials = data.get('credentials')
        if serializer.is_valid():
            try:
                instance = serializer.save()
                encrypted_data = encrypt_data_through_kms(credentials)
                if encrypted_data:
                    instance.credentials = encrypted_data
                    instance.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(e, status=status.HTTP_406_NOT_ACCEPTABLE)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IntegrationDetailView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id, id):
        integration = IntegrationKey.objects.filter(id=id).first()
        if not integration:
            return Response({"Error": "Integration Not Found"}, status=status.HTTP_404_NOT_FOUND)
        integration = IntegrationRetrieveSerializer(instance=integration, many=False)
        return Response(integration.data, content_type='application/json')

    def put(self, request, company_id, id):
        data = request.data
        integration = IntegrationKey.objects.filter(id=id, company_id=company_id).first()
        if not integration:
            return Response({"Error": "Integration Not Found"}, status=status.HTTP_404_NOT_FOUND)
        if 'credentials' in data:
            if data['credentials']:
                encrypted_data = encrypt_data_through_kms(str(data['credentials']))
                if not encrypted_data:
                    return Response({'Error': 'Error Occured While Encrypting the String'}, status=status.HTTP_400_BAD_REQUEST)
                integration.credentials = encrypted_data
        try:
            if data.get('type'):
                integration.type = data.get('type')
            if 'is_active' in data:
                integration.is_active = data['is_active']
            integration.save()
            return Response({'Message': 'Integration Updated Successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'Error': e}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, company_id, id):
        integration = IntegrationKey.objects.filter(id=id, company_id=company_id).first()
        if not integration:
            return Response({"Error": "Integration Not Found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            integration.delete()
            return Response({"Message": "Integration Deleted Successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(e, status=status.HTTP_400_BAD_REQUEST)


class CredentialsDetailView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (EmployerSpecificObjectPermission,)

    def get(self, request, company_id, id):
        integration = IntegrationKey.objects.filter(id=id, company_id=company_id).first()
        if not integration:
            return Response({"Error": "Integration Not Found"}, status=status.HTTP_404_NOT_FOUND)
        if integration.credentials:
            credentials = ast.literal_eval(integration.credentials)
            plain_text = decrypt_data_through_kms(credentials)
            if plain_text:
                context = {
                    'id': str(integration.id),
                    'credentials': plain_text
                }
                return Response(context, status=status.HTTP_200_OK)
        return Response({"Error": "Something Went Wrong"}, status=status.HTTP_400_BAD_REQUEST)
