"use client";
import { FC, ChangeEvent } from "react";
import { useKYC } from "@/hooks/useKYC";
import { ArrowLeftIcon } from "@/components/ui/Icons";

export const ReviewScreen: FC = () => {
  const { setStep, extractedData, setExtractedData } = useKYC();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExtractedData({ ...extractedData, [name]: value });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <button
          onClick={() => setStep("livenessCheck")}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon />
          <span className="ml-2 hidden sm:inline">Back</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Review Information
        </h1>
        <span className="text-sm text-gray-500">Step 3 of 5</span>
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Verify Extracted Information
        </h2>
        <p className="text-gray-500 mb-8">
          Please correct any fields that are inaccurate.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={extractedData.fullName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={extractedData.dob}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Document Number
            </label>
            <input
              type="text"
              name="documentNumber"
              value={extractedData.documentNumber}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={extractedData.expiryDate}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>
        <div className="mt-8">
          <button
            onClick={() => setStep("processing")}
            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
          >
            Confirm and Continue
          </button>
        </div>
      </div>
    </div>
  );
};
