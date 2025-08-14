// src/components/screens/LivenessCheckScreen.tsx
"use client";

import React, { useState, useEffect, useRef, FC } from "react";
import { useKYC } from "@/hooks/useKYC";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ReplayIcon,
  WarningIcon,
} from "@/components/ui/Icons";

const gestures = [
  {
    name: "Look Straight",
    instruction: "Hold still and look directly at the camera",
    duration: 3000,
  },
  {
    name: "Blink Slowly",
    instruction: "Blink your eyes slowly two times",
    duration: 4000,
  },
  { name: "Smile", instruction: "Please give a slight smile", duration: 3000 },
];

export const LivenessCheckScreen: FC = () => {
  const { setStep } = useKYC();

  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [livenessComplete, setLivenessComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported by this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (error: any) {
        console.error("Camera access error:", error);
        const message =
          error.name === "NotAllowedError"
            ? "Camera access was denied. Please enable it in your browser settings."
            : error.message || "Could not access the camera.";
        setCameraError(message);
      }
    };

    initCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (livenessComplete || cameraError) return;

    const currentGesture = gestures[currentGestureIndex];
    const timer = setTimeout(() => {
      if (currentGestureIndex < gestures.length - 1) {
        setCurrentGestureIndex(currentGestureIndex + 1);
        setProgress(0);
      } else {
        setIsProcessing(true);
        setTimeout(() => {
          setLivenessComplete(true);
          setIsProcessing(false);
        }, 1500);
      }
    }, currentGesture.duration);

    const progressInterval = setInterval(() => {
      setProgress((p) =>
        Math.min(100, p + 100 / (currentGesture.duration / 100))
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentGestureIndex, livenessComplete, cameraError]);

  const handleRetry = () => {
    setCurrentGestureIndex(0);
    setProgress(0);
    setLivenessComplete(false);
    setIsProcessing(false);
  };

  // --- ADDED THIS BLOCK TO DISPLAY THE ERROR ---
  if (cameraError) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
        <WarningIcon className="text-6xl mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Camera Error</h2>
        <p className="text-gray-600 mb-6">{cameraError}</p>
        <button
          onClick={() => setStep("documentUpload")}
          className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <button
          onClick={() => setStep("documentUpload")}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon />
          <span className="ml-2 hidden sm:inline">Back</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Liveness Check
        </h1>
        <span className="text-sm text-gray-500">Step 2 of 5</span>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80">
        <div className="relative w-full aspect-[3/4] max-w-sm mx-auto bg-black rounded-2xl overflow-hidden mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
              livenessComplete ? "opacity-0" : "opacity-100"
            }`}
            style={{
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
              borderRadius: "9999px",
              margin: "auto",
              width: "75%",
              height: "75%",
              border: `4px solid ${isProcessing ? "#3B82F6" : "#FFFFFF"}`,
            }}
          ></div>
          {livenessComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/50">
              <CheckCircleIcon className="text-8xl text-white" />
            </div>
          )}
        </div>

        {/* Status & Instructions */}
        <div className="mb-6 text-center">
          {!livenessComplete ? (
            <>
              <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                <h3 className="font-bold text-2xl text-blue-600">
                  {gestures[currentGestureIndex].name}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {gestures[currentGestureIndex].instruction}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center mb-4 border border-green-200">
              <h3 className="font-bold text-xl">Liveness Verified!</h3>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            disabled={!livenessComplete || isProcessing}
            className="flex items-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            <ReplayIcon className="mr-2" /> Retry
          </button>
          <button
            onClick={() => setStep("review")}
            disabled={!livenessComplete}
            className="w-full sm:w-auto bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
