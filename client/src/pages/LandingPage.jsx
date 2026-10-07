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
  Stethoscope,
  Video,
  Bot,
  Users,
  Activity,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handlePatientDemo = async () => {
    try {
      await login('demo@example.com', 'Demo@123');
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  const handleDoctorDemo = async () => {
    try {
      await login('doctor.rahul@prescripto.com', 'Doctor@123');
      navigate('/doctor/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col selection:bg-blue-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/30 to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>PRESCRIPTO • AI-Powered Digital Healthcare Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Find the Right Doctor, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Without the Long Wait.
            </span>
          </h1>

          <h2 className="text-lg sm:text-2xl font-bold text-slate-700 tracking-tight mt-3 mb-6">
            Live Patient Queues • Real-Time Waiting Times • Video Telehealth • AI Health Assistant • Smart Prescriptions
          </h2>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Connect with certified doctors, view live clinic traffic before leaving home, consult online with zero waiting, and manage your complete medication regimen — all from one integrated healthcare platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handlePatientDemo}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Try Demo as Patient</span>
                </button>

                <button
                  onClick={handleDoctorDemo}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Try Doctor Command Center</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Hero Pillars Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
            Complete Digital Health Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Everything You Need, In One Unified Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Doctor Traffic & Queue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Live Patient Traffic</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Real-time calculation of how busy each physician is. Know exact queue numbers (#3, #7) and expected waiting times (~20 min) before stepping out.
            </p>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              🟢 Live Queue Tracking
            </span>
          </div>

          {/* Pillar 2: Video Consultations */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Instant Telehealth Video</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              HD encrypted audio/video consultations directly from your browser. Seamless screen sharing, real-time in-call clinical notes, and zero waiting rooms.
            </p>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              📹 End-to-End Encrypted
            </span>
          </div>

          {/* Pillar 3: AI Health Assistant */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">AI Health Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ask 24/7 educational questions regarding medical abbreviations (BID, TID, OD), meal-timing instructions, and medication administration advice.
            </p>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              🤖 Intelligent &amp; Safe
            </span>
          </div>

          {/* Pillar 4: Scan Prescriptions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Prescription OCR Scanner</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Upload physical doctor prescription slips to extract medication names, dosage strength, frequency, and instructions automatically.
            </p>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
              📷 OCR + Gemini Pipeline
            </span>
          </div>

          {/* Pillar 5: Medication Schedule */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Automated Dose Schedules</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Turn complex prescriptions into automated daily reminders with precise timings, food instructions, and browser alerts so you never miss a dose.
            </p>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ⏰ Timely Reminders
            </span>
          </div>

          {/* Pillar 6: Adherence Analytics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Adherence Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Comprehensive compliance scores, streaks, and charts helping you complete entire courses of treatment successfully.
            </p>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              📊 Compliance Insights
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
