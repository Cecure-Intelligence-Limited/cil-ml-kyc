import json

def get_cors_headers():
    """
    Returns standard CORS headers for Lambda responses.
    
    Returns:
        dict: CORS headers dictionary
    """
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

def create_response(status_code: int, body: dict, cors_enabled: bool = True):
    """
    Creates a standardized Lambda response with optional CORS headers.
    
    Args:
        status_code: HTTP status code
        body: Response body dictionary
        cors_enabled: Whether to include CORS headers
    
    Returns:
        dict: Lambda response with statusCode, headers, and body
    """
    response = {
        'statusCode': status_code,
        'body': json.dumps(body)
    }
    
    if cors_enabled:
        response['headers'] = get_cors_headers()
    
    return response
