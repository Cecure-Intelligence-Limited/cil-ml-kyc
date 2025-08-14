"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import { XCircleIcon } from "@/components/ui/Icons";

export const GenericErrorScreen: FC = () => {
  const { setStep, errorMessage } = useKYC();
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-300 text-center">
        <XCircleIcon className="text-6xl mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          An Error Occurred
        </h2>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected issue. Please try again.
        </p>
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-6">
          <strong>Details:</strong> {errorMessage}
        </p>
        <button
          onClick={() => setStep("welcome")}
          className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};
