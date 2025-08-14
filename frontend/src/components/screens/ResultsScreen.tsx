"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import { CheckCircleIcon, DownloadIcon } from "@/components/ui/Icons";

export const ResultsScreen: FC = () => {
  const { setStep } = useKYC();
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
        <CheckCircleIcon className="text-7xl text-green-500 mx-auto" />
        <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-2">
          Verification Successful!
        </h2>
        <p className="text-gray-500 mb-8">
          Your identity has been confirmed and you are all set.
        </p>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 divide-y sm:divide-y-0 sm:divide-x divide-green-200 grid sm:grid-cols-2">
          <div className="py-2 sm:py-0">
            <p className="text-sm text-green-700">Confidence Score</p>
            <p className="text-2xl font-bold text-green-800">94%</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-sm text-green-700">Processing Time</p>
            <p className="text-2xl font-bold text-green-800">87s</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300">
            <DownloadIcon className="mr-2" />
            Download
          </button>
          <button
            onClick={() => setStep("welcome")}
            className="w-full sm:w-auto bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
