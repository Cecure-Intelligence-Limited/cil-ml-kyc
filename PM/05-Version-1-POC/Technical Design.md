# Technical Design & UI Wireframes with Detailed Specifications

## Identity Verification Overview

Identity verification is the process of confirming that a person is who they claim to be, and is crucial for reducing fraud, enhancing security, and building trust in online and offline interactions. It involves confirming the accuracy and legitimacy of the information provided by an individual against various data sources and methods.

**Why is it important?**
- **Fraud Prevention:**
  Identity verification helps businesses and organizations prevent fraudulent activities like account takeovers, synthetic identity fraud, and unauthorized access to sensitive information.
- **Security:**
  It ensures that only authorized individuals can access specific services, accounts, or systems, protecting both the organization and its users.
- **Trust and Transparency:**
  Verifying identities builds confidence in online transactions, e-commerce, and other digital interactions, fostering a more trustworthy environment.
- **Compliance:**
  Many industries, like finance and healthcare, have regulations that require identity verification to comply with Know Your Customer (KYC) and Anti-Money Laundering (AML) laws.

**How is it done?**
- **Document Verification:**
  This involves examining physical documents like passports, driver's licenses, or national ID cards, often using IDVT (Identification Document Validation Technology).
- **Biometric Verification:**
  This method uses unique biological traits like fingerprints, facial recognition, or voice patterns to confirm identity.
- **Data Verification:**
  This process involves matching information provided by the individual against existing data sources, such as credit bureaus, public records, or other databases.
- **Multi-Factor Authentication:**
  This method combines two or more factors, like something you know (password) and something you have (phone), to verify identity.
- **Digital Identity Verification:**
  This combines physical and digital methods, using both document checks and online data to provide a more comprehensive view of a user's identity.

**Examples:**
- **Companies House:**
  In the UK, businesses must verify the identities of individuals associated with the company to reduce fraud and enhance transparency.
- **NHS:**
  Healthcare providers use identity verification to ensure patients access the correct medical records and services.
- **Financial Institutions:**
  Banks and other financial institutions rely on identity verification to onboard new customers, prevent money laundering, and comply with regulations.
- **Online Services:**
  Many websites and apps require users to verify their identity to create accounts, access content, or make purchases.

In conclusion, identity verification is a critical process that plays a vital role in protecting individuals and organizations from fraud, enhancing security, and building trust in a digital world.

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

