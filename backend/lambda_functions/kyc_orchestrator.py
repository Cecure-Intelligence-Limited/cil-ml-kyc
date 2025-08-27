import json
import boto3
import uuid
from typing import Dict, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
lambda_client = boto3.client('lambda')

def invoke_lambda_function(function_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Invoke another Lambda function.
    
    Args:
        function_name: Name of the Lambda function to invoke
        payload: Payload to send to the function
    
    Returns:
        Response from the invoked function
    """
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        # Parse response
        response_payload = json.loads(response['Payload'].read())
        return response_payload
        
    except Exception as e:
        logger.error(f"Error invoking Lambda function {function_name}: {str(e)}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for KYC orchestration.
    
    Expected event structure:
    {
        "action": "start_kyc" | "process_document" | "complete_liveness" | "final_verification",
        "session_id": "unique-session-id" (optional for start_kyc),
        "image_data": "base64-encoded-image" (for process_document),
        "document_type": "passport" | "drivers-license" | "national-id",
        "liveness_session_id": "liveness-session-id" (for complete_liveness),
        "s3_bucket": "your-kyc-bucket"
    }
    """
    try:
        # Parse input
        action = event.get('action')
        s3_bucket = event.get('s3_bucket', 'your-kyc-bucket')
        
        if not action:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required parameter: action'
                })
            }
        
        if action == 'start_kyc':
            # Generate session ID
            session_id = event.get('session_id', str(uuid.uuid4()))
            
            # Create liveness session
            liveness_payload = {
                'action': 'create',
                'session_id': session_id,
                's3_bucket': s3_bucket,
                's3_key_prefix': 'liveness-sessions'
            }
            
            liveness_response = invoke_lambda_function('liveness-session-manager', liveness_payload)
            
            response_data = {
                'session_id': session_id,
                'liveness_session_id': liveness_response['body']['session_id'],
                'status': 'SESSION_CREATED',
                'message': 'KYC session started successfully'
            }
            
        elif action == 'process_document':
            session_id = event.get('session_id')
            image_data = event.get('image_data')
            document_type = event.get('document_type', 'passport')
            
            if not all([session_id, image_data]):
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Missing required parameters: session_id and image_data'
                    })
                }
            
            # Process document
            document_payload = {
                'session_id': session_id,
                'image_data': image_data,
                'document_type': document_type
            }
            
            document_response = invoke_lambda_function('document-processor', document_payload)
            
            response_data = {
                'session_id': session_id,
                'document_processing': json.loads(document_response['body']),
                'status': 'DOCUMENT_PROCESSED'
            }
            
        elif action == 'complete_liveness':
            session_id = event.get('session_id')
            liveness_session_id = event.get('liveness_session_id')
            
            if not all([session_id, liveness_session_id]):
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Missing required parameters: session_id and liveness_session_id'
                    })
                }
            
            # Get liveness results
            liveness_payload = {
                'action': 'get_results',
                'session_id': liveness_session_id
            }
            
            liveness_response = invoke_lambda_function('liveness-session-manager', liveness_payload)
            liveness_results = json.loads(liveness_response['body'])
            
            response_data = {
                'session_id': session_id,
                'liveness_results': liveness_results,
                'status': 'LIVENESS_COMPLETED'
            }
            
        elif action == 'final_verification':
            session_id = event.get('session_id')
            id_face_s3_key = event.get('id_face_s3_key')
            liveness_reference_s3_key = event.get('liveness_reference_s3_key')
            
            if not all([session_id, id_face_s3_key, liveness_reference_s3_key]):
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Missing required parameters: session_id, id_face_s3_key, liveness_reference_s3_key'
                    })
                }
            
            # Compare faces
            face_comparison_payload = {
                'session_id': session_id,
                'id_face_s3_key': id_face_s3_key,
                'liveness_reference_s3_key': liveness_reference_s3_key,
                's3_bucket': s3_bucket,
                'similarity_threshold': 95.0
            }
            
            face_comparison_response = invoke_lambda_function('face-comparison', face_comparison_payload)
            face_comparison_results = json.loads(face_comparison_response['body'])
            
            response_data = {
                'session_id': session_id,
                'face_comparison': face_comparison_results,
                'verification_passed': face_comparison_results['verification_passed'],
                'status': 'VERIFICATION_COMPLETED'
            }
            
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid action. Must be "start_kyc", "process_document", "complete_liveness", or "final_verification"'
                })
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        logger.error(f"Error in KYC orchestrator: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
