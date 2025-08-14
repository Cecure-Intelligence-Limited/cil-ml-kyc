"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import { XCircleIcon, ReplayIcon } from "@/components/ui/Icons";

export const LivenessFailureScreen: FC = () => {
  const { setStep } = useKYC();
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
        <XCircleIcon className="text-7xl text-red-500 mx-auto" />
        <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-2">
          Liveness Check Failed
        </h2>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t verify you&apis;re a real person. This can happen due
          to a few reasons.
        </p>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-left">
          <h3 className="font-bold text-red-800 mb-2">Possible Causes:</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            <li>Poor or uneven lighting on your face.</li>
            <li>Face was partially obstructed by hair, glasses, or shadows.</li>
            <li>Gestures were not completed clearly.</li>
            <li>A non-human face (like a photo) was detected.</li>
          </ul>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setStep("livenessCheck")}
            className="w-full sm:w-auto flex items-center justify-center bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700"
          >
            <ReplayIcon className="mr-2" /> Try Again
          </button>
          <button
            onClick={() => setStep("welcome")}
            className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};
