# Detailed Technical Workstreams

Below is a more granular breakdown across nine workstreams, each with key deliverables, tasks, and considerations.  

---

## 1. Resource Provisioning & Environment Setup

- Define infrastructure naming conventions and environment separation (dev/stage/prod).  
- Provision S3 buckets with versioning, SSE-KMS encryption, lifecycle rules, and public-access blocks.  
- Create DynamoDB tables  
  - **KycAuditLog**: primary keys, TTL on `expiresAt`, SSE-KMS encryption  
  - **KycOcrData**: primary keys, TTL, encryption  
- Generate customer-managed KMS key(s) and attach least-privilege key policies.  
- Configure API Gateway  
  - Create “prod” stage, usage plans, API keys, throttling (e.g., 100 RPS)  
  - Enable CORS for frontend domain  
- Store configuration parameters (bucket names, table names, API endpoints) in AWS Systems Manager Parameter Store or Secrets Manager.  

---

## 2. Core Identity Upload Service

- Define `IDUploadLambda` function  
  - Validate MIME type (JPEG/PNG), file size limits, image dimensions  
  - Generate UUID `verificationId` and ensure idempotency  
  - Encrypt and upload to S3 (`kyc-id-uploads/${verificationId}.jpg`)  
  - Return structured JSON payload (`verificationId`, expiration timestamp)  
- Implement error handling  
  - S3 Put retries, malformed-file errors, quota exceedances  
- Automate deployment via CI/CD  
  - Unit tests for input validation  
  - Integration tests against a local S3 emulator (e.g., LocalStack)  

---

## 3. Frontend MVP Web Application

- Scaffold SPA (React, Vue, or Angular) with TypeScript support.  
- ID Upload UI  
  - Drag-and-drop or file picker, preview thumbnail, progress bar  
  - Call `POST /upload-id`, handle error/success states  
- Liveness Flow UI  
  - Access `navigator.mediaDevices.getUserMedia`, display live video  
  - Guide user through randomized gesture prompts (blink, turn head)  
  - Capture frames and stream via signed URLs or direct API calls  
  - Use AWS Rekognition Liveness SDK (if available) or custom frame capture  
- State management  
  - Store `verificationId`, gesture sequence, frame results in local state  
- Deployment  
  - Host on S3 + CloudFront for POC  
  - CI for linting, unit tests (Jest), e2e tests (Cypress)  

---

## 4. Liveness Orchestration & Face-Match (Backend)

- Build `LivenessOrchestratorLambda`  
  - Endpoints:  
    1. `POST /start-liveness` → generate gesture sequence, store session in DynamoDB  
    2. `POST /submit-frame` → save frame to S3 (`kyc-live-frames/${verificationId}/${frameId}.jpg`)  
    3. `GET /verify` → call Rekognition `CompareFaces`, aggregate similarity scores  
- Session state  
  - DynamoDB table or in-memory cache (e.g., ElastiCache) with TTL  
  - Session attributes: expected gestures, timestamps, frame count  
- Face matching  
  - Pull ID image from S3, compare each live frame, compute average similarity  
  - Define thresholds (e.g., ≥ 85% match)  
- Resilience  
  - Idempotent frame submissions, DLQ for failed Rekognition calls  
  - Circuit-breaker for repeated API errors  

---

## 5. OCR Extraction Pipeline

- Configure S3 “ObjectCreated” event on `kyc-id-uploads` to trigger `OCRExtractionLambda`.  
- In Lambda:  
  - Invoke Textract `AnalyzeDocument` for forms and tables  
  - Parse JSON to extract fields: `Name`, `DateOfBirth`, `DocumentNumber`  
  - Normalize (uppercase, trim), validate formats (regex for DOB)  
  - Write raw Textract output to `kyc-ocr-raw/${verificationId}.json` in S3  
  - Upsert structured record into DynamoDB `KycOcrData`  
- Error handling  
  - Alert on missing expected fields, Textract API throttling  
  - Retry with exponential backoff  

---

## 6. Sanctions & Watchlist Screening

- Trigger `SanctionsScreeningLambda` via DynamoDB Streams on `KycOcrData`.  
- In Lambda:  
  - Fetch PII (`name`, `dob`) for `verificationId`  
  - Call third-party API (e.g., ComplyAdvantage) over HTTPS with API key from Secrets Manager  
  - Parse response for matches, fuzzy-match metrics, list sources (OFAC/UN/EU)  
  - Update `KycAuditLog` item: `sanctionsStatus`, `matches[]`, `screenedAt`  
- Reliability  
  - Implement DLQ for streaming failures, retry logic for 5xx errors  
  - Log full payloads to CloudWatch for audit  

---

## 7. Frontend Packaging & Integration (Version 2)

- Refactor MVP UI into a framework-agnostic component or Web Component  
  - Expose props for API endpoints, UI labels, styling overrides  
  - Publish as NPM package (private or public registry)  
  - Provide a CDN-hosted UMD bundle fallback  
- Documentation  
  - Usage examples, initialization steps, callback hooks (e.g., onSuccess, onError)  
  - API reference, theming guidelines  
- Testing & CI  
  - Storybook for component showcase  
  - Automated visual regression tests (Percy or Chromatic)  

---

## 8. Security, IAM & Compliance

- Define IAM roles and least-privilege policies:  
  - Each Lambda only gets specific S3, DynamoDB, Textract, Rekognition, Secrets Manager actions  
  - Restrict KMS decrypt/encrypt to authorized roles  
- API Gateway security  
  - Implement Cognito User Pool authorizer or API key validation  
  - Configure rate limiting and WAF rules to block common attacks  
- Data protection  
  - Enforce HTTPS for all endpoints  
  - Enable CloudTrail and S3/AuditLog data event logging  
  - Regularly rotate API keys and KMS keys  

---

## 9. Monitoring, Alerting & DevOps

- Logging & Metrics  
  - Instrument each Lambda to emit structured logs (`step`, `status`, `errorCode`)  
  - Publish custom CloudWatch metrics (`UploadErrors`, `LivenessFails`, `OCRLatency`, `SanctionsFlags`)  
- Dashboards & Alarms  
  - Central dashboard showing success rates, latencies, error spikes  
  - Alarms on high error thresholds, abnormal latencies, unusual sanction flags (SNS → Slack/PagerDuty)  
- CI/CD Pipelines  
  - Backend: use AWS CodePipeline or GitHub Actions to build, package, deploy Lambdas and infra (via CloudFormation/Terraform)  
  - Frontend: automated builds, unit/e2e tests, deploy to S3/CloudFront  
  - Promote artifacts across environments with approval gates  

---

With these detailed streams, teams can work concurrently while maintaining clear ownership, accelerating delivery, and ensuring quality at every stage. Let me know if you’d like to prioritize or rebalance any of these areas.
