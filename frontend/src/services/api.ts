// src/services/api.ts
import { VerificationData, LivenessData } from "@/types";

export const api = {
  uploadDocument: async (
    file: File,
    metadata: { documentType: string; countryCode: string }
  ): Promise<VerificationData> => {
    console.log("API CALL: /v1/upload-document", {
      fileName: file.name,
      metadata,
    });
    await new Promise((res) => setTimeout(res, 1000));

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("PayloadTooLarge: File exceeds 5MB limit.");
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      throw new Error(
        "BadRequest: Invalid file type. Please upload a JPEG or PNG."
      );
    }
    if (file.name.includes("poor_quality")) {
      throw new Error("PoorImageQuality");
    }

    return {
      verificationId: `vid-${Date.now()}`,
      s3Key: `uploads/${file.name}`,
      processingStatus: "PENDING_OCR",
    };
  },

  startLivenessCheck: async (): Promise<LivenessData> => {
    console.log("API CALL: /v1/start-liveness");
    await new Promise((res) => setTimeout(res, 500));
    return {
      sessionId: `sid-${Date.now()}`,
      gestures: ["Blink slowly", "Smile", "Turn head left"],
    };
  },
};
