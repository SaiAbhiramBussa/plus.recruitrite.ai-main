import boto3
from decouple import config
from startdate import settings

KMS_KEY_ID = config("KMS_ACCESS_KEY_ID")

kms_client = boto3.client('kms', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                          aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY, region_name="us-west-1")


def encrypt_data_through_kms(plain_text):
    try:
        if not plain_text:
            return None
        response = kms_client.encrypt(
            KeyId=KMS_KEY_ID,
            Plaintext=plain_text
        )
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            return response['CiphertextBlob']
    except Exception as e:
        print(e)
        return None


def decrypt_data_through_kms(encrypted_text):
    try:
        if not encrypted_text:
            return None
        response = kms_client.decrypt(
            KeyId=KMS_KEY_ID,
            CiphertextBlob=encrypted_text
        )
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            plain_text = response['Plaintext'].decode('utf-8')
            return plain_text
    except Exception as e:
        print(e)
        return None
