from candidate.aws import client_s3
from company.models import KanbanBoard, Company, Location, Subscription
from job_posting.models import JobPostingCandidate
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from accounts.models import UserCredits


PROFILE_PICTURE_BUCKET = settings.AWS_PROFILE_PICTURE_STORAGE_BUCKET_NAME


def kanban_board_default_config(company_id):
    if not KanbanBoard.objects.filter(company_id_id=company_id).exists():
        kanban_board_stages = ["Sourced", "Revealed Candidates", "Applied", "In Progress", "Interview", "Reference Check", "Offer", "StartDate", "Rejected"]
        stage_order = 1
        for stage in kanban_board_stages:
            KanbanBoard.objects.create(company_id_id=company_id, stage_name=stage, order=stage_order)
            stage_order += 1
            
            
def update_kanban_board_config(request, company_id):
    company_obj = Company.objects.filter(id=company_id).first()
    context = None
    
    if not company_obj:
        context = {"message": "Company does not exist", "status_code": 400}
        return context
    
    data = request.data
    
    for config in data:
        id = config.get("stage_id")
        stage_name = config.get("stage_name")
        stage_order = config.get("stage_order")
        is_delete = config.get("is_delete", None)

        
        if is_delete and id:
            kanban_record = KanbanBoard.objects.get(id=id)
            if JobPostingCandidate.objects.filter(hiring_stage_id=kanban_record).exists():
                return {'message': f'Candidate Exists in {stage_name}', 'status_code': 405}
            
            delete_result = delete_kanban_config(id, stage_name, company_obj)
            print(delete_result)
            if not delete_result["success"]:
                context = {"message": delete_result["message"], "status_code": delete_result["status_code"]}
                return context
            
        elif id and is_delete is None:
            update_result = update_kanban_config(id,stage_name, stage_order, company_obj)
            if not update_result["success"]:
                context = {"message": update_result["message"], "status_code": update_result["status_code"]}
                return context
            
        elif id is None and is_delete is None:
            create_result = create_kanban_config(stage_name, stage_order, company_obj)
            if not create_result["success"]:
                context = {"message": create_result["message"], "status_code": create_result["status_code"]}
                return context

    return context

def delete_kanban_config(stage_id, stage_name, company_obj):
    try:
        KanbanBoard.objects.filter(id=stage_id, company_id=company_obj).delete()
        return {"success": True, "message": f"Stage '{stage_name}' deleted successfully", "status_code": 200}
    except Exception as e:
        return {"success": False, "message": str(e), "status_code": 403}

def update_kanban_config(stage_id, stage_name, index, company_obj):
    try:
        KanbanBoard.objects.filter(id=stage_id, company_id=company_obj).update(stage_name=stage_name, order=index)
        return {"success": True, "message": f"Stage '{stage_name}' updated successfully", "status_code": 200}
    except Exception as e:
        return {"success": False, "message": str(e), "status_code": 403}

def create_kanban_config(stage_name, index, company_obj):
    try:
        KanbanBoard.objects.create(stage_name=stage_name, order=index, company_id=company_obj)
        return {"success": True, "message": f"Stage '{stage_name}' created successfully", "status_code": 200}
    except Exception as e:
        return {"success": False, "message": str(e), "status_code": 403}
   

def full_service(params):
    company_id = params.get("company_id")
    if params.get("full_service"):
        try:
            company_obj = Company.objects.get(id=company_id)
            company_obj.subscription_type = "full_service"
            company_obj.save()
            kanban_board_default_config(company_obj.id)
            return {"message": "Full service subscription done!", "status_code":200}

        except Company.DoesNotExist:
            return {"message": " Company Not Found !", "status_code":404}
        
    else:
        try:
            company_obj = Company.objects.get(id=company_id)
            company_obj.subscription_type = None
            company_obj.save()
            return {"message": "Full service subscription undone!", "status_code":200}

        except Company.DoesNotExist:
            return {"message": " Company Not Found !", "status_code": 404}


def location_address_generalise(location):
    from candidate.services import address_correction
    location_data = {
        'address': location.address,
        'city': location.city,
        'state': location.state,
        'country': location.country
    }
    address = address_correction(location_data)

    if address:
        try:
            address_data = {
                'city': address.get('city'),
                'state': address.get('state'),
                'country': address.get('country'),
                'address': address.get('address'),
                'zip': address.get('zip')
            }
            # Using bulk update method so post_save signal doesn't call Amazon Location Service method in loop
            Location.objects.filter(id=location.id).update(**address_data)
        except:
            pass


def upload_company_picture(file, company):
    allowed_extensions = ['jpg', 'jpeg', 'png']
    file_extension = file.name.split('.')[-1].lower()
    if file_extension not in allowed_extensions:
        return Response({"Error": "Invalid file extension. Must be a 'jpg' or 'jpeg' or 'png' "},
                        status=status.HTTP_406_NOT_ACCEPTABLE)
    max_file_size = 1 * 1024 * 1024
    if file.size > max_file_size:
        return Response({"Error": "Invalid file size. Must be Less Than 1MB"}, status=status.HTTP_406_NOT_ACCEPTABLE)
    file_key = f'companies/{str(company.id)}'
    response = client_s3.put_object(
        Bucket=PROFILE_PICTURE_BUCKET,
        Key=file_key,
        Body=file,
        ContentType=file_extension
    )
    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
        company.logo = f'https://startdate-images-1.s3.us-west-1.amazonaws.com/{file_key}'
        company.save()

        return Response({'logo': company.logo}, status=status.HTTP_200_OK)
