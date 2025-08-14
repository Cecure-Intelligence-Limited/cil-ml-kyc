"use client";
import { useState, useEffect, FC, ReactNode } from "react";
import { useKYC } from "@/hooks/useKYC";
import { CheckCircleIcon } from "@/components/ui/Icons";

interface ProcessingStep {
  name: string;
  status: "Completed" | "In Progress" | "Pending";
}

export const ProcessingScreen: FC = () => {
  const { setStep } = useKYC();
  const initialSteps: ProcessingStep[] = [
    { name: "Document Uploaded", status: "Completed" },
    { name: "Liveness Check Complete", status: "Completed" },
    { name: "Data Extraction", status: "Pending" },
    { name: "Face Matching", status: "Pending" },
    // NOTE: Sanctions Screening removed for V1
  ];
  const [processingSteps, setProcessingSteps] =
    useState<ProcessingStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStepIndex > 2) {
      // Start updating from the first pending step
      setProcessingSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        const internalIndex = currentStepIndex - 1;
        if (internalIndex < newSteps.length) {
          newSteps[internalIndex].status = "Completed";
          if (internalIndex + 1 < newSteps.length) {
            newSteps[internalIndex + 1].status = "In Progress";
          }
        }
        return newSteps;
      });
    }
    if (currentStepIndex > processingSteps.length + 1) {
      setTimeout(() => setStep("results"), 1000);
    }
  }, [currentStepIndex, setStep, processingSteps.length]);

  const getStatusIcon = (status: ProcessingStep["status"]): ReactNode => {
    switch (status) {
      case "Completed":
        return <CheckCircleIcon className="text-green-500 text-2xl" />;
      case "In Progress":
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
        <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">
          Verifying your identity...
        </h2>
        <p className="text-gray-500 mb-8">This will take a few moments.</p>
        <ul className="space-y-4 text-left">
          {processingSteps.map((step) => (
            <li key={step.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3">{getStatusIcon(step.status)}</div>
                <span
                  className={`transition-colors ${
                    step.status === "Completed"
                      ? "text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
