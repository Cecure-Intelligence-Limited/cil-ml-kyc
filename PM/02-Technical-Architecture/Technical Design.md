# Enhanced Technical Design with Detailed Specifications

---

## 1. Detailed Architecture Diagram

```text
┌─────────────────────────┐           ┌───────────────────────┐
│  Web SPA (React/Vue)   │ — POST /v1/upload-id →│ API Gateway (REST) │
└─────────────────────────┘           └───────────────────────┘
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │ IDUploadLambda     │
                                       │ (Node.js 18.x)     │
                                       └────────────────────┘
                                                  │
       ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
       ▼                                          ▼                                          ▼
┌───────────────┐                          ┌──────────────┐                           ┌───────────────────┐
│ S3: id-uploads│                          │ DynamoDB:    │                           │ CloudWatch Logs   │
│  Bucket       │                          │ KycOcrData   │                           │ & Metrics         │
└───────────────┘                          └──────────────┘                           └───────────────────┘
       │                                          │                                          ▲
       ▼                                          ▼                                          │
┌───────────────┐                          ┌──────────────┐                           ┌───────────────────┐
│ OCRExtract    │ —──> Textract Analyze    │ DynamoDB     │ — Stream → SanctionsScreeningLambda │ SNS Alarms     │
│ Lambda        │      Document API       │ Stream       │                           └───────────────────┘
└───────────────┘                          └──────────────┘
       │                                          │
       ▼                                          ▼
┌───────────────┐                          ┌───────────────────┐
│ S3: ocr-raw   │                          │ SanctionsScreen   │
│ Bucket        │                          │ Lambda            │
└───────────────┘                          └───────────────────┘
```

---

## 2. Workstream Breakdown

### 2.1 Environment & Infrastructure (Workstream 1)

- Define Terraform modules per service:
  - `module.s3` (buckets with versioning, lifecycle rules)
  - `module.dynamodb` (on-demand mode, TTL on `KycOcrData`)
  - `module.lambda` (shared IAM roles, environment variables, VPC config)
  - `module.apigateway` (stages, WAF integration, throttling)
- Parameterize via Terragrunt for `dev` / `staging` / `prod`.
- KMS keys:
  - `alias/kyc-id-key` for S3 encryption
  - Rotate every 30 days (automatic key rotation)

### 2.2 Core ID Upload Service (Workstream 2)

- **API Definition (`upload-id`):**
  ```yaml
  POST /v1/upload-id
  Request:
    Headers:
      Authorization: Bearer <JWT>
    Body (multipart/form-data):
      file: image/jpeg/png (max 5 MB)
      metadata: { verificationId: string }
  Response:
    200 OK { verificationId, s3Key }
    400 BadRequest
    413 PayloadTooLarge
  ```
- **Lambda (Node.js):**
  - Dependencies: `multer`, `aws-sdk v3`, `sharp` (image validation/resizing)
  - Environment variables:
    - `S3_BUCKET_ID_UPLOADS`
    - `KMS_KEY_ID`
  - Error handling:
    - Validate MIME type, dimension (≥600×400px)
    - On S3 failure: retry 3× with exponential backoff
    - Dead-letter queue (SQS) for poison messages

### 2.3 Frontend MVP Web App (Workstream 3)

- Components:
  - **IDUploader.vue** / **ReactUploader.jsx**
    - Live preview, drag-&-drop, progress bar
  - **LivenessCheck** widget:
    - Uses WebRTC to capture frames
    - Integrates Rekognition JS SDK for face detection
- Testing:
  - Jest for unit
  - Cypress for E2E:
    - Scenario: valid ID upload → OCR fields populated → liveness pass
    - Mock API Gateway via `msw`

### 2.4 Liveness Orchestration (Workstream 4)

- **API Endpoints:**
  - `POST /v1/start-liveness` → generate 3 random gestures  
    Response: `{ sessionId, gestures: ['smile','turn-left','blink'] }`
  - `POST /v1/submit-frame` → `{ sessionId, frameBase64, sequence }` stored in S3
  - `GET /v1/verify` → polls DynamoDB for result
