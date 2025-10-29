import boto3
import botocore
from django.conf import settings
import requests

s3 = boto3.resource(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)


def read_excel_file(key):
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    obj = s3.Object(bucket, key)
    file_object = obj.get()['Body'].read()
    return file_object


client_s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

client_loc = boto3.client(
    'location',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name='us-east-1',
)


def upload_to_aws(local_file, bucket, file_name):    
    try:
        response = client_s3.put_object(
            Bucket=bucket,
            Key=file_name,
            Body=local_file,
        )
        return response
    except Exception as Argument:
        print('This is the Argument\n', Argument)
    

def get_presigned_url(bucket_name, file_key, expiration):
    response = client_s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket_name,
            'Key': file_key
        },
        ExpiresIn=expiration
    )
    return response


def upload_image_from_link(bucket_name, s3_key, image_url):
    response = requests.get(image_url)
    content_type = response.headers.get('content-type')

    result = client_s3.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=requests.get(image_url).content,
        ContentType=content_type
    )
    return result


def check_location_through_amazon_location(query):
    try:
        result = client_loc.search_place_index_for_text(
            IndexName='StartDateAddress',
            Text=query)
        return result['Results'][0]
    except:
        return None
