// src/hooks/useKYC.ts
import { useContext } from "react";
import { KYCContext } from "@/context/KycContext";
import { KycContextType } from "@/types";

export const useKYC = (): KycContextType => {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error("useKYC must be used within a KYCProvider");
  }
  return context;
};
