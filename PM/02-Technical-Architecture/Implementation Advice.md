# AWS Low-Level Resource Architecture (Comprehensive Detail)

---

## 1. API Gateway: “KycApi”

**Type & Deployment**  
- Regional REST API, deployed to stage `prod`  
- Hosted in `us-east-1`; multi-AZ SLA 99.95%  

**Endpoints & Methods**  
| Path                   | Method | Integration                        | Purpose                             |
|------------------------|--------|------------------------------------|-------------------------------------|
| POST /v1/upload-id     | POST   | Lambda proxy → IDUploadLambda      | Ingest ID image                     |
| POST /v1/start-liveness| POST   | Lambda proxy → LivenessOrchestratorLambda | Initiate liveness challenges      |
| POST /v1/submit-frame  | POST   | Lambda proxy → LivenessOrchestratorLambda | Upload live-capture frames       |
| GET  /v1/verify        | GET    | Lambda proxy → LivenessOrchestratorLambda | Poll for final verification result |

**Security**  
- Authorizer: Cognito User Pool (JWT) with token introspection  
- Fallback: API Key + Usage Plan (10 000 calls/day, per-key throttling 100 RPS)  
- AWS WAF ACL:  
  - Block bad bots, SQLi, XSS, IP reputation lists  
  - Rate-based rule: > 1 000 requests/min → block  

**Throttling & Quotas**  
- Global defaults: 100 RPS, 200 burst per method  
- Usage-plan overrides for partners binding API keys  

**Logging & Metrics**  
- Access logs in JSON: `$context.requestId`, `$context.identity.sourceIp`, `$context.error.message`  
- Latency & error counts via built-in `AWS/ApiGateway` metrics  

**CORS & Domains**  
- CORS headers enabled for `https://*.example.com`  
- Custom Domain: `kyc-api.example.com` with ACM TLS certificate  

---

## 2. Lambda Functions

### 2.1 IDUploadLambda  
- **Runtime**: Node.js 18.x  
- **Memory/Timeout**: 512 MB / 15 s  
- **Reserved Concurrency**: 50  
- **Environment Variables**:  
  - `S3_BUCKET_ID_UPLOADS`  
  - `KMS_KEY_ALIAS`  
  - `PARAMETER_STORE_PATH`  
- **Dependencies**: `@aws-sdk/*`, `sharp`, `multer`  
- **Trigger**: API Gateway POST /v1/upload-id  
- **Responsibilities**:  
  - Validate MIME (JPEG/PNG), size ≤ 5 MB, dimensions ≥ 600×400px  
  - Generate `verificationId` (UUID v4)  
  - Encrypt & upload to S3 (`kyc-id-uploads/${verificationId}.jpg`) using KMS data key  
  - Return JSON `{ verificationId, expiry }`  
- **Error Handling**:  
  - 3× exponential backoff retries on S3 5xx  
  - DLQ: SQS queue `dlq-idupload`; alerts to `KYC-Warnings` SNS  
- **Logging**:  
  - Structured JSON `{ requestId, step, status, errorCode }`  

### 2.2 LivenessOrchestratorLambda  
- **Runtime**: Python 3.9  
- **Memory/Timeout**: 1 024 MB / 30 s  
- **Reserved Concurrency**: 100  
- **Environment Variables**:  
  - `S3_BUCKET_LIVE_FRAMES`  
  - `DDB_LIVENESS_TABLE`  
  - `DDB_AUDIT_TABLE`  
  - `REKOGNITION_REGION`  
- **Trigger**: API Gateway (start, submit-frame, verify)  
- **Responsibilities**:  
  - Generate randomized gesture sequence; store in DynamoDB `LivenessSessions` (TTL 15 min)  
  - Upload each frame to S3 (`kyc-live-frames/${verificationId}/${frameId}.jpg`)  
  - On final frame, batch-call Rekognition `CompareFaces`, compute average similarity  
  - Write audit record in `KycAuditLog` (`PASS`/`FAIL`/`ERROR`)  
- **Error Handling**:  
  - Rekognition throttling: 3× backoff (100 ms → 1 s)  
  - Write `ERROR` status on persistent failure; alert `KYC-Critical` SNS  
- **Metrics**:  
  - `LivenessStarted`, `LivenessCompleted`, `MatchSuccess`, `MatchFailure`  