- **Orchestrator Lambda:**
  - State machine in DynamoDB:  
    Table: `LivenessSessions`  
    Attributes: `sessionId (PK)`, `userId`, `gestures[]`, `submittedCount`, `status`
  - On last frame:
    - Trigger face comparison:
      - Rekognition CompareFaces (live vs. ID img)
      - Aggregate similarity scores ≥90% pass
    - Write result `{ sessionId, pass: bool, score }` to `KycAuditLog`

### 2.5 OCR Extraction Pipeline (Workstream 5)

- **OCR Trigger:**
  - S3 `ObjectCreated` → EventBridge rule → `OCRExtractionLambda`
- **Lambda Logic:**
  - Call Textract `AnalyzeDocument` with features: `TABLES`, `FORMS`
  - Store raw JSON in `ocr-raw/verificationId/timestamp.json`
  - Parse out fields:  
    - `fullName`, `dob`, `documentNumber`
  - Write item to DynamoDB `KycOcrData`:
    | Attribute        | Type    | Notes                        |
    |------------------|---------|------------------------------|
    | verificationId   | S (PK)  | Partition key                |
    | extractedFields  | M       | Map of field → value         |
    | processedAt      | N       | Epoch millis                 |
    | ocrRawS3Key      | S       | Path to raw JSON             |

### 2.6 Sanctions Screening (Workstream 6)

- **DynamoDB Stream → Lambda:**
  - Filter: only `INSERT` events
  - Call third-party HTTP API:
    - Retries up to 3× on 5xx with jitter
    - Timeout: 2 s
  - Write to `KycAuditLog`:
    | Attribute        | Type  | Description                        |
    |------------------|-------|------------------------------------|
    | verificationId   | S     | PK                                 |
    | sanctionsStatus  | S     | “CLEAR” / “HIT” / “PENDING”        |
    | matchedEntity    | S     | if HIT                             |
    | screenedAt       | N     | timestamp                          |

### 2.7 Frontend Packaging (Workstream 7)

- Publish as scoped npm package `@company/kyc-widget`
- Expose props:
  - `uploadEndpoint`, `livenessEndpoint`, `themeConfig`
  - Callbacks: `onComplete`, `onError`
- Storybook stories:
  - “Default,” “DarkMode,” “GestureFailure,” “OCR Failure”

### 2.8 Security & Compliance (Workstream 8)

| Resource               | IAM Actions                              | Principal             |
|------------------------|------------------------------------------|-----------------------|
| IDUploadLambda         | `s3:PutObject`, `kms:Encrypt`            | `lambda-role-id-upload`|
| OCRExtractionLambda    | `s3:GetObject`, `textract:*`, `dynamodb:PutItem` | `lambda-role-ocr`      |
| SanctionsScreeningLambda | `dynamodb:UpdateItem`, `secretsmanager:GetSecretValue` | `lambda-role-sanctions`|
| API Gateway            | `execute-api:Invoke`                     | Authenticated Users   |

- Mutual TLS for third-party API calls.
- Penetration tests scheduled quarterly.
- GDPR compliance: auto-delete S3 objects and DynamoDB entries after 90 days via lifecycle/TTL.

### 2.9 Observability & DevOps (Workstream 9)

- **CI/CD (GitHub Actions):**
  1. `on: pull_request` → lint, unit test, security scan (Snyk)
  2. `on: push to main` → build artifacts, deploy Terraform via `terraform apply -auto-approve`
  3. `on: release` → publish npm widget
- **Monitoring:**
  - CloudWatch metric filters on log patterns:  
    - `/ERROR/` → Metric `KycErrors`
    - `/Timeout/` → Metric `LambdaTimeouts`
  - Dashboards:
    - **KYC Health**: upload rate, liveness pass rate, sanctions hits
    - **Latency**: P50/P90/P99 of each API
- **Alerts:**
  - SNS → Slack for warnings  
  - SNS → PagerDuty for critical (≥5% error rate over 5 min)

---

At this stage, we can scaffold Terraform modules, generate CloudFormation templates, or prototype the npm widget. Additionally, we might estimate costs per 10k verifications or draft performance test plans. Let me know which deep-dive you’d like next!
