# Error-Handling Flows & Retry Policies

Below we define both front-end and back-end error paths, along with retry strategies to ensure resilience and clear user guidance.

---

## 1. Front-End Error Scenarios

- Camera Access Denied  
  - Detect via browser API error.  
  - Show banner: “Camera access is required for liveness check.”  
  - Provide two buttons: “Retry” (invoke `getUserMedia` again) and “Cancel” (exit flow).  

- File Upload Failure  
  - Network timeout or 5xx from `/upload-id`.  
  - Show inline message: “Upload failed. Check your connection and try again.”  
  - Automatically retry upload up to 2 times after 1 s backoff; then surface “Retry” button.  

- Liveness Gesture Failure  
  - User missed gesture or poor lighting.  
  - Show real-time hint (“Too dark” or “Move your head slower”).  
  - If still failing after 3 attempts, display “Liveness check failed” with link to restart.  

- Verification Poll Timeout  
  - Front-end polling `/verify` times out (>30 s).  
  - Display “We’re taking longer than expected. Would you like to retry or contact support?”  

---

## 2. Back-End Error Paths

- S3 PutObject Failure  
  - Handle `ProvisionedThroughputExceededException` or timeouts.  
  - Lambda retries automatically (up to 2 retries with exponential backoff).  
  - On persistent failure, send item to dead-letter SQS queue with context for manual inspection.  

- Rekognition CompareFaces Error  
  - Catch throttling (`ThrottlingException`) or internal errors.  
  - Retry up to 3 times with backoff (e.g., 100 ms, 500 ms, 1 s).  
  - If still failing, write audit log entry with `ERROR` status and propagate failure to user.  

- DynamoDB PutItem Failure  
  - For `ProvisionedThroughputExceededException`, retry twice.  
  - If write still fails, emit a CloudWatch Alarm and write to a secondary “audit-fails” queue for offline processing.  

- Liveness Orchestrator Timeouts  
  - If user doesn’t send frames in defined window (e.g., 15 s), orchestration marks as `TIMEOUT`.  
  - Return structured error to front-end: `{ code: "LIVENESS_TIMEOUT", message: "Check your camera and try again." }`  

---

## 3. Retry Strategy Summary

| Operation                      | Max Retries | Backoff Pattern            | Failure Handling                            |
|--------------------------------|-------------|----------------------------|---------------------------------------------|
| Front-End ID Upload            | 2           | Fixed 1 s                  | Surface “Retry” button                      |
| Lambda → S3 PutObject          | 2           | Exponential (100 ms→400 ms) | DLQ (SQS)                                   |
| Lambda → Rekognition           | 3           | Exponential (100 ms→1 s)   | Audit log `ERROR`; return failure to user   |
| Lambda → DynamoDB PutItem      | 2           | Exponential                | Secondary queue + CloudWatch Alarm          |

---

## 4. Observability & Alerts

- **CloudWatch Metrics**  
  - Custom metric: `LivenessTimeouts`, `UploadErrors`, `MatchErrors`.  
  - Dashboards showing error rates vs. total requests.  

- **CloudWatch Alarms**  
  - Trigger if error rate > 5% over 5 min window.  
  - Notify via SNS to on-call Slack channel.  

- **Structured Logging**  
  - Emit JSON logs with `requestId`, `step`, `status`, and `errorCode`.  
  - Enable retention of logs for 90 days for post-mortem.

---

# Next Topics

1. Monitoring & alerting deep dive (CloudWatch dashboards, cost considerations)  
2. Detailed AWS resource architecture (IAM policies, CloudFormation/Terraform snippets)  
3. UI/UX flow refinement with wireframes and accessibility checks  

Which one shall we explore next?
