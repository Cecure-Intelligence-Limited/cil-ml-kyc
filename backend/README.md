# KYC Backend - AWS Lambda Functions

This directory contains AWS Lambda functions for a complete KYC (Know Your Customer) verification system using AWS services.

## 🏗️ Architecture

The KYC system consists of 4 main Lambda functions:

1. **Document Processor** - Extracts data from ID documents using AWS Textract and Rekognition
2. **Liveness Session Manager** - Manages liveness detection sessions
3. **Face Comparison** - Compares ID face with liveness reference image
4. **KYC Orchestrator** - Coordinates the entire KYC verification flow

## 📁 Lambda Functions

### 1. `document_processor.py`
**Purpose**: Processes ID documents to extract text and detect/crop faces

**Input**:
```json
{
  "session_id": "unique-session-id",
  "image_data": "base64-encoded-image",
  "document_type": "passport"
}
```

**Output**:
```json
{
  "session_id": "unique-session-id",
  "document_type": "passport",
  "extracted_fields": {
    "FIRST_NAME": "TOLULOPE",
    "LAST_NAME": "ORINA",
    "DATE_OF_BIRTH": "12 SEP /SEPT 96",
    "DOCUMENT_NUMBER": "B00820003",
    "EXPIRATION_DATE": "13 APR /AVR 27"
  },
  "face_detected": true,
  "face_s3_key": "faces/session-id/id_face.jpg",
  "status": "PROCESSED"
}
```

### 2. `liveness_session_manager.py`
**Purpose**: Creates and manages liveness detection sessions

**Input**:
```json
{
  "action": "create",
  "session_id": "unique-session-id",
  "s3_bucket": "your-kyc-bucket",
  "s3_key_prefix": "liveness-sessions"
}
```

**Output**:
```json
{
  "session_id": "liveness-session-id",
  "status": "CREATED",
  "message": "Liveness session created successfully"
}
```

### 3. `face_comparison.py`
**Purpose**: Compares ID face with liveness reference image

**Input**:
```json
{
  "session_id": "unique-session-id",
  "id_face_s3_key": "faces/session-id/id_face.jpg",
  "liveness_reference_s3_key": "liveness-sessions/session-id/reference.jpg",
  "s3_bucket": "your-kyc-bucket",
  "similarity_threshold": 95.0
}
```

**Output**:
```json
{
  "session_id": "unique-session-id",
  "face_comparison": {
    "is_match": true,
    "similarity_score": 98.5,
    "face_matches": [...],
    "unmatched_faces": [],
    "source_image_face_count": 1,
    "target_image_face_count": 1
  },
  "verification_passed": true,
  "status": "COMPLETED"
}
```

### 4. `kyc_orchestrator.py`
**Purpose**: Orchestrates the entire KYC verification flow

**Actions**:
- `start_kyc` - Creates a new KYC session
- `process_document` - Processes uploaded document
- `complete_liveness` - Gets liveness results
- `final_verification` - Performs final face comparison

## 🚀 Deployment

### Prerequisites
1. AWS CLI configured
2. S3 bucket for storing images and results
3. IAM roles with appropriate permissions

### Required IAM Permissions

Each Lambda function needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeID",
        "rekognition:DetectFaces",
        "rekognition:CompareFaces",
        "rekognition:CreateFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
        "s3:GetObject",
        "s3:PutObject",
        "lambda:InvokeFunction"
      ],
      "Resource": "*"
    }
  ]
}
```

### Environment Variables

Set these environment variables for each Lambda function:

```bash
S3_BUCKET=your-kyc-bucket
SIMILARITY_THRESHOLD=95.0
```

### Deployment Steps

1. **Create deployment packages**:
```bash
# For each Lambda function
pip install -r requirements.txt -t package/
cp lambda_functions/function_name.py package/
cd package
zip -r ../function_name.zip .
```

2. **Deploy to AWS Lambda**:
```bash
aws lambda create-function \
  --function-name document-processor \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler document_processor.lambda_handler \
  --zip-file fileb://document_processor.zip \
  --timeout 60 \
  --memory-size 512
```

## 🔄 API Gateway Integration

Create API Gateway endpoints for each Lambda function:

```
POST /kyc/start-session
POST /kyc/process-document  
POST /kyc/complete-liveness
POST /kyc/final-verification
```

## 📊 Data Flow

1. **Frontend** → **API Gateway** → **KYC Orchestrator** → **Start KYC Session**
2. **Frontend** → **API Gateway** → **Document Processor** → **Extract Data & Face**
3. **Frontend** → **AWS RekognitionStreaming** → **Liveness Detection**
4. **Frontend** → **API Gateway** → **Liveness Session Manager** → **Get Results**
5. **Frontend** → **API Gateway** → **Face Comparison** → **Final Verification**

## 🔧 Configuration

### S3 Bucket Structure
```
your-kyc-bucket/
├── faces/
│   └── {session-id}/
│       └── id_face.jpg
└── liveness-sessions/
    └── {session-id}/
        ├── reference.jpg
        └── audit-images/
```

### Error Handling
All functions include comprehensive error handling and logging. Check CloudWatch logs for debugging.

## 🧪 Testing

Use the provided test events in the `test_events/` directory to test each Lambda function individually.

## 📝 Notes

- Replace `your-kyc-bucket` with your actual S3 bucket name
- Adjust similarity threshold based on your security requirements
- Consider implementing DynamoDB for session state management
- Add CloudWatch alarms for monitoring and alerting