- **API Definition (`upload-document`):**
  ```yaml
  POST /v1/upload-document
  Request:
    Headers:
      Authorization: Bearer <JWT>
    Body (multipart/form-data):
      file: image/jpeg/png (max 5 MB, min 600×400px)
      metadata: { documentType: string, countryCode: string }
  Response:
    200 OK { verificationId, s3Key, processingStatus }
    400 BadRequest (invalid format/size)
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
    - `fullName`, `dob`, `documentNumber`, `expiryDate`
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
    | sanctionsStatus  | S     | "CLEAR" / "HIT" / "PENDING"        |
    | matchedEntity    | S     | if HIT                             |
    | screenedAt       | N     | timestamp                          |

### 2.7 Frontend Packaging (Workstream 7)

- Publish as scoped npm package `@company/kyc-widget`
- Expose props:
  - `uploadEndpoint`, `livenessEndpoint`, `themeConfig`
  - Callbacks: `onComplete`, `onError`
- Storybook stories:
  - "Default," "DarkMode," "GestureFailure," "OCR Failure"

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

## 3. UI Wireframes & Frontend Design

### 3.1 Screen Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    KYC Verification Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Welcome       │  │  Document       │  │  Liveness    │ │
│  │   Screen        │  │  Upload         │  │  Check       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Data Review    │  │  Verification   │  │  Results     │ │
│  │  & Edit         │  │  Processing     │  │  Screen      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Screen 1: Welcome Screen
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] KYC Verification System                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Welcome to KYC                           │
│                                                             │
│  We'll help you verify your identity quickly and securely. │
│  This process takes about 90 seconds and requires:         │
│                                                             │
│  ✓ A valid ID document (passport, driver's license)        │
│  ✓ A device with camera access                             │
│  ✓ Good lighting conditions                                │
│                                                             │
│  [Privacy Notice] Your data is encrypted and automatically │
│  deleted after 90 days for your privacy.                   │
│                                                             │
│                    [Start Verification]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Screen 2: Document Upload
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Document Upload                    Step 1 of 5     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Please upload your identity document                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [📷 Camera Icon]                                   │   │
│  │                                                     │   │
│  │  Drag and drop your document here                   │   │
│  │  or click to browse                                 │   │
│  │                                                     │   │
│  │  Supported: JPEG, PNG (max 5MB)                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [📷 Take Photo]  [📁 Choose File]                        │
│                                                             │
│  [Document Preview Area - shows uploaded image]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Screen 3: Liveness Check
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Liveness Check                    Step 2 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Please complete the liveness check                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Live Video Feed]                                  │   │
│  │  [Face Detection Box]                               │   │
│  │                                                     │   │
│  │  Current Gesture: [Blink]                           │   │
│  │  Progress: ████████░░ (80%)                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Lighting Indicator] [Position Guide]                     │
│                                                             │
│  [Retry] [Continue]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 Screen 4: Data Review
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Review Your Information           Step 3 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Please verify the information extracted from your document│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Full Name: [John Michael Smith] [Edit]             │   │
│  │  Confidence: 95%                                    │   │
│  │                                                     │   │
│  │  Date of Birth: [15/03/1985] [Edit]                 │   │
│  │  Confidence: 98%                                    │   │
│  │                                                     │   │
│  │  Document Number: [123456789] [Edit]                │   │
│  │  Confidence: 92%                                    │   │
│  │                                                     │   │
│  │  Expiry Date: [31/12/2030] [Edit]                   │   │
│  │  Confidence: 89%                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Save Changes] [Continue]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Screen 5: Processing
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Processing                        Step 4 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Verifying your identity...                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Spinner Animation]                                │   │
│  │                                                     │   │
│  │  Current Step: Face Matching                        │   │
│  │  Estimated Time: 15 seconds remaining               │   │
│  │                                                     │   │
│  │  Progress: ██████████ (100%)                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Processing Steps List]                                  │
│  ✓ Document Uploaded                                     │
│  ✓ Liveness Check Complete                               │
│  ⏳ Face Matching (in progress)                          │
│  ⏳ Sanctions Screening (pending)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.7 Screen 6: Results
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Verification Complete            Step 5 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [✅ Success Icon]                                  │   │
│  │                                                     │   │
│  │  Verification Successful!                           │   │
│  │                                                     │   │
│  │  Confidence Score: 94%                              │   │
│  │  Processing Time: 87 seconds                        │   │
│  │                                                     │   │
│  │  [Download Certificate] [Share Results]             │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Start New Verification] [Return to Dashboard]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.8 Error States & Edge Cases

#### Error: Camera Access Denied
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Camera Access Required                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [⚠️ Warning Icon]                                 │   │
│  │                                                     │   │
│  │  Camera access is required for liveness check      │   │
│  │                                                     │   │
│  │  Please enable camera access in your browser       │   │
│  │  settings and try again.                            │   │
│  │                                                     │   │
│  │  [Enable Camera] [Use Different Method]             │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Error: Poor Image Quality
```
┌─────────────────────────────────────────────────────────────┐
│  [Back] Image Quality Issue                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [📷 Image Preview]                                 │   │
│  │                                                     │   │
│  │  The image quality is too low for processing       │   │
│  │                                                     │   │
│  │  Please ensure:                                     │   │
│  │  • Good lighting                                    │   │
│  │  • Document is clearly visible                      │   │
│  │  • No glare or shadows                              │   │
│  │                                                     │   │
│  │  [Retake Photo] [Upload Different Image]            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.9 Responsive Design Considerations

#### Mobile Layout (≤768px)
- Single column layout
- Larger touch targets (44px minimum)
- Simplified navigation
- Swipe gestures for document upload
- Full-screen camera view for liveness

#### Tablet Layout (768px - 1024px)
- Two-column layout where appropriate
- Optimized for touch and mouse interaction
- Side-by-side document preview and form

#### Desktop Layout (≥1024px)
- Multi-column layout
- Hover states and advanced interactions
- Keyboard shortcuts
- Split-screen document and form views

### 3.10 Accessibility Features

#### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Focus Indicators**: Clear focus states for all interactive elements
- **Alternative Text**: Descriptive alt text for all images

#### Assistive Technology Support
- **Voice Commands**: Support for voice navigation
- **High Contrast Mode**: Enhanced visibility options
- **Font Scaling**: Text resizable up to 200%
- **Motion Reduction**: Respects user's motion preferences

---

At this stage, we can scaffold Terraform modules, generate CloudFormation templates, or prototype the npm widget. Additionally, we might estimate costs per 10k verifications or draft performance test plans. Let me know which deep-dive you'd like next!
