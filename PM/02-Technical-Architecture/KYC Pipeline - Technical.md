# General KYC Pipeline Summary

---

## Core Processing Stages

- API Gateway exposes REST endpoints for ID upload, liveness checks, and final verification.
- IDUploadLambda ingests and encrypts user‐submitted ID images into an S3 bucket.
- LivenessOrchestratorLambda guides the user through gesture-based checks, stores key frames in S3, and calls Rekognition’s CompareFaces to verify facial similarity.
- OCRExtractionLambda triggers on new ID uploads, uses Textract to extract name, date of birth, document number, and persists structured fields in DynamoDB.
- SanctionsScreeningLambda reads the extracted PII, invokes a third-party API (e.g., ComplyAdvantage) to screen against OFAC/UN/EU watchlists, and logs any matches.

---

## Data Storage & Retention

- S3 Buckets  
  • kyc-id-uploads for raw ID images  
  • kyc-live-frames for liveness snippets  
  • kyc-ocr-raw for Textract JSON output  
  • All buckets use SSE-KMS encryption and lifecycle policies (e.g., transition to Glacier, automatic deletion).

- DynamoDB Tables  
  • KycAuditLog for end-to-end audit records (verification ID, timestamps, results, sanctions status) with TTL cleanup.  
  • KycOcrData for parsed OCR fields, expiring after 30 days.

---

## Security & Access Controls

- IAM roles scoped narrowly to each Lambda’s needs (S3, Textract, Rekognition, DynamoDB, logging).  
- Customer-managed KMS key policies grant encrypt/decrypt rights only to authorized Lambdas.  
- VPC endpoints or NAT gateways secure outbound calls to third-party screening services.  
- API Gateway throttling and usage plans protect against abuse.

---

## Monitoring, Logging & Alerts

- Structured JSON logs in CloudWatch for every Lambda step.  
- Custom and built-in metrics (error counts, latency) tracked on dashboards.  
- Alarms trigger SNS notifications to email, Slack, or PagerDuty for high error rates or elevated latency.

---

## Extensibility Highlights

- OCR output can power additional identity verification or auto-fill workflows.  
- Sanctions screening can incorporate fuzzy-matching algorithms or scheduled bulk updates of watchlists.  
- Future integrations might include AML risk scoring, device-fingerprinting, or mobile SDKs for richer user experiences.  

That wraps up the high-level overview of your KYC architecture.