### 2.3 OCRExtractionLambda  
- **Runtime**: Python 3.9  
- **Memory/Timeout**: 1 024 MB / 60 s  
- **Reserved Concurrency**: On-demand  
- **Environment Variables**:  
  - `S3_BUCKET_OCR_RAW`  
  - `DDB_OCR_TABLE`  
- **Trigger**: S3 ObjectCreated event on `kyc-id-uploads` (suffix `.jpg`, `.png`)  
- **Responsibilities**:  
  - Invoke Textract `AnalyzeDocument` with `FEATURE_TYPES: [“TABLES”,“FORMS”]`  
  - Store raw JSON in S3 `kyc-ocr-raw/{verificationId}/{timestamp}.json`  
  - Parse `Name`, `DateOfBirth`, `DocumentNumber`; normalize/validate via regex  
  - Upsert DynamoDB `KycOcrData` `PutItem` `{ verificationId, fields, processedAt, expiresAt }`  
- **Error Handling**:  
  - DLQ: SQS `dlq-ocr` for parsing failures  
  - Retry on Textract `ThrottlingException` up to 5× with jitter  

### 2.4 SanctionsScreeningLambda  
- **Runtime**: Node.js 18.x  
- **Memory/Timeout**: 512 MB / 10 s  
- **Reserved Concurrency**: On-demand  
- **Environment Variables**:  
  - `DDB_AUDIT_TABLE`  
  - `SECRET_ARN_SCREENING_API`  
- **Trigger**: DynamoDB Stream (NEW_IMAGE) on `KycOcrData`  
- **Responsibilities**:  
  - Extract PII from stream record; fetch API key from Secrets Manager  
  - Call ComplyAdvantage `POST /v1/screen` with `{ name, dob }`  
  - Parse list matches (OFAC/UN/EU) → update `KycAuditLog` (`sanctionsStatus`, `matches`, `screenedAt`)  
- **Error Handling**:  
  - HTTP 5xx: 3× retry, then flag `sanctionsStatus = PENDING`  
  - Network timeouts: alert `SanctionsErrors` metric  

---

## 3. S3 Buckets

| Bucket               | Purpose                         | Encryption            | Versioning | Lifecycle                                        | Access Policy                        |
|----------------------|---------------------------------|-----------------------|------------|--------------------------------------------------|--------------------------------------|
| kyc-id-uploads       | Raw ID images                   | SSE-KMS (`alias/kyc-key`) | Enabled    | → Glacier 180 d; delete after 365 d                | Deny public, allow `lambda-role-id-upload` |
| kyc-live-frames      | Liveness capture frames         | SSE-KMS               | Disabled   | delete after 7 d                                  | Allow only `lambda-role-liveness`    |
| kyc-ocr-raw          | Textract JSON artifacts         | SSE-KMS               | Disabled   | → Glacier 30 d; delete after 90 d                 | Allow only `lambda-role-ocr`         |
| kyc-s3-access-logs   | S3 access logs                  | SSE-KMS               | Disabled   | retain 90 d                                       | AWS Log Delivery role                |

---

## 4. DynamoDB Tables

| Table Name          | Keys                              | Encryption            | TTL Field    | Streams           | Capacity Mode |
|---------------------|-----------------------------------|-----------------------|--------------|-------------------|---------------|
| KycAuditLog         | PK: `verificationId`<br/>SK: `timestamp` | SSE-KMS (`alias/kyc-key`) | `expiresAt`  | Disabled          | On-Demand     |
| KycOcrData          | PK: `verificationId`              | SSE-KMS               | `expiresAt`  | NEW_IMAGE         | On-Demand     |
| LivenessSessions    | PK: `sessionId`                   | SSE-KMS               | `expiresAt`  | Disabled          | On-Demand     |

- **Indexes**: No GSI initially; optional GSI on `userId` if user-centric queries required  
- **Auto Scaling**: On-demand mode removes need for manual RCUs/WCUs management

---

## 5. AWS KMS: Customer-Managed Key

- **Alias**: `alias/kyc-key`  
- **Purpose**: Encrypt S3 objects, DynamoDB at-rest encryption  
- **Key Policy**:  
  - Principals: All four Lambda roles  
  - Actions: `Encrypt`, `Decrypt`, `GenerateDataKey*`  
- **Rotation**: Automated annual rotation  

---

## 6. AWS Secrets Manager

