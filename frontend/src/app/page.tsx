"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

// --- GLOBAL STATE MANAGEMENT (React Context) ---

const KYCContext = createContext(null);

export const KYCProvider = ({ children }) => {
    const [step, setStep] = useState('welcome');
    const [verificationData, setVerificationData] = useState(null);
    const [file, setFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [extractedData, setExtractedData] = useState({
        fullName: 'John Michael Smith',
        dob: '1985-03-15',
        documentNumber: '123456789',
        expiryDate: '2030-12-31',
    });

    const value = {
        step,
        setStep,
        verificationData,
        setVerificationData,
        file,
        setFile,
        errorMessage,
        setErrorMessage,
        extractedData,
        setExtractedData,
    };

    return <KYCContext.Provider value={value}>{children}</KYCContext.Provider>;
};

export const useKYC = () => {
    const context = useContext(KYCContext);
    if (!context) {
        throw new Error('useKYC must be used within a KYCProvider');
    }
    return context;
};


// --- ICON COMPONENTS (using Google Material Symbols) ---
const MaterialIcon = ({ iconName, className }) => (
    <span className={`material-symbols-outlined ${className}`}>{iconName}</span>
);

const ShieldCheckIcon = ({ className }) => <MaterialIcon iconName="verified_user" className={className} />;
const CameraIcon = ({ className }) => <MaterialIcon iconName="photo_camera" className={className} />;
const UserCircleCheckIcon = ({ className }) => <MaterialIcon iconName="badge" className={className} />;
const ShieldLockIcon = ({ className }) => <MaterialIcon iconName="shield_lock" className={className} />;
const CheckCircleIcon = ({ className }) => <MaterialIcon iconName="check_circle" className={className} />;
const XCircleIcon = ({ className }) => <MaterialIcon iconName="cancel" className={className} />;
const InformationCircleIcon = ({ className }) => <MaterialIcon iconName="info" className={className} />;
const ArrowLeftIcon = ({ className }) => <MaterialIcon iconName="arrow_back" className={className} />;
const QuestionMarkCircleIcon = ({ className }) => <MaterialIcon iconName="help_outline" className={className} />;
const WarningIcon = ({ className }) => <MaterialIcon iconName="warning" className={className} />;
const PlayCircleIcon = ({ className }) => <MaterialIcon iconName="play_circle" className={className} />;
const EditIcon = ({ className }) => <MaterialIcon iconName="edit" className={className} />;
const DownloadIcon = ({ className }) => <MaterialIcon iconName="download" className={className} />;
const ShareIcon = ({ className }) => <MaterialIcon iconName="share" className={className} />;
const ReplayIcon = ({ className }) => <MaterialIcon iconName="replay" className={className} />;


// --- API SIMULATION ---
const api = {
    uploadDocument: async (file, metadata) => {
        console.log("API CALL: /v1/upload-document", { fileName: file.name, metadata });
        await new Promise(res => setTimeout(res, 1000));
        if (file.size > 5 * 1024 * 1024) { throw new Error("PayloadTooLarge: File exceeds 5MB limit."); }
        if (!['image/jpeg', 'image/png'].includes(file.type)) { throw new Error("BadRequest: Invalid file type. Please upload a JPEG or PNG."); }
        if (file.name.includes('poor_quality')) { throw new Error("PoorImageQuality"); }
        return { verificationId: `vid-${Date.now()}`, s3Key: `uploads/${file.name}`, processingStatus: 'PENDING_OCR' };
    },
    startLivenessCheck: async () => {
        console.log("API CALL: /v1/start-liveness");
        await new Promise(res => setTimeout(res, 500));
        return { sessionId: `sid-${Date.now()}`, gestures: ['Blink slowly', 'Smile', 'Turn head left'] };
    }
};

// --- PAGE & FLOW COMPONENTS ---

const WelcomeScreen = () => {
    const { setStep } = useKYC();
    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-lg border border-gray-200/80">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">Welcome to KYC</h1>
                <p className="text-center text-gray-600 mb-8">
                    We'll help you verify your identity quickly and securely. This process takes about 90 seconds and requires:
                </p>
                <ul className="space-y-4 mb-8 text-left">
                    <li className="flex items-start"><CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" /><div><span className="font-semibold text-gray-800">A valid ID document</span><p className="text-gray-500 text-sm">(passport, driver's license)</p></div></li>
                    <li className="flex items-start"><CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" /><div><span className="font-semibold text-gray-800">A device with camera access</span><p className="text-gray-500 text-sm">For document capture and liveness check</p></div></li>
                    <li className="flex items-start"><CheckCircleIcon className="text-green-500 mr-3 mt-1 text-2xl flex-shrink-0" /><div><span className="font-semibold text-gray-800">Good lighting conditions</span><p className="text-gray-500 text-sm">Ensure clear document visibility</p></div></li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg flex items-center mb-8 border border-blue-200">
                    <InformationCircleIcon className="text-blue-500 mr-3 text-xl flex-shrink-0" />
                    <p className="text-sm text-blue-800"><span className="font-bold">Privacy Notice:</span> Your data is encrypted and automatically deleted after 90 days for your privacy.</p>
                </div>
                <button onClick={() => setStep('documentUpload')} className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg">Start Verification</button>
            </div>
            <div className="flex flex-col sm:flex-row justify-around items-center mt-10 text-sm text-gray-600 space-y-6 sm:space-y-0">
                <div className="text-center w-40"><CameraIcon className="text-4xl mx-auto text-gray-500" /><p className="mt-2 font-semibold">Secure Capture</p></div>
                <div className="text-center w-40"><UserCircleCheckIcon className="text-4xl mx-auto text-gray-500" /><p className="mt-2 font-semibold">ID Verification</p></div>
                <div className="text-center w-40"><ShieldLockIcon className="text-4xl mx-auto text-gray-500" /><p className="mt-2 font-semibold">Privacy Protected</p></div>
            </div>
        </div>
    );
};

