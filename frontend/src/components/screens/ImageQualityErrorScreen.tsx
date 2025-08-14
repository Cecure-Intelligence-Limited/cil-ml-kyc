"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import { WarningIcon } from "@/components/ui/Icons";
import Image from "next/image";

export const ImageQualityErrorScreen: FC = () => {
  const { setStep, file } = useKYC();
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
        <WarningIcon className="text-6xl mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Image Quality Issue
        </h2>
        <p className="text-gray-600 mb-4">
          The image quality is too low for processing. Please upload a clearer
          image.
        </p>
        {file && (
          <Image
            width={160}
            height={160}
            src={URL.createObjectURL(file)}
            alt="Poor quality preview"
            className="max-h-40 mx-auto rounded-lg shadow-md mb-4 opacity-50 border"
          />
        )}
        <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
          <h3 className="font-bold text-gray-700 mb-2">Please ensure:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>The document is in good lighting.</li>
            <li>
              The entire document is clearly visible, with no cut-off edges.
            </li>
            <li>There is no glare or shadows on the document.</li>
          </ul>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setStep("documentUpload")}
            className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700"
          >
            Upload Different Image
          </button>
        </div>
      </div>
    </div>
  );
};
