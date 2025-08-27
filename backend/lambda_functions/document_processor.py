import json
import boto3
import base64
import io
from PIL import Image
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
textract_client = boto3.client('textract')
rekognition_client = boto3.client('rekognition')
s3_client = boto3.client('s3')

def crop_and_save_face_to_s3(image_bytes: bytes, bbox: Dict[str, float], session_id: str, scale: float = 1.2) -> str:
    """
    Crops a face from an image using a scaled bounding box and saves to S3.
    
    Args:
        image_bytes: Raw image bytes
        bbox: Bounding box from Rekognition {'Width', 'Height', 'Top', 'Left'}
        session_id: Unique session identifier
        scale: Factor to scale the bounding box by (e.g., 1.2 for 20% padding)
    
    Returns:
        S3 key of the saved cropped face image
    """
    try:
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        img_w, img_h = img.size

        # Original bounding box (normalized)
        box_w = bbox['Width']
        box_h = bbox['Height']
        box_l = bbox['Left']
        box_t = bbox['Top']

        # Calculate the new, scaled dimensions (normalized)
        new_w = box_w * scale
        new_h = box_h * scale

        # Calculate the adjustment needed to keep the box centered
        width_increase = new_w - box_w
        height_increase = new_h - box_h
        
        new_l = box_l - (width_increase / 2)
        new_t = box_t - (height_increase / 2)

        # Convert normalized coordinates to pixel coordinates for PIL
        # Also, ensure coordinates don't go out of the image bounds
        x1 = max(0, int(new_l * img_w))
        y1 = max(0, int(new_t * img_h))
        x2 = min(img_w, int((new_l + new_w) * img_w))
        y2 = min(img_h, int((new_t + new_h) * img_h))

        # Crop the image
        cropped_img = img.crop((x1, y1, x2, y2))
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        cropped_img.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        
        # Upload to S3
        bucket_name = 'your-kyc-bucket'  # Replace with your S3 bucket
        s3_key = f"faces/{session_id}/id_face.jpg"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=img_buffer.getvalue(),
            ContentType='image/jpeg'
        )
        
        logger.info(f"Successfully cropped face and saved to S3: {s3_key}")
        return s3_key
        
    except Exception as e:
        logger.error(f"Error cropping and saving face: {str(e)}")
        raise

def extract_document_fields(image_bytes: bytes) -> Dict[str, str]:
    """
    Extract document fields using AWS Textract.
    
    Args:
        image_bytes: Raw image bytes of the document
    
    Returns:
        Dictionary of extracted fields
    """
    try:
        # Call Textract analyze_id
        textract_response = textract_client.analyze_id(
            DocumentPages=[{'Bytes': image_bytes}]
        )
        
        # Extract document fields
        document_fields = textract_response['IdentityDocuments'][0]['IdentityDocumentFields']
        
        # Extract important fields
        extracted_fields = {}
        for field in document_fields:
            if field.get('ValueDetection', {}).get('Text'):
                field_type = field['Type']['Text']
                field_value = field['ValueDetection']['Text']
                extracted_fields[field_type] = field_value
        
        logger.info(f"Successfully extracted {len(extracted_fields)} fields from document")
        return extracted_fields
        
    except Exception as e:
        logger.error(f"Error extracting document fields: {str(e)}")
        raise

def detect_and_crop_face(image_bytes: bytes, session_id: str) -> Optional[str]:
    """
    Detect faces in the image and crop the primary face.
    
    Args:
        image_bytes: Raw image bytes
        session_id: Unique session identifier
    
    Returns:
        S3 key of the cropped face image, or None if no face detected
    """
    try:
        # Call Rekognition detect_faces
        rekognition_response = rekognition_client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL']
        )
        
        # Filter faces with high confidence
        high_confidence_faces = [
            face for face in rekognition_response['FaceDetails'] 
            if face['Confidence'] > 95
        ]
        
        if not high_confidence_faces:
            logger.warning("No high-confidence faces detected")
            return None
        
        # Use the first high-confidence face
        primary_face = high_confidence_faces[0]
        bbox = primary_face['BoundingBox']
        
        # Crop and save the face
        s3_key = crop_and_save_face_to_s3(image_bytes, bbox, session_id)
        return s3_key
        
    except Exception as e:
        logger.error(f"Error detecting and cropping face: {str(e)}")
        raise

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for document processing.
    
    Expected event structure:
    {
        "session_id": "unique-session-id",
        "image_data": "base64-encoded-image",
        "document_type": "passport" | "drivers-license" | "national-id"
    }
    """
    try:
        # Parse input
        session_id = event.get('session_id')
        image_data = event.get('image_data')
        document_type = event.get('document_type', 'passport')
        
                if not session_id or not image_data:
            return create_response(400, {
                'error': 'Missing required parameters: session_id and image_data'
            })
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Extract document fields
        document_fields = extract_document_fields(image_bytes)
        
        # Detect and crop face
        face_s3_key = detect_and_crop_face(image_bytes, session_id)
        
        # Prepare response
        response_data = {
            'session_id': session_id,
            'document_type': document_type,
            'extracted_fields': document_fields,
            'face_detected': face_s3_key is not None,
            'face_s3_key': face_s3_key,
            'status': 'PROCESSED'
        }
        
        # Store results in DynamoDB or S3 for later retrieval
        # This would be implemented based on your data storage strategy
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in document processor: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })
