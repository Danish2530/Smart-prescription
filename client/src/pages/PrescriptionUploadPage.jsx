import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

export default function PrescriptionUploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0: idle, 1: uploaded, 2: reading, 3: extracting, 4: ready
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    // Validate size (10 MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit. Please upload a smaller image.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a JPG, JPEG, PNG, WEBP, or PDF.');
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load sample demo prescription automatically
  const handleUseDemoPrescription = async () => {
    setError('');
    try {
      // Fetch sample prescription image generated on backend
      const res = await fetch('/uploads/sample-prescription.png');
      const blob = await res.blob();
      const demoFile = new File([blob], 'apollo-sample-prescription.png', { type: 'image/png' });
      handleFileSelect(demoFile);
    } catch (err) {
      // Fallback: create mock blob
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 600;
      sampleCanvas.height = 800;
      const ctx = sampleCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 800);
      ctx.fillStyle = '#0284c7';
      ctx.font = '22px sans-serif';
      ctx.fillText('APOLLO CLINIC - Sample Rx', 40, 60);
      sampleCanvas.toBlob((b) => {
        const demoFile = new File([b], 'sample-prescription.png', { type: 'image/png' });
        handleFileSelect(demoFile);
      });
    }
  };

  const handleStartOCR = async () => {
    if (!file) {
      setError('Please select or drag a prescription file first.');
      return;
    }

    setUploading(true);
    setError('');
    setStepIndex(1); // 1: Image uploaded

    const formData = new FormData();
    formData.append('prescription', file);

    try {
      // Subtle progress simulation matching prompt section 10
      setTimeout(() => setStepIndex(2), 500); // 2: Reading prescription (OCR)
      setTimeout(() => setStepIndex(3), 1100); // 3: Extracting medication details (AI)

      const response = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStepIndex(4); // 4: Preparing verification

      setTimeout(() => {
        if (response.data.success && response.data.prescription) {
          navigate(`/prescriptions/${response.data.prescription._id}`);
        }
      }, 700);
    } catch (err) {
      setUploading(false);
      setStepIndex(0);
      const msg =
        err.response?.data?.message ||
        'Unable to read this prescription. Try uploading a clearer image.';
      setError(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Prescription
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Take a photo or upload your prescription slip. MedSync will extract medications for your
          verification.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <span className="font-semibold block">Processing Issue:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Upload & Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag and drop prescription
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: JPG, JPEG, PNG, WEBP, or PDF (Max 10 MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB &bull; Ready for OCR analysis
                  </p>
                </div>
              </div>

              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove File"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Image Preview Box */}
            {previewUrl && (
              <div className="max-h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={previewUrl}
                  alt="Prescription Preview"
                  className="max-h-76 w-auto object-contain rounded-lg shadow-2xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Processing Stepper Indicator (Section 10) */}
        {uploading && (
          <div className="mt-6 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing prescription...</span>
            </h4>
            <div className="space-y-2 text-xs font-medium">
              <div className={`flex items-center gap-2 ${stepIndex >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {stepIndex >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="w-4 text-center">○</span>}
                <span>Image uploaded</span>
              </div>
              <div className={`flex items-center gap-2 ${stepIndex >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {stepIndex >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="w-4 text-center">{stepIndex === 1 ? '●' : '○'}</span>}
                <span>Reading prescription (OCR)</span>
              </div>
              <div className={`flex items-center gap-2 ${stepIndex >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {stepIndex >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="w-4 text-center">{stepIndex === 2 ? '●' : '○'}</span>}
                <span>Extracting medication details (AI)</span>
              </div>
              <div className={`flex items-center gap-2 ${stepIndex >= 4 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {stepIndex >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="w-4 text-center">{stepIndex === 3 ? '●' : '○'}</span>}
                <span>Preparing verification</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleUseDemoPrescription}
            disabled={uploading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Load Sample Demo Rx (Amoxicillin + Pantoprazole)</span>
          </button>

          <button
            type="button"
            onClick={handleStartOCR}
            disabled={!file || uploading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm shadow-blue-200 transition disabled:opacity-50"
          >
            {uploading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Extract &amp; Verify Prescription</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 font-semibold">Human-in-the-Loop Safety:</strong>
          <span className="ml-1">
            MedSync never generates active medication schedules automatically from raw OCR. You will review and confirm all extracted medicine names, dosages, and frequencies on the next verification screen.
          </span>
        </div>
      </div>
    </div>
  );
}
