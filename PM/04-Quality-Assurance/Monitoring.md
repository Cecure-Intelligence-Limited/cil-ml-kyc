# Monitoring Strategy and Documentation

---

## Metrics Collection

Identify and emit key application and infrastructure metrics to CloudWatch:

| Metric Name        | Namespace          | Description                                          | Unit        |
|--------------------|--------------------|------------------------------------------------------|-------------|
| UploadErrors       | KYC/Application    | Count of ID upload failures                          | Count       |
| LivenessTimeouts   | KYC/Application    | Number of liveness sessions that timed out           | Count       |
| MatchFailures      | KYC/Application    | Face-match operations with similarity below threshold| Count       |
| OCRErrors          | KYC/Application    | Textract API errors or missing OCR fields            | Count       |
| SanctionsErrors    | KYC/Application    | Third-party screening failures                       | Count       |
| API4XX             | AWS/ApiGateway     | Client error responses (4XX)                         | Count       |
| API5XX             | AWS/ApiGateway     | Server error responses (5XX)                         | Count       |
| APILatency         | AWS/ApiGateway     | End-to-end request latency                            | Milliseconds|

Each Lambda function also publishes custom metrics for internal steps (e.g., frame captures, session creations).

---

## Structured Logging

Adopt JSON-formatted, structured logs for ease of filtering and analysis:

- Log Groups  
  • `/aws/lambda/IDUploadLambda`  
  • `/aws/lambda/LivenessOrchestratorLambda`  
  • `/aws/lambda/OCRExtractionLambda`  
  • `/aws/lambda/SanctionsScreeningLambda`  

- Log Retention  
  • Lambda logs: 30 days  
  • API Gateway access logs: 90 days  

- Log Fields  
  • `requestId` – correlates across services  
  • `timestamp` – ISO 8601 format  
  • `step` – logical operation (e.g., “ValidateUpload”, “InvokeTextract”)  
  • `status` – “SUCCESS” / “ERROR”  
  • `errorCode` – service-specific code for failures  

- Metric Filters  
  • Pattern `"status":"ERROR"` → Metric `KycErrors`  
  • Pattern `"errorCode":"Timeout"` → Metric `LambdaTimeouts`

---

## Dashboards

Create dedicated CloudWatch dashboards for real-time visibility:

| Dashboard Name       | Focus                                        | Key Widgets                                              |
|----------------------|----------------------------------------------|----------------------------------------------------------|
| KYC Overview         | End-to-end health of the verification flow   | Total requests, pass/fail rates, error counts            |
| API Performance      | Request latencies and error breakdowns       | P50/P90/P99 latency per endpoint, 4XX/5XX over time      |
| OCR & Screening      | OCR success and sanctions traffic            | OCR success ratio, sanctions hits vs. clears             |
| Resource Utilization | AWS service usage and cost drivers           | Lambda concurrency, DynamoDB RCUs/WCUs, S3 request rates |

Embed Log Insights queries to surface top error messages and most frequent failure patterns.

---

## Alerts & Notifications

Configure CloudWatch alarms to trigger on anomalous conditions:

| Alert Name              | Metric/Expression                                          | Threshold                    | Action                    |
|-------------------------|------------------------------------------------------------|------------------------------|---------------------------|
| High Upload Error Rate  | `UploadErrors / TotalUploads > 5%`                         | Over 5% for 5 min            | SNS → Slack #kyc-alerts   |
| Liveness Timeouts Spike | Sum(LivenessTimeouts) > 10                                  | Over 10 occurrences in 5 min | SNS → PagerDuty critical  |
| OCR Failure Rate        | `OCRErrors / TotalOCRJobs > 3%`                            | Over 3% for 1 min            | SNS → Slack #kyc-ops      |
| High API Latency        | P90(APILatency) > 2s                                       | 2 seconds for 3 consecutive periods | SNS → Slack #kyc-alerts   |
| Sanctions Screening Fail| Sum(SanctionsErrors) ≥ 1 per minute                        | Any failure                 | SNS → PagerDuty critical  |

Use SNS topics to route notifications:  
- `KYC-Warnings` → Slack channel for triage  
- `KYC-Critical` → PagerDuty for immediate response

---

## Roles & Responsibilities

- On-Call Engineers  
  • Respond to PagerDuty alerts; run incident playbook  
- SRE Team  
  • Maintain dashboards; tune alarm thresholds  
  • Conduct monthly post-mortems on major incidents  
- DevOps Team  
  • Update Terraform/CloudFormation for monitoring resources  
  • Automate log retention policies and metric filters  
- Security/Compliance  
  • Review CloudTrail data events for S3 and DynamoDB  
  • Ensure audit logs are immutable and retained per policy

---

## Service Level Objectives (SLOs)

Define clear targets to measure service health:

| SLO Metric                  | Target                    | Measurement                    |
|-----------------------------|---------------------------|--------------------------------|
| Availability                | 99.9% uptime              | API5XX anomaly detection       |
| Error Rate                  | < 2% across all endpoints | Aggregated custom errors       |
| Response Latency (P90)      | < 1.5 seconds             | API Gateway metric             |
| OCR Success Rate            | ≥ 98%                     | `TotalOCRJobs - OCRErrors`     |
| Sanctions Screening Success | ≥ 99%                     | `TotalScreens - SanctionsErrors`|

Track SLO compliance weekly and escalate if any metric falls below target.

---

This comprehensive monitoring plan ensures we detect issues early, maintain performance and reliability, and meet compliance requirements.
