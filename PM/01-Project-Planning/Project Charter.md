# Project Charter: KYC Web Application MVP & Embeddable Widget V2

---

## 1. Purpose & Background  
Launching a serverless KYC proof-of-concept web application that enables users to:  
1. Upload an official ID.  
2. Complete a browser-based liveness check.  
3. Verify facial match via AWS Rekognition.  
4. Extract text via Amazon Textract.  
5. Screen against sanctions watchlists.  

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
  - ID image capture & upload  
  - Browser liveness gestures (blink, nod, turn)  
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

## 9. Next Steps  
1. Final review and charter sign-off by stakeholders.  
2. Sprint 0: team onboarding, environment access, code repos, CI/CD scaffolding.  
3. Kick off Week 1 backlog: Infra design and provisioning.  
4. Weekly demos and steering committee syncs.  

With this detailed charter, we’re ready to align teams, kick off development, and deliver a robust KYC solution. Let’s get started!
