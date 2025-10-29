from rest_framework.views import APIView
from rest_framework.response import Response
from .services import training_data, push_training_data_queue, webhook_processing
from rest_framework import status
from accounts.services import StartdateTokenAuthentication
from django.core.paginator import Paginator
from job_posting.permissions import AdminPermission

# models imports
from model_training.serializers import ModelTrainingSerializer
from model_training.models import TrainedTitle


class ModelTrainingQueue(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)
    
    def post(self, request, job_posting_id):
        job_posting_id = job_posting_id
        response = training_data(job_posting_id)
        if response.get("Error"):
            return Response(response, status=status.HTTP_400_BAD_REQUEST)
        result = push_training_data_queue(response, job_posting_id)
        if result:
            trained_obj = TrainedTitle.objects.filter(job_posting_id_id=job_posting_id).first()
            trained_obj.status = "queued"
            trained_obj.save()
            message = {"Message": "Model training started successfully"}
            return Response(message, status=status.HTTP_200_OK)
        error_message = {"Error": "Failed to start model training. Please try again later."}
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


class ModelTrainingWebhhok(APIView):
    def post(self, request):
        try:
            data = request.data
            webhook_processing(data)
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"Error": f"Exception : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )


class ModelTraining(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (AdminPermission,)
    
    def get(self, request):
        page = request.query_params.get("page", 1)
        per_page = request.query_params.get("limit", 50)
        data = {}
        
        try:
            trained_title_obj = TrainedTitle.objects.select_related('job_posting_id__location_id__company_id').all().order_by("-updated_at")
            
            paginator = Paginator(trained_title_obj, per_page)
            trained_title_obj = paginator.get_page(page)
            serializer = ModelTrainingSerializer(instance=trained_title_obj, many=True)
            
            data = {
                "current_page": page,
                "per_page": per_page,
                "total_pages": paginator.num_pages,
                "total_count": paginator.count,
                "data": serializer.data,
            }
            
            return Response(data, content_type="application/json", status=status.HTTP_200_OK)

        except Exception as e:
            response = {"Error": f"Exception : {str(e)}"}
            return Response(
                response,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )

    def post(self, request):
        try:
            job_posting_id = request.data.get("job_posting_id")
            is_active_update = request.data.get("is_active", "")
            if is_active_update not in ["True", "False", "true", "false", True, False]:
                return Response(
                    {"Error": "Invalid status. Use 'True' or 'False'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if is_active_update in ["True",True,"true"]:
                TrainedTitle.objects.filter(is_active=True).update(is_active=False)

            obj = TrainedTitle.objects.get(job_posting_id=job_posting_id)
            obj.is_active = is_active_update
            obj.save()
            serializer = ModelTrainingSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except TrainedTitle.DoesNotExist:
            return Response(
                {"Error": "Job posting not found."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            response = {"Error": f"Exception : {str(e)}"}
            return Response(
                response,
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
            )
