# IAM Roles and Least-Privilege Policies

With networking controls out of scope, our next priority is locking down permissions. We’ll define three core roles—one per service—with the minimum AWS actions and resources each needs.

---

## 1. Role: IDUploadServiceRole

### Purpose  
Accept and store ID images via `/upload-id`.

### Trust Policy  
Allows API Gateway (or Lambda invoking from API Gateway) to assume this role.

### Permissions Policy (JSON snippet)  
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutAndGetOnUploadsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::kyc-id-uploads/*"
    }
  ]
}
```

---

## 2. Role: LivenessOrchestratorRole

### Purpose  
Drive the liveness flow, collect frames, invoke face matching, write logs.

### Trust Policy  
Lambda service principal.

### Permissions Policy  
- S3 read access to both ID uploads and live-frames buckets  
- Rekognition CompareFaces  
- DynamoDB PutItem  

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadSourceImages",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::kyc-id-uploads/*",
        "arn:aws:s3:::kyc-live-frames/*"
      ]
    },
    {
      "Sid": "InvokeRekognition",
      "Effect": "Allow",
      "Action": ["rekognition:CompareFaces"],
      "Resource": "*"
    },
    {
      "Sid": "WriteAuditLogs",
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem"],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/KycAuditLog"
    }
  ]
}
```

---

## 3. Role: RekognitionServiceRole

### Purpose  
(Optional) If you abstract Rekognition calls into a dedicated service

### Permissions Policy  
Only Rekognition and minimal logging:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CompareFacesOnly",
      "Effect": "Allow",
      "Action": ["rekognition:CompareFaces"],
      "Resource": "*"
    },
    {
      "Sid": "WriteToCloudWatch",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:*"
    }
  ]
}
```

---

# Next Focus

- Draft detailed **test scenarios** (positive/negative edge cases)  
- Define **error-handling flows** and retries  
- Plan **monitoring & alerting** with CloudWatch metrics and SNS notifications  

Which area would you like to tackle first?
