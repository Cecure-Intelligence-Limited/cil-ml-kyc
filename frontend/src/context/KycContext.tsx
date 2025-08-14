"use client";

import { createContext, useState, ReactNode } from "react";
import {
  KycContextType,
  KycStep,
  VerificationData,
  ExtractedData,
} from "@/types";

// Create the context with the correct type, defaulting to null
export const KYCContext = createContext<KycContextType | null>(null);

export const KYCProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<KycStep>("welcome");
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    fullName: "John Michael Smith",
    dob: "1985-03-15",
    documentNumber: "123456789",
    expiryDate: "2030-12-31",
  });

  const value: KycContextType = {
    step,
    setStep,
    verificationData,
    setVerificationData,
    file,
    setFile,
    errorMessage,
    setErrorMessage,
    extractedData,
    setExtractedData,
  };

  return <KYCContext.Provider value={value}>{children}</KYCContext.Provider>;
};
