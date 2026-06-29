import boto3, json
from botocore.config import Config

class AwsClient:
    __bedrock: boto3 = None

    AWS_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0'
    AWS_US_REGION = 'us-east-1'
    AWS_RESPONSE_MAX_TOKENS_CV_REVIEW = 5000

    @staticmethod
    def get_or_create_bedrock_client():
        if not AwsClient.__bedrock:
            AwsClient.__bedrock = boto3.client('bedrock-runtime', config=Config(
                region_name = AwsClient.AWS_US_REGION,
                read_timeout = 300
            ))
        
        return AwsClient.__bedrock

    @staticmethod
    def converse(messages):
        bedrock = AwsClient.get_or_create_bedrock_client()
        if not bedrock:
            print("Bedrock client not correctly initialized...")
            return

        response = bedrock.converse(
            messages=messages,
            modelId=AwsClient.AWS_MODEL_ID,
            inferenceConfig={
                "maxTokens": AwsClient.AWS_RESPONSE_MAX_TOKENS_CV_REVIEW,
                "temperature": 0.2
            }
        )

        response = response['output']['message']['content'][0]['text']

        return response    

