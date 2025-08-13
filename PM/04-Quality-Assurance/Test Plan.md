# Test Plan

---

## 1. Overview

This test plan validates the full KYC MVP flow and the embeddable V2 widget. Coverage includes functional, negative, performance, security, compliance, and UI/UX scenarios.  

Environments:  
- Dev (unit/integration)  
- Stage (end-to-end, performance)  
- Prod (smoke and compliance)

---

## 2. Test Data & Environments

- Use a library of sample IDs (various document types, resolutions)  
- Camera emulators and real devices (desktop, mobile)  
- Mock credentials for third-party sanctions API (flagged and clean records)  
- Test user accounts in Cognito or API-Key auth  

---

## 3. Functional Test Scenarios

| Test ID | Scenario                             | Steps                                                                                 | Expected Outcome                                                                                   |
|---------|--------------------------------------|---------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| F-TC-01 | ID Upload (Valid)                    | 1. Select JPEG/PNG ≤5 MB<br>2. Click **Upload**                                      | 200 OK; thumbnail preview; `verificationId` returned; object in `kyc-id-uploads`                  |
| F-TC-02 | ID Upload (Invalid)                  | 1. Select PDF/GIF or >5 MB<br>2. Click **Upload**                                     | 400/413 error; inline message; no S3 object                                                        |
| F-TC-03 | Liveness Flow (Happy Path)           | 1. Click **Start Liveness**<br>2. Perform three prompted gestures in 10 s             | Gestures accepted; frames in `kyc-live-frames`; UI moves to **Verify**                              |
| F-TC-04 | Face Match Pass                      | 1. Complete liveness<br>2. Poll `/verify`                                             | `pass` with confidence ≥85%; audit log entry with `PASS`                                           |
| F-TC-05 | Face Match Fail                      | 1. Upload mismatched or altered ID<br>2. Complete gestures<br>3. Poll `/verify`       | `fail`; confidence <85%; audit log entry with `FAIL`                                               |
| F-TC-06 | OCR Extraction                       | 1. Trigger Textract on valid ID<br>2. Inspect `KycOcrData`                            | Parsed `name`, `dob`, `docNumber` match expected; raw JSON in `kyc-ocr-raw`                        |
| F-TC-07 | Sanctions Screening (Clean)          | 1. OCR data for a non-sanctioned identity<br>2. Inspect `KycAuditLog`                 | `sanctionsStatus = CLEAR`; no `matches[]`                                                          |
| F-TC-08 | Sanctions Screening (Flagged)        | 1. OCR data for a known sanctioned identity<br>2. Inspect `KycAuditLog`               | `sanctionsStatus = FLAGGED`; `matches[]` contains correct list entry                                |
| F-TC-09 | V2 Widget Integration               | 1. Install NPM package or embed Web Component<br>2. Configure endpoints and callbacks | Widget renders; ID/liveness flows invoke correct APIs; onSuccess/onError callbacks fire appropriately |

---

## 4. Negative & Edge Test Scenarios

| Test ID   | Scenario                              | Steps                                                                                           | Expected Outcome                                                                     |
|-----------|---------------------------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| N-TC-01   | No Camera Access                      | Deny browser camera permission                                                                   | UI shows “Camera access required”; flow does not proceed                             |
| N-TC-02   | Poor Lighting / Blurry Video         | Perform gestures in dim light or obstructed view                                                 | Real-time hint “Increase lighting”; if still fails, UI shows “Liveness failed”       |
| N-TC-03   | API Gateway Throttling               | Simulate high RPS on `/upload-id` or `/start-liveness`                                           | 429 responses; client retries per backoff; no backend overload                        |
| N-TC-04   | Textract Throttling / Errors         | Force Textract `ThrottlingException`                                                             | Lambda retries; after retries, error logged; UI/Audit shows `OCR_ERROR`              |
| N-TC-05   | Sanctions API Timeout / 5xx          | Mock third-party API returning 500 or timeout                                                     | `SanctionsScreeningLambda` retries; on persistent failure, record `ERROR` status     |
| N-TC-06   | Session Hijacking                    | Reuse an expired or different `verificationId` for `/submit-frame` or `/verify`                  | 401/404 error; no data leak; user prompted to restart flow                           |

---

## 5. Performance & Load Testing

- End-to-End Latency:  
  • Target < 2 s 95th-percentile for happy-path flows  
- Concurrency:  
  • 100 concurrent users maintaining < 200 ms response for `/upload-id` and `/start-liveness`  
- Stress Test:  
  • Ramp to 1 000 users; measure error rate, backoff behavior  
- Tools:  
  • Locust or JMeter against API Gateway endpoints; Browser + Puppeteer for UI flows  

---

## 6. Security & Compliance Testing

- Authentication & Authorization:  
  • Call endpoints without valid token/API Key → 401 Unauthorized  
- IAM Policy Validation:  
  • Attempt S3 or DynamoDB access via unintended roles → AccessDenied  
- Encryption Verification:  
  • Validate SSE-KMS on S3 buckets; TLS enforced on API Gateway  
- Penetration Testing:  
  • OWASP Top 10 checks against the SPA and APIs  
- Audit & Logging:  
  • Confirm CloudTrail logs S3/DynamoDB data events; verify audit log immutability  

---

## 7. UI/UX & Accessibility

- Cross-Browser Compatibility:  
  • Chrome, Firefox, Edge, Safari (desktop + mobile)  
- Accessibility (WCAG 2.1 AA):  
  • Keyboard navigation, ARIA labels for camera controls and prompts  
- Responsiveness:  
  • Layout adapts to mobile viewport; video and controls scale gracefully  
- Error Messaging:  
  • Clear, concise instructions for all failure paths  

---

## 8. Automation & Tooling

- Unit Tests:  
  • Lambda handlers, OCR parsers, screening logic (Jest/PyTest)  
- Integration Tests:  
  • LocalStack for S3/DynamoDB/Textract; mocked Rekognition and sanctions API  
- E2E Tests:  
  • Cypress or Playwright simulating full flows on the hosted MVP  
- CI/CD:  
  • Pipelines that run linting, unit tests, integration tests, e2e tests on PRs  

---

## 9. Test Schedule & Execution

| Phase               | Duration  | Activities                                         |
|---------------------|-----------|----------------------------------------------------|
| Week 1–2            | 2 weeks   | Write unit/integration tests; set up test infra    |
| Week 3–4            | 2 weeks   | Execute functional & negative tests; fix defects   |
| Week 5              | 1 week    | Performance/load testing and tuning                |
| Week 6              | 1 week    | Security & compliance testing, pentest coordination|
| Week 7–8            | 2 weeks   | UI/UX & accessibility audits; finalize automation  |
| Week 9–10           | 2 weeks   | Regression, user acceptance testing, sign-off      |

---

This reworked test plan ensures end-to-end coverage for both the MVP and the future embeddable widget, aligning with our updated architecture and objectives.
