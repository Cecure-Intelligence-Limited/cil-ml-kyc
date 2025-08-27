"use client";
import {
  useState,
  useEffect,
  useCallback,
  FC,
  ChangeEvent,
  DragEvent,
} from "react";
import { useKYC } from "@/hooks/useKYC";
import { ArrowLeftIcon, CameraIcon } from "@/components/ui/Icons";
import { api } from "@/services/api";
import Image from "next/image";

export const DocumentUploadScreen: FC = () => {
  const { setStep, setVerificationData, setFile, file, setErrorMessage } =
    useKYC();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>("passport");
  const [countryCode, setCountryCode] = useState<string>("US");
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        setFile(event.dataTransfer.files[0]);
        setUploadError("");
      }
    },
    [setFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    setErrorMessage(null);
    try {
      const metadata = { documentType, countryCode };
      const response = await api.uploadDocument(file, metadata);
      setVerificationData(response);
      setStep("livenessCheck");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An unknown error occurred.";
      if (msg.startsWith("PayloadTooLarge") || msg.startsWith("BadRequest")) {
        setUploadError(msg.split(": ")[1]);
      } else if (msg === "PoorImageQuality") {
        setStep("imageQualityError");
      } else {
        setErrorMessage(msg);
        setStep("genericError");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <button
          onClick={() => setStep("welcome")}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon />
          <span className="ml-2 hidden sm:inline">Back</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Document Upload
        </h1>
        <span className="text-sm text-gray-500">Step 1 of 5</span>
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
          <div>
            <label
              htmlFor="countryCode"
              className="block text-sm font-medium text-gray-700"
            >
              Country
            </label>
            <select
              id="countryCode"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="NG">Nigeria</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="documentType"
              className="block text-sm font-medium text-gray-700"
            >
              Document Type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="passport">Passport</option>
              <option value="drivers-license">Drivers License</option>
              <option value="national-id">National ID</option>
            </select>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-8 sm:p-12 mb-4 relative hover:bg-gray-50 transition-colors ${
            uploadError ? "border-red-500" : "border-gray-300"
          }`}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
          />
          <CameraIcon className="text-5xl sm:text-6xl mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-semibold mb-2">
            Drag and drop your document here
          </p>
          <p className="text-gray-500">or click to browse</p>
        </div>
        {uploadError && (
          <p className="text-red-600 text-sm mb-4">{uploadError}</p>
        )}

        {preview && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Document Preview</h3>
            <Image
              width={300}
              height={300}
              src={preview}
              alt="Document Preview"
              className="max-h-48 mx-auto rounded-lg shadow-md border"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full sm:w-auto flex items-center justify-center bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 shadow-md"
          >
            {isUploading ? "Uploading..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};
