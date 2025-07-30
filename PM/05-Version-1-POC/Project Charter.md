# Project Charter & User Stories: KYC Web Application MVP & Embeddable Widget V2

---

## 1. Purpose & Background  
Launching a serverless KYC proof-of-concept web application that enables users to:  
1. Upload an official identity document (passport, driver's license, national ID).  
2. Complete a browser-based liveness check with gesture verification.  
3. Verify facial match via AWS Rekognition (≥85% accuracy).  
4. Extract text via Amazon Textract (≥90% accuracy).  
5. Screen against global sanctions watchlists (OFAC, UN, EU).  

Concurrently, we’ll architect and package a reusable, framework-agnostic KYC widget for partner integrations (V2).

---

## 2. Goals & Objectives  
- Deliver a fully integrated KYC web flow in **10 weeks**.  
- Validate AWS services: S3, Lambda, API Gateway, Rekognition, Textract, DynamoDB.  
- Achieve ≥ 85% face-match accuracy and ≥ 90% OCR field extraction accuracy.  
- Screen 100% of users against OFAC/UN/EU sanctions lists with < 5% false-positive rate.  
- Package frontend as an NPM/Web Component with clear theming and callback hooks.  
- Ensure zero critical security findings and maintain encryption in transit/at rest.

---

## 3. Scope  

### In-Scope  
- **MVP Web SPA** (React/Vue/Angular):  
  - Document image capture & upload (JPEG/PNG, ≤5MB, ≥600×400px)  
  - Browser liveness gestures (blink, nod, turn, smile)  
  - Live face-match and status display  
- **Serverless Backend**:  
  1. ID Upload Lambda  
  2. Liveness Orchestrator Lambda  
  3. OCR Extraction Lambda  
  4. Sanctions Screening Lambda  
- **AWS Infrastructure**: S3, DynamoDB, API Gateway, KMS, IAM  
- **CI/CD**: Automated pipelines for frontend and backend  
- **Security & Compliance**: Authentication, least-privilege IAM, logging, pentest  
- **Monitoring & Alerting**: CloudWatch dashboards, alarms, SLIs/SLOs  

### Out-of-Scope  
- Native mobile SDK  
- Full AML scoring beyond sanctions screening  
- On-prem or private-cloud deployments

---

## 4. Key Deliverables & Workstreams  

| Workstream                          | Deliverables                                                                                   |
|-------------------------------------|------------------------------------------------------------------------------------------------|
| 1. Environment & Infra Setup        | • Naming conventions<br>• S3, DynamoDB, KMS, API Gateway provisioned<br>• Parameter Store      |
| 2. Core ID Upload Service           | • `IDUploadLambda` with validation, encryption, S3 upload<br>• Integration tests               |
| 3. Frontend MVP Web App             | • ID upload UI component<br>• Liveness flow UI<br>• Rekognition Liveness in browser<br>• E2E tests |
| 4. Liveness Orchestration Backend   | • `/start-liveness`, `/submit-frame`, `/verify` APIs<br>• Session state in DynamoDB<br>• Face-match logic |
| 5. OCR Extraction Pipeline          | • S3 trigger Lambda<br>• Textract call & JSON parse<br>• Store raw JSON & parsed data in DynamoDB |
| 6. Sanctions & Watchlist Screening  | • DynamoDB Stream or invoke on OCR completion<br>• Third-party API integration<br>• Audit log updates |
| 7. Frontend Packaging (V2)          | • Web Component or NPM package<br>• Theming & configuration props<br>• Documentation & samples |
| 8. Security & Compliance            | • IAM roles/policies<br>• API auth (Cognito/API Keys)<br>• CloudTrail, WAF rules, pentest      |
| 9. Monitoring, Alerting & DevOps    | • CloudWatch logs & metrics<br>• Dashboards & alarms<br>• CI/CD pipelines for all services    |

---

## 5. Timeline & Milestones  

| Week   | Workstreams                             | Milestone                                                |
|--------|-----------------------------------------|----------------------------------------------------------|
| 1      | 1                                       | Infra design approved; naming conventions final          |
| 2      | 1, 2                                    | Dev environment provisioned; IDUploadLambda scaffolded   |
| 3      | 2, 3                                    | ID upload end-to-end tested; frontend upload UI live     |
| 4      | 3, 4                                    | Liveness UI + `/start-liveness` API integrated           |
| 5      | 4                                       | Face-match logic implemented; ≥ 85% accuracy validated    |
| 6      | 5                                       | OCR pipeline live; ≥ 90% field extraction accuracy       |
| 7      | 6                                       | Sanctions screening integrated; sample flags tested      |
| 8      | 8                                       | IAM reviews complete; pentest with zero critical issues |
| 9      | 9                                       | Monitoring dashboards and alerts active; CI/CD solidified|
| 10     | 7                                       | V2 widget published; partner integration demo ready      |

---

## 6. Roles & Responsibilities  

| Role                 | Team/Person          | Responsibilities                                               | RACI            |
|----------------------|----------------------|----------------------------------------------------------------|-----------------|
| Product Owner        | Business Lead        | Prioritize backlog, approve features, stakeholder liaison     | A               |
| Tech Lead            | Architecture Team    | High-level design, integration patterns, code reviews         | R               |
| Frontend Engineers   | UI Team (2)          | SPA development, V2 packaging, unit/e2e tests                 | R               |
| Backend Engineers    | API Team (3)         | Lambda functions, AWS integrations, data modeling             | R               |
| DevOps/QA Engineer   | DevOps Team (1–2)    | CI/CD pipelines, automated tests, monitoring setup            | R/C             |
| Security Engineer    | Security Team        | IAM policies, WAF, pentesting coordination                    | C               |
| Compliance Advisor   | Legal/Compliance     | Data-handling reviews, sanctions policy validation            | C               |
| Stakeholders         | Exec & Biz Sponsors  | Budget approval, final sign-off                               | I               |

---

## 7. Risks & Mitigations  

| Risk                                        | Likelihood | Impact  | Mitigation                                                      |
|---------------------------------------------|------------|---------|-----------------------------------------------------------------|
| Browser compatibility for camera access     | Medium     | High    | Use cross-platform libraries; polyfill; mobile browser tests    |
| Textract API throttling                     | Low        | Medium  | Exponential backoff; DLQ for failed jobs; parallel testing     |
| Sanctions screening false positives         | Medium     | Medium  | Fuzzy-matching thresholds; manual review workflow stub          |
| Misconfigured IAM or leaked credentials     | Low        | High    | Automated IAM policy linting; Secrets Manager; regular audits   |
| Deployment pipeline missteps                | Medium     | Medium  | Automate approvals; peer reviews; rollout canary strategies     |

---

## 8. Success Criteria & Metrics  

- **Functionality**: Complete user flow with ≥ 85% face-match, ≥ 90% OCR extraction.  
- **Performance**: 95th-percentile end-to-end latency < 2 s; support 100 concurrent users.  
- **Reliability**: 99.9% API availability; error rate < 3%.  
- **Security**: Zero critical/high findings in pentest; 100% encryption compliance.  
- **Adoption**: V2 widget integrated into at least one external pilot; documentation rated ≥ 4/5 by integrators.

---

## 9. User Stories & Acceptance Criteria

### Epic 1: Document Upload & Processing
**As a user**, I want to upload my identity document so that I can begin the verification process.

**User Stories**:
- **US-001**: As a user, I want to drag and drop my document image so that I can upload it easily
  - Acceptance Criteria: 
    - Drag and drop area is clearly visible
    - File validation shows progress (size, format, quality)
    - Error messages are clear and actionable
    - Supported formats: JPEG, PNG (≤5MB, ≥600×400px)

- **US-002**: As a user, I want to use my camera to capture my document so that I can upload it directly
  - Acceptance Criteria:
    - Camera access is requested with clear permission dialog
    - Live preview shows document capture
    - Auto-focus and image stabilization work
    - Capture button is prominent and responsive

- **US-003**: As a user, I want to see the extracted data from my document so that I can verify it's correct
  - Acceptance Criteria:
    - Extracted fields are displayed in editable form
    - Confidence scores are shown for each field
    - I can edit incorrect information
    - Save button confirms my changes

### Epic 2: Liveness Detection
**As a user**, I want to prove I'm physically present so that my identity can be verified securely.

**User Stories**:
- **US-004**: As a user, I want clear instructions for liveness gestures so that I can complete them successfully
  - Acceptance Criteria:
    - Gesture instructions are displayed with visual examples
    - Progress indicator shows completion status
    - Real-time feedback guides my movements
    - Retry option is available if I fail

- **US-005**: As a user, I want to see my face during liveness check so that I can position myself correctly
  - Acceptance Criteria:
    - Live video feed shows my face clearly
    - Face detection box guides positioning
    - Lighting indicators help me adjust if needed
    - Camera quality is sufficient for accurate detection

### Epic 3: Verification & Results
**As a user**, I want to see my verification results quickly so that I know if I'm approved.

**User Stories**:
- **US-006**: As a user, I want to see my verification status in real-time so that I know the process is working
  - Acceptance Criteria:
    - Progress bar shows current step
    - Status messages are clear and informative
    - Estimated completion time is provided
    - I can see which step is currently processing

- **US-007**: As a user, I want to receive my verification result immediately so that I can proceed with my application
  - Acceptance Criteria:
    - Result is displayed within 90 seconds
    - Clear pass/fail status is shown
    - Confidence score is displayed
    - Next steps are clearly outlined

### Epic 4: Error Handling & Support
**As a user**, I want help when something goes wrong so that I can complete my verification.

**User Stories**:
- **US-008**: As a user, I want clear error messages so that I understand what went wrong
  - Acceptance Criteria:
    - Error messages are written in plain language
    - Specific guidance is provided for resolution
    - Retry options are clearly presented
    - Support contact information is available

- **US-009**: As a user, I want to restart the process if needed so that I can try again
  - Acceptance Criteria:
    - Restart option is available at any point
    - Previous data is cleared when restarting
    - I'm guided back to the beginning
    - No duplicate submissions are created

---

## 10. Next Steps  
1. Final review and charter sign-off by stakeholders.  
2. Sprint 0: team onboarding, environment access, code repos, CI/CD scaffolding.  
3. Kick off Week 1 backlog: Infra design and provisioning.  
4. Weekly demos and steering committee syncs.  

With this detailed charter, we’re ready to align teams, kick off development, and deliver a robust KYC solution. Let’s get started!