- **Secret ARN**: `arn:aws:secretsmanager:us-east-1:123456789012:secret:/kyc/prod/screening-api-key`  
- **Contents**: JSON `{ "apiKey": "VALUE" }`  
- **Rotation**: Manual or Lambda-based every 180 days  
- **Access**: `secretsmanager:GetSecretValue` for `lambda-role-sanctions`  

---

## 7. IAM Roles & Policies

### Role: `lambda-role-id-upload`  
- Actions:  
  - `s3:PutObject` on `arn:aws:s3:::kyc-id-uploads/*`  
  - `kms:Encrypt`, `kms:GenerateDataKey` on key alias/kyc-key  

### Role: `lambda-role-liveness`  
- Actions:  
  - `s3:GetObject` on `kyc-id-uploads/*`, `kyc-live-frames/*`  
  - `rekognition:CompareFaces`  
  - `dynamodb:PutItem`, `UpdateItem`, `GetItem` on `LivenessSessions`, `KycAuditLog`  

### Role: `lambda-role-ocr`  
- Actions:  
  - `s3:GetObject` on `kyc-id-uploads/*`  
  - `s3:PutObject` on `kyc-ocr-raw/*`  
  - `textract:AnalyzeDocument`  
  - `dynamodb:PutItem` on `KycOcrData`  

### Role: `lambda-role-sanctions`  
- Actions:  
  - `dynamodb:UpdateItem`, `GetItem` on `KycAuditLog`  
  - `secretsmanager:GetSecretValue` on `/kyc/prod/screening-api-key`  

_All roles trust `lambda.amazonaws.com` principal only._

---

## 8. Event Sources & Data Flows

- **S3 → OCRExtractionLambda**  
  - Event: `s3:ObjectCreated:*`  
  - Filter: suffix `.jpg` or `.png`  
  - Destination: OCRExtractionLambda

- **DynamoDB Stream → SanctionsScreeningLambda**  
  - Source: `KycOcrData` table stream ARN  
  - Filter: `eventName == "INSERT"`  
  - Batch Size: 5, Parallelization Factor: 2  

- **API Gateway → Lambdas**  
  - Direct proxy integration; mapping template passes entire request context  

---

## 9. Observability & Monitoring Resources

- **CloudWatch Log Groups** (30 d retention)  
  - `/aws/lambda/IDUploadLambda`  
  - `/aws/lambda/LivenessOrchestratorLambda`  
  - `/aws/lambda/OCRExtractionLambda`  
  - `/aws/lambda/SanctionsScreeningLambda`

- **Metric Filters**  
  - Pattern: `"status":"ERROR"` → Metric Name: `KycErrors`  
  - Pattern: `"Timed out"` → Metric Name: `LambdaTimeouts`  

- **Dashboards**  
  1. **KYC Overview**: total requests, pass/fail rates, sanctions hits  
  2. **Performance**: P50/P90/P99 latency per endpoint, DynamoDB latency  
  3. **Error Trends**: UploadErrors, LivenessTimeouts, OCRErrors, SanctionsErrors  

- **Alarms & SNS**  
  | Alarm                    | Condition                              | SNS Topic           |
  |--------------------------|----------------------------------------|---------------------|
  | High Error Rate         | `KycErrors / TotalRequests > 5%`      | `KYC-Warnings`      |
  | Liveness Timeout Spike   | `Sum(LivenessTimeouts) > 10 in 5 min` | `KYC-Critical`      |
  | P90 Latency Breach       | `APIGateway P90 > 2 s`                | `KYC-Critical`      |

---

## 10. AWS Systems Manager Parameter Store

- **Path**: `/kyc/{env}/config`  
- **Parameters**:  
  - `uploadApiUrl`  
  - `livenessApiUrl`  
  - `verifyApiUrl`  
  - `s3Buckets` (JSON map of bucket names)  
- **Access**: `ssm:GetParameters` granted to all Lambda roles  

---

## 11. Resource Tagging & Cost Allocation

- **Required Tags** on all resources:  
  - `Project=KYC`  
  - `Environment=Dev|Staging|Prod`  
  - `Owner=TeamKYC`  
  - `CostCenter=12345`  
- **AWS Config Rule**: Check for untagged resources; notify DevOps channel if any exist  

---

This detailed resource architecture ensures each service is tightly scoped, secure, observable, and maintainable—directly matching our nine technical workstreams.
