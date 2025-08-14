// src/app/page.tsx
"use client";

import { KYCProvider } from "@/context/KycContext";
import { useKYC } from "@/hooks/useKYC";

// Import all your new screen components
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { DocumentUploadScreen } from "@/components/screens/DocumentUploadScreen";
import { LivenessCheckScreen } from "@/components/screens/LivenessCheckScreen";
import { ReviewScreen } from "@/components/screens/ReviewScreen";
import { ProcessingScreen } from "@/components/screens/ProcessingScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { CameraAccessErrorScreen } from "@/components/screens/CameraAccessErrorScreen";
import { ImageQualityErrorScreen } from "@/components/screens/ImageQualityErrorScreen";
import { LivenessFailureScreen } from "@/components/screens/LivenessFailureScreen";
import { GenericErrorScreen } from "@/components/screens/GenericErrorScreen";
import { ShieldCheckIcon, QuestionMarkCircleIcon } from "@/components/ui/Icons";

// This component now only handles the routing logic
const AppContent = () => {
  const { step } = useKYC();

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeScreen />;
      case "documentUpload":
        return <DocumentUploadScreen />;
      case "livenessCheck":
        return <LivenessCheckScreen />;
      case "review":
        return <ReviewScreen />;
      case "processing":
        return <ProcessingScreen />;
      case "results":
        return <ResultsScreen />;
      case "cameraAccessError":
        return <CameraAccessErrorScreen />;
      case "imageQualityError":
        return <ImageQualityErrorScreen />;
      case "livenessFailure":
        return <LivenessFailureScreen />;
      case "genericError":
        return <GenericErrorScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans text-gray-800 antialiased">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 fixed top-0 left-0 w-full z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="text-3xl text-blue-600" />
              <span className="font-bold text-xl text-gray-800">
                KYC Verification
              </span>
            </div>
            <div>
              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                <QuestionMarkCircleIcon className="text-3xl" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {renderStep()}
      </main>
    </div>
  );
};

// The main export is now just the provider wrapping the content
export default function KycVerificationPage() {
  return (
    <KYCProvider>
      <AppContent />
    </KYCProvider>
  );
}
