"use client";
import { FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  CameraIcon,
  UserCircleCheckIcon,
  ShieldLockIcon,
} from "@/components/ui/Icons";

export const WelcomeScreen: FC = () => {
  const { setStep } = useKYC();
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-lg border border-gray-200/80">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
          Welcome to KYC
        </h1>
        <p className="text-center text-gray-600 mb-8">
          We will help you verify your identity quickly and securely. This
          process takes about 90 seconds and requires:
        </p>
        <ul className="space-y-4 mb-8 text-left">
          <li className="flex items-start">
            <CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-800">
                A valid ID document
              </span>
              <p className="text-gray-500 text-sm">
                (passport, drivers license)
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-800">
                A device with camera access
              </span>
              <p className="text-gray-500 text-sm">
                For document capture and liveness check
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-800">
                Good lighting conditions
              </span>
              <p className="text-gray-500 text-sm">
                Ensure clear document visibility
              </p>
            </div>
          </li>
        </ul>
        <div className="bg-blue-50 p-4 rounded-lg flex items-center mb-8 border border-blue-200">
          <InformationCircleIcon className="text-blue-500 mr-3 text-xl flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <span className="font-bold">Privacy Notice:</span> Your data is
            encrypted and automatically deleted after 90 days for your privacy.
          </p>
        </div>
        <button
          onClick={() => setStep("documentUpload")}
          className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Start Verification
        </button>
      </div>
      <div className="flex flex-col sm:flex-row justify-around items-center mt-10 text-sm text-gray-600 space-y-6 sm:space-y-0">
        <div className="text-center w-40">
          <CameraIcon className="text-4xl mx-auto text-gray-500" />
          <p className="mt-2 font-semibold">Secure Capture</p>
        </div>
        <div className="text-center w-40">
          <UserCircleCheckIcon className="text-4xl mx-auto text-gray-500" />
          <p className="mt-2 font-semibold">ID Verification</p>
        </div>
        <div className="text-center w-40">
          <ShieldLockIcon className="text-4xl mx-auto text-gray-500" />
          <p className="mt-2 font-semibold">Privacy Protected</p>
        </div>
      </div>
    </div>
  );
};
