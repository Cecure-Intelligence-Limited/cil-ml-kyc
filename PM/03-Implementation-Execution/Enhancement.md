# Enhancements: OCR Extraction and Sanctions Screening

We’ll slot two new phases into the flow—OCR to pull text from the ID, then a third-party sanctions check on the extracted identity data. Each step uses its own Lambda, permissions, and storage.

---

## OCR Integration with Amazon Textract

- **Trigger**  
  - New S3 “ObjectCreated” event on `kyc-id-uploads` bucket  
  - Invokes **OCRExtractionLambda**

- **OCRExtractionLambda Responsibilities**  
  - Call Textract’s `AnalyzeDocument` API to extract structured data (name, DOB, document number)  
  - Normalize text (uppercase, trim whitespace)  
  - Store raw JSON output in S3 folder `kyc-ocr-raw/`  
  - Write parsed fields into a DynamoDB table **KycOcrData** with key `verificationId`

- **KycOcrData Table**  
  - Partition Key: `verificationId`  
  - Attributes: `name`, `dateOfBirth`, `documentNumber`, `ocrTimestamp`  
  - TTL: 30 days  
  - Encryption: SSE-KMS  

- **IAM Permissions**  
  - `textract:AnalyzeDocument` on all documents  
  - `s3:GetObject`/`s3:PutObject` on `kyc-ocr-raw/*`  
  - `dynamodb:PutItem` on `KycOcrData`

---

## Third-Party Sanctions Screening

- **Trigger**  
  - Post-OCR extraction (either via DynamoDB Streams on **KycOcrData** or direct invocation at end of `OCRExtractionLambda`)

- **SanctionsScreeningLambda Responsibilities**  
  - Read extracted PII from **KycOcrData** for a given `verificationId`  
  - Call external screening API (for example, ComplyAdvantage) over HTTPS:  
    • Endpoint: `https://api.complyadvantage.com/v1/screen`  
    • Payload: `{ "name": "JANE DOE", "dob": "1990-01-01" }`  
  - Parse response to detect matches against OFAC/UN/EU lists  
  - Write screening result to **KycAuditLog** (new attributes: `sanctionsStatus`, `matches[]`)

- **Example Screening Result**  
  ```json
  {
    "verificationId": "abc123",
    "sanctionsStatus": "FLAGGED",
    "matches": [
      {
        "list": "OFAC",
        "entity": "JANE DOE",
        "country": "IRAN"
      }
    ]
  }
  ```

- **IAM & Network**  
  - VPC endpoint or NAT Gateway to reach the Internet  
  - IAM policy allowing `logs:CreateLogStream` and `logs:PutLogEvents` for troubleshooting  
  - Secrets Manager reference for the screening API key  

---

## Updated Data Flow (ASCII)

```text
   ┌────────────┐       ┌───────────┐       ┌─────────────────────┐
   │            │ POST  │ IDUpload  │ put   │ S3: kyc-id-uploads  │
   │ User Device│──────▶│ Lambda    │───▶   └─────────────────────┘
   │            │       └───────────┘
   │            │          │
   │            │          │ S3 event
   │            │          ▼
   │            │    ┌──────────────────┐
   │            │    │OCRExtractionLambda│
   │            │    └──────────────────┘
   │            │          │
   │            │          │ Textract AnalyzeDocument
   │            │          ▼
   │            │    ┌──────────────────┐
   │            │    │ Amazon Textract  │
   │            │    └──────────────────┘
   │            │          │
   │            │          ▼
   │            │    ┌──────────────────┐
   │            │    │KycOcrData (DDB)  │
   │            │    └──────────────────┘
   │            │          │
   │            │    DDB Stream or Invoke
   │            │          ▼
   │            │ ┌────────────────────────┐
   │            │ │SanctionsScreeningLambda│
   │            │ └────────────────────────┘
   │            │          │
   │            │          │ HTTPS to ComplyAdvantage
   │            │          ▼
   │            │ ┌────────────────────────┐
   │            │ │ Third-Party API       │
   │            │ └────────────────────────┘
   │            │          │
   │            │          ▼
   │            │ ┌────────────────────┐
   │            │ │KycAuditLog (DDB)   │
   │            │ └────────────────────┘
   └────────────┘
```

---

Next, we can explore how to enrich screening accuracy with fuzzy-matching algorithms or integrate watchlist updates via scheduled batch jobs. Which would you like to dive into?
