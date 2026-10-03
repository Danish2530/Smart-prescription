import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle,
  Clock,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Pill,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async () => {
    try {
      await login('demo@example.com', 'Demo@123');
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col selection:bg-blue-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/20 to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Assisted Prescription Processing &amp; Adherence Tracking</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Smart Medication Adherence
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 tracking-tight mt-2 mb-6">
            From Prescription to Treatment Completion
          </h2>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Turn your prescription into a clear medication schedule, stay on track with timely
            reminders, and understand your medication routine.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-200 transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-200 transition"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleQuickDemo}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 font-semibold text-sm shadow-2xs transition"
                >
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Try Demo Account</span>
                </button>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 font-medium text-sm transition"
                >
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Guarantee pill */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Patient-Verified Safety Rule
            </span>
            <span>&bull;</span>
            <span>Instant OCR Extraction</span>
            <span>&bull;</span>
            <span>Zero Unclear Auto-Dosing</span>
          </div>
        </div>
      </section>

      {/* 4-Step User Journey Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Simple 4-Step Patient Journey
          </h3>
          <h4 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How MedSync Works
          </h4>
          <p className="text-slate-500 text-sm mt-2">
            Every step is designed for maximum clarity, safety, and effortless daily adherence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Step 1
            </div>
            <h5 className="text-base font-bold text-slate-900 mb-2">Upload Prescription</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload any digital photo or scanned prescription. The OCR engine reads the physician’s
              instructions in seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              Step 2
            </div>
            <h5 className="text-base font-bold text-slate-900 mb-2">Verify Medications</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compare AI-extracted medicine names, dosage, and frequency side-by-side with your original
              image before confirming.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Step 3
            </div>
            <h5 className="text-base font-bold text-slate-900 mb-2">Follow Your Schedule</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive smart browser dose reminders at 08:00 AM, 02:00 PM, and 08:00 PM tailored to your
              treatment course.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Step 4
            </div>
            <h5 className="text-base font-bold text-slate-900 mb-2">Track Adherence</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              View your overall adherence score, weekly compliance trend, and understand each
              prescribed medicine with trusted clinical info.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
