import json
import boto3
import uuid
from typing import Dict, Any
import logging
from cors_helper import create_response

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
rekognition_client = boto3.client('rekognition')

def create_liveness_session(session_id: str, s3_bucket: str, s3_key_prefix: str) -> Dict[str, Any]:
    """
    Create a new liveness detection session.
    
    Args:
        session_id: Unique session identifier
        s3_bucket: S3 bucket for storing liveness results
        s3_key_prefix: S3 key prefix for organizing results
    
    Returns:
        Session creation response
    """
    try:
        response = rekognition_client.create_face_liveness_session(
            Settings={
                'OutputConfig': {
                    'S3Bucket': s3_bucket,
                    'S3KeyPrefix': f"{s3_key_prefix}/{session_id}/"
                },
                'AuditImagesLimit': 5,
                'ChallengePreferences': [
                    {
                        'Type': 'FaceMovementAndLightChallenge',
                        'Versions': {
                            'Minimum': '1.0',
                            'Maximum': '1.0'
                        }
                    }
                ]
            },
            ClientRequestToken=session_id
        )
        
        logger.info(f"Created liveness session: {response['SessionId']}")
        return response
        
    except Exception as e:
        logger.error(f"Error creating liveness session: {str(e)}")
        raise

def get_liveness_session_results(session_id: str) -> Dict[str, Any]:
    """
    Get the results of a liveness detection session.
    
    Args:
        session_id: The session ID to get results for
    
    Returns:
        Liveness session results
    """
    try:
        response = rekognition_client.get_face_liveness_session_results(
            SessionId=session_id
        )
        
        logger.info(f"Retrieved liveness results for session: {session_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting liveness session results: {str(e)}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for liveness session management.
    
    Expected event structure:
    {
        "action": "create" | "get_results",
        "session_id": "unique-session-id" (optional for create),
        "s3_bucket": "your-kyc-bucket",
        "s3_key_prefix": "liveness-sessions"
    }
    """
    try:
        # Parse input
        action = event.get('action')
        s3_bucket = event.get('s3_bucket', 'your-kyc-bucket')
        s3_key_prefix = event.get('s3_key_prefix', 'liveness-sessions')
        
        if not action:
            return create_response(400, {
                'error': 'Missing required parameter: action'
            })
        
        if action == 'create':
            # Generate session ID if not provided
            session_id = event.get('session_id', str(uuid.uuid4()))
            
            # Create liveness session
            session_response = create_liveness_session(session_id, s3_bucket, s3_key_prefix)
            
            response_data = {
                'session_id': session_response['SessionId'],
                'status': 'CREATED',
                'message': 'Liveness session created successfully'
            }
            
        elif action == 'get_results':
            session_id = event.get('session_id')
            
            if not session_id:
                return create_response(400, {
                    'error': 'Missing required parameter: session_id for get_results action'
                })
            
            # Get liveness session results
            results = get_liveness_session_results(session_id)
            
            response_data = {
                'session_id': results['SessionId'],
                'status': results['Status'],
                'confidence': results.get('Confidence'),
                'reference_image': results.get('ReferenceImage'),
                'audit_images': results.get('AuditImages', []),
                'challenge': results.get('Challenge')
            }
            
        else:
            return create_response(400, {
                'error': 'Invalid action. Must be "create" or "get_results"'
            })
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in liveness session manager: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
