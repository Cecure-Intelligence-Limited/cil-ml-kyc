import json
import boto3
import base64
from typing import Dict, Any, Optional
import logging

# CORS Helper Functions (inline)
def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

def create_response(status_code: int, body: dict, cors_enabled: bool = True):
    response = {
        'statusCode': status_code,
        'body': json.dumps(body)
    }
    
    if cors_enabled:
        response['headers'] = get_cors_headers()
    
    return response

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
rekognition_client = boto3.client('rekognition')
s3_client = boto3.client('s3')

def get_image_from_s3(bucket: str, key: str) -> bytes:
    """
    Download image from S3.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
    
    Returns:
        Image bytes
    """
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        return response['Body'].read()
    except Exception as e:
        logger.error(f"Error downloading image from S3: {str(e)}")
        raise

def compare_faces(source_image_bytes: bytes, target_image_bytes: bytes, similarity_threshold: float = 95.0) -> Dict[str, Any]:
    """
    Compare two face images using AWS Rekognition.
    
    Args:
        source_image_bytes: Source image bytes (ID face)
        target_image_bytes: Target image bytes (Liveness reference)
        similarity_threshold: Minimum similarity threshold (0-100)
    
    Returns:
        Comparison results
    """
    try:
        response = rekognition_client.compare_faces(
            SourceImage={'Bytes': source_image_bytes},
            TargetImage={'Bytes': target_image_bytes},
            SimilarityThreshold=similarity_threshold
        )
        
        # Extract comparison results
        face_matches = response.get('FaceMatches', [])
        unmatched_faces = response.get('UnmatchedFaces', [])
        
        # Check if faces match
        is_match = len(face_matches) > 0
        similarity_score = face_matches[0]['Similarity'] if is_match else 0.0
        
        result = {
            'is_match': is_match,
            'similarity_score': similarity_score,
            'face_matches': face_matches,
            'unmatched_faces': unmatched_faces,
            'source_image_face_count': response.get('SourceImageFaceCount', 0),
            'target_image_face_count': len(face_matches) + len(unmatched_faces)
        }
        
        logger.info(f"Face comparison completed. Match: {is_match}, Score: {similarity_score}")
        return result
        
    except Exception as e:
        logger.error(f"Error comparing faces: {str(e)}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for face comparison.
    
    Expected event structure:
    {
        "session_id": "unique-session-id",
        "id_face_s3_key": "faces/session-id/id_face.jpg",
        "liveness_reference_s3_key": "liveness-sessions/session-id/reference.jpg",
        "s3_bucket": "your-kyc-bucket",
        "similarity_threshold": 95.0
    }
    """
    try:
        # Parse input
        session_id = event.get('session_id')
        id_face_s3_key = event.get('id_face_s3_key')
        liveness_reference_s3_key = event.get('liveness_reference_s3_key')
        s3_bucket = event.get('s3_bucket', 'your-kyc-bucket')
        similarity_threshold = event.get('similarity_threshold', 95.0)
        
        # Validate required parameters
        if not all([session_id, id_face_s3_key, liveness_reference_s3_key]):
            return create_response(400, {
                'error': 'Missing required parameters: session_id, id_face_s3_key, liveness_reference_s3_key'
            })
        
        # Download images from S3
        logger.info(f"Downloading ID face from S3: {id_face_s3_key}")
        id_face_bytes = get_image_from_s3(s3_bucket, id_face_s3_key)
        
        logger.info(f"Downloading liveness reference from S3: {liveness_reference_s3_key}")
        liveness_reference_bytes = get_image_from_s3(s3_bucket, liveness_reference_s3_key)
        
        # Compare faces
        comparison_result = compare_faces(
            id_face_bytes, 
            liveness_reference_bytes, 
            similarity_threshold
        )
        
        # Prepare response
        response_data = {
            'session_id': session_id,
            'face_comparison': comparison_result,
            'verification_passed': comparison_result['is_match'] and comparison_result['similarity_score'] >= similarity_threshold,
            'status': 'COMPLETED'
        }
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in face comparison: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
