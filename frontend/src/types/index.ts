// Defines all possible steps in KYC flow
export type KycStep =
  | "welcome"
  | "documentUpload"
  | "livenessCheckMethod"
  | "livenessCheck"
  | "review"
  | "processing"
  | "results"
  | "cameraAccessError"
  | "imageQualityError"
  | "livenessFailure"
  | "genericError";

// The shape of data extracted from the document
export interface ExtractedData {
  fullName: string;
  dob: string;
  documentNumber: string;
  expiryDate: string;
}

// The shape of the API response after document upload
export interface VerificationData {
  verificationId: string;
  s3Key: string;
  processingStatus: string;
}

// The shape of the API response for the liveness check
export interface LivenessData {
  sessionId: string;
  gestures: string[];
}

// The complete type for your global context state
export interface KycContextType {
  step: KycStep;
  setStep: (step: KycStep) => void;
  verificationData: VerificationData | null;
  setVerificationData: (data: VerificationData | null) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  extractedData: ExtractedData;
  setExtractedData: (data: ExtractedData) => void;
}

// Type for Icon component props
export interface IconProps {
  className?: string;
}

export interface LivenessError {
  type:
    | "timeout"
    | "detection_failed"
    | "too_many_attempts"
    | "technical_error";
  message: string;
}