const DocumentUploadScreen = () => {
    const { setStep, setVerificationData, setFile, file, setErrorMessage } = useKYC();
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [documentType, setDocumentType] = useState('passport');
    const [countryCode, setCountryCode] = useState('US');
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError('');
        }
    };
    
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            setFile(event.dataTransfer.files[0]);
            setUploadError('');
        }
    }, [setFile]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadError('');
        setErrorMessage(null);
        try {
            const metadata = { documentType, countryCode };
            const response = await api.uploadDocument(file, metadata);
            setVerificationData(response);
            setStep('livenessCheckMethod');
        } catch (error) {
            const msg = error.message || "An unknown error occurred.";
            if (msg.startsWith('PayloadTooLarge') || msg.startsWith('BadRequest')) {
                setUploadError(msg.split(': ')[1]);
            } else if (msg === 'PoorImageQuality') {
                setStep('imageQualityError');
            } else {
                setErrorMessage(msg);
                setStep('genericError');
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <button onClick={() => setStep('welcome')} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"><ArrowLeftIcon /><span className="ml-2 hidden sm:inline">Back</span></button>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Document Upload</h1>
                <span className="text-sm text-gray-500">Step 1 of 5</span>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
                <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
                    <div>
                        <label htmlFor="countryCode" className="block text-sm font-medium text-gray-700">Country</label>
                        <select id="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="NG">Nigeria</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">Document Type</label>
                        <select id="documentType" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="passport">Passport</option>
                            <option value="drivers-license">Driver's License</option>
                            <option value="national-id">National ID</option>
                        </select>
                    </div>
                </div>
                
                <div onDrop={handleDrop} onDragOver={handleDragOver} className={`border-2 border-dashed rounded-lg p-8 sm:p-12 mb-4 relative hover:bg-gray-50 transition-colors ${uploadError ? 'border-red-500' : 'border-gray-300'}`}>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/png, image/jpeg" />
                    <CameraIcon className="text-5xl sm:text-6xl mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-semibold mb-2">Drag and drop your document here</p>
                    <p className="text-gray-500">or click to browse</p>
                </div>
                {uploadError && <p className="text-red-600 text-sm mb-4">{uploadError}</p>}

                {preview && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">Document Preview</h3>
                        <img src={preview} alt="Document Preview" className="max-h-48 mx-auto rounded-lg shadow-md border" />
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button onClick={handleUpload} disabled={!file || isUploading} className="w-full sm:w-auto flex items-center justify-center bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 shadow-md">
                        {isUploading ? 'Uploading...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LivenessCheckMethodScreen = () => {
    const { setStep } = useKYC();
    const checkCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setStep('livenessCheck');
        } catch (err) {
            console.error("Camera access denied:", err);
            setStep('cameraAccessError');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">Choose Liveness Check Method</h2>
            <p className="text-gray-500 text-center mb-8">Select how you'd like to proceed with the liveness verification</p>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center mb-6">
                <button onClick={checkCamera} className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors mb-4 flex items-center justify-center shadow-md"><CameraIcon className="text-xl mr-2" />Use Real Camera</button>
                <button onClick={() => setStep('livenessCheck')} className="w-full bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"><PlayCircleIcon className="text-xl mr-2" />Use Simulation Mode</button>
            </div>
        </div>
    );
};

const LivenessCheckScreen = () => {
    const { setStep } = useKYC();
    const [gestures, setGestures] = useState([]);
    const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        api.startLivenessCheck().then(data => setGestures(data.gestures));
    }, []);

    useEffect(() => {
        if (gestures.length > 0) {
            const interval = setInterval(() => {
                setCurrentGestureIndex(prevIndex => {
                    if (prevIndex < gestures.length - 1) {
                        setProgress(((prevIndex + 1) / gestures.length) * 100);
                        return prevIndex + 1;
                    } else {
                        clearInterval(interval);
                        setProgress(100);
                        setTimeout(() => setStep('review'), 1000);
                        return prevIndex;
                    }
                });
            }, 2000); // Simulate completing a gesture every 2 seconds
            return () => clearInterval(interval);
        }
    }, [gestures, setStep]);
    
    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Complete the Liveness Check</h2>
            <p className="text-gray-500 text-center mb-8">Follow the instructions to verify you're a real person.</p>
            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3 bg-black rounded-2xl overflow-hidden aspect-square md:aspect-auto shadow-lg flex items-center justify-center">
                    <div className="text-center text-white">
                        <CameraIcon className="text-6xl mx-auto" />
                        <p>Camera Feed</p>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/80">
                        <h3 className="font-bold text-gray-700 mb-3 text-lg">Current Instruction</h3>
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <p className="font-bold text-xl text-blue-600">{gestures[currentGestureIndex] || 'Getting ready...'}</p>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-sm font-semibold text-gray-600">Progress</span>
                               <span className="text-sm font-bold text-gray-800">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/80 text-sm">
                        <h3 className="font-bold text-gray-700 mb-3">Tips for best results:</h3>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Ensure your face is evenly lit.</li>
                            <li>Remove glasses, hats, or masks.</li>
                            <li>Keep your device steady.</li>
                        </ul>
                         <button onClick={() => setStep('livenessFailure')} className="text-sm text-red-600 hover:text-red-800 mt-4 flex items-center gap-1">
                            <WarningIcon /> Simulate Failure
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReviewScreen = () => {
    const { setStep, extractedData, setExtractedData } = useKYC();
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setExtractedData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
             <div className="flex justify-between items-center mb-6 sm:mb-8">
                <button onClick={() => setStep('livenessCheck')} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"><ArrowLeftIcon /><span className="ml-2 hidden sm:inline">Back</span></button>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Review Information</h1>
                <span className="text-sm text-gray-500">Step 3 of 5</span>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Verify Extracted Information</h2>
                <p className="text-gray-500 mb-8">Please correct any fields that are inaccurate.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="fullName" value={extractedData.fullName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input type="date" name="dob" value={extractedData.dob} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Document Number</label>
                        <input type="text" name="documentNumber" value={extractedData.documentNumber} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input type="date" name="expiryDate" value={extractedData.expiryDate} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
                 <div className="mt-8">
                     <button onClick={() => setStep('processing')} className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-md">Confirm and Continue</button>
                </div>
            </div>
        </div>
    );
};

const ProcessingScreen = () => {
    const { setStep } = useKYC();
    const [processingSteps, setProcessingSteps] = useState([
        { name: 'Document Uploaded', status: 'Completed' },
        { name: 'Liveness Check Complete', status: 'Completed' },
        { name: 'Data Extraction', status: 'Pending' },
        { name: 'Face Matching', status: 'Pending' },
        { name: 'Sanctions Screening', status: 'Pending' },
    ]);
    const [currentStepIndex, setCurrentStepIndex] = useState(2);

    useEffect(() => {
        const interval = setInterval(() => {
            setProcessingSteps(prevSteps => {
                const newSteps = [...prevSteps];
                if (currentStepIndex < newSteps.length) {
                    newSteps[currentStepIndex].status = 'Completed';
                     if(currentStepIndex + 1 < newSteps.length) {
                        newSteps[currentStepIndex + 1].status = 'In Progress';
                     }
                }
                return newSteps;
            });
            setCurrentStepIndex(prev => prev + 1);
        }, 1500);

        if (currentStepIndex > processingSteps.length) {
            clearInterval(interval);
            setTimeout(() => setStep('results'), 1000);
        }

        return () => clearInterval(interval);
    }, [currentStepIndex, processingSteps.length, setStep]);

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed': return <CheckCircleIcon className="text-green-500 text-2xl" />;
            case 'In Progress': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
            default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
                <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Verifying your identity...</h2>
                <p className="text-gray-500 mb-8">This will take a few moments.</p>
                <ul className="space-y-4 text-left">
                    {processingSteps.map(step => (
                        <li key={step.name} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="mr-3">{getStatusIcon(step.status)}</div>
                                <span className={`transition-colors ${step.status === 'Completed' ? 'text-gray-400' : 'text-gray-800'}`}>{step.name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ResultsScreen = () => {
    const { setStep } = useKYC();
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
                <CheckCircleIcon className="text-7xl text-green-500 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Verification Successful!</h2>
                <p className="text-gray-500 mb-8">Your identity has been confirmed and you're all set.</p>
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
                    <button className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300"><DownloadIcon className="mr-2" />Download</button>
                    <button onClick={() => setStep('welcome')} className="w-full sm:w-auto bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700">Return to Dashboard</button>
                </div>
            </div>
        </div>
    );
};


// --- ERROR SCREENS ---

const CameraAccessErrorScreen = () => {
    const { setStep } = useKYC();
    return (
    <div className="w-full max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
            <WarningIcon className="text-6xl mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Camera Access Required</h2>
            <p className="text-gray-600 mb-6">Camera access is required for the liveness check. Please enable camera access in your browser settings and try again.</p>
            <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    <li>Click the camera icon in your browser's address bar.</li>
                    <li>Select "Always allow this site to access your camera".</li>
                    <li>Reload the page and try again.</li>
                </ol>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button onClick={() => setStep('livenessCheckMethod')} className="w-full sm:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300">Try Again</button>
                <button onClick={() => setStep('livenessCheck')} className="w-full sm:w-auto bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700">Use Simulation Mode</button>
            </div>
        </div>
    </div>
)};

const ImageQualityErrorScreen = () => {
    const { setStep, file } = useKYC();
    return (
    <div className="w-full max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200/80 text-center">
            <WarningIcon className="text-6xl mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Image Quality Issue</h2>
            <p className="text-gray-600 mb-4">The image quality is too low for processing. Please upload a clearer image.</p>
            {file && <img src={URL.createObjectURL(file)} alt="Poor quality preview" className="max-h-40 mx-auto rounded-lg shadow-md mb-4 opacity-50 border" />}
            <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Please ensure:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>The document is in good lighting.</li>
                    <li>The entire document is clearly visible, with no cut-off edges.</li>
                    <li>There is no glare or shadows on the document.</li>
                </ul>
            </div>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setStep('documentUpload')} className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700">Upload Different Image</button>
            </div>
        </div>
    </div>
)};

const LivenessFailureScreen = () => {
    const { setStep } = useKYC();
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
                <XCircleIcon className="text-7xl text-red-500 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Liveness Check Failed</h2>
                <p className="text-gray-500 mb-6">We couldn't verify you're a real person. This can happen due to a few reasons.</p>
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
                    <button onClick={() => setStep('livenessCheck')} className="w-full sm:w-auto flex items-center justify-center bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700">
                        <ReplayIcon className="mr-2" /> Try Again
                    </button>
                    <button onClick={() => setStep('welcome')} className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300">
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
};

const GenericErrorScreen = () => {
    const { setStep, errorMessage } = useKYC();
    return (
     <div className="w-full max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-300 text-center">
            <XCircleIcon className="text-6xl mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">An Error Occurred</h2>
            <p className="text-gray-600 mb-6">We encountered an unexpected issue. Please try again.</p>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-6">
                <strong>Details:</strong> {errorMessage}
            </p>
            <button onClick={() => setStep('welcome')} className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700">Start Over</button>
        </div>
    </div>
)};


// --- MAIN APP COMPONENT ---

const AppContent = () => {
    const { step } = useKYC();

    useEffect(() => {
        const linkId = 'material-symbols-stylesheet';
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
            document.head.appendChild(link);
        }
    }, []);

    const renderStep = () => {
        switch (step) {
            case 'welcome': return <WelcomeScreen />;
            case 'documentUpload': return <DocumentUploadScreen />;
            case 'livenessCheckMethod': return <LivenessCheckMethodScreen />;
            case 'livenessCheck': return <LivenessCheckScreen />;
            case 'review': return <ReviewScreen />;
            case 'processing': return <ProcessingScreen />;
            case 'results': return <ResultsScreen />;
            case 'cameraAccessError': return <CameraAccessErrorScreen />;
            case 'imageQualityError': return <ImageQualityErrorScreen />;
            case 'livenessFailure': return <LivenessFailureScreen />;
            case 'genericError': return <GenericErrorScreen />;
            default: return <WelcomeScreen />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800 antialiased">
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 fixed top-0 left-0 w-full z-50">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="text-3xl text-blue-600" />
                            <span className="font-bold text-xl text-gray-800">KYC Verification</span>
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
}

export default function App() {
    return (
        <KYCProvider>
            <AppContent />
        </KYCProvider>
    );
}
