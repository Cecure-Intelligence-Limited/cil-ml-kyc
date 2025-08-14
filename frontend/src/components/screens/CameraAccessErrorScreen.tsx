"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import { WarningIcon } from "@/components/ui/Icons";

export const CameraAccessErrorScreen: FC = () => {
  const { setStep } = useKYC();
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
        <WarningIcon className="text-6xl mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Camera Access Required
        </h2>
        <p className="text-gray-600 mb-6">
          Camera access is required for the liveness check. Please enable camera
          access in your browser settings and try again.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
          <h3 className="font-bold text-gray-700 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Click the camera icon in your browser&apos;s address bar.</li>
            <li>
              Select &quot;Always allow this site to access your camera&quot;.
            </li>
            <li>Reload the page and try again.</li>
          </ol>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setStep("livenessCheckMethod")}
            className="w-full sm:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300"
          >
            Try Again
          </button>
          <button
            onClick={() => setStep("livenessCheck")}
            className="w-full sm:w-auto bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700"
          >
            Use Simulation Mode
          </button>
        </div>
      </div>
    </div>
  );
};
