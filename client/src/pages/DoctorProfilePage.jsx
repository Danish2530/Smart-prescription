import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Video,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  Award,
  Languages,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import api from '../services/api';
import TrafficBadge from '../components/TrafficBadge';
import BookingModal from '../components/BookingModal';

export default function DoctorProfilePage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState('in_person');

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/doctors/${id}`);
      if (res.data.success) {
        setDoctor(res.data.doctor);
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      setError('Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading doctor profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Doctor Profile Unavailable</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'Doctor not found.'}</p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Find Doctor</span>
        </Link>
      </div>
    );
  }

  const {
    name,
    specialization,
    qualification,
    experience,
    clinicName,
    clinicAddress,
    city,
    consultationFee,
    rating,
    reviewCount,
    status,
    videoConsultationAvailable,
    languages = [],
    about,
    liveQueue = {},
  } = doctor;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Doctor Directory</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                {name
                  .replace(/^Dr\.\s*/, '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Practitioner
                  </span>
                </div>

                <p className="text-sm font-semibold text-blue-600">{specialization}</p>
                <p className="text-xs text-slate-500">{qualification}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{rating?.toFixed(1) || '4.8'}</span>
                    <span className="text-slate-400 font-normal">({reviewCount} reviews)</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="font-semibold text-slate-900">{experience} years</span> experience
                  </div>
                  <span>•</span>
                  <div>
                    Fee: <strong className="text-slate-900">₹{consultationFee}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                About the Physician
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {about ||
                  'Certified healthcare practitioner committed to providing comprehensive clinical assessments, tailored treatment plans, and continuous patient care.'}
              </p>
            </div>

            {/* Clinic Details */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block mb-1">
                  Clinic &amp; Hospital
                </span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{clinicName}</span>
                </p>
                <p className="text-slate-500 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{clinicAddress}, {city}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block mb-1">
                  Spoken Languages
                </span>
                <p className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span>{languages.join(', ') || 'English, Hindi'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Queue Card & Action Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Practice Status
            </h3>

            {/* Live Traffic Badge */}
            <TrafficBadge
              trafficLevel={liveQueue.trafficLevel || 'LOW'}
              patientsWaiting={liveQueue.patientsWaiting || 0}
              estimatedWaitMinutes={liveQueue.estimatedWaitMinutes || 10}
            />

            {/* Queue Metrics Table */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Doctor Availability:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {status}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Patients in Queue:</span>
                <span className="font-bold text-slate-900">
                  {liveQueue.patientsWaiting || 0} waiting
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Estimated Waiting Time:</span>
                <span className="font-bold text-amber-600">
                  ~{liveQueue.estimatedWaitMinutes || 10} minutes
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Next Available Slot:</span>
                <span className="font-bold text-blue-700">
                  {liveQueue.nextAvailableSlot || 'Today 11:30 AM'}
                </span>
              </div>
            </div>

            {/* Booking Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setPreselectedType('in_person');
                  setIsBookingOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-200"
              >
                <Building2 className="w-4 h-4" />
                <span>Book In-Person Appointment</span>
              </button>

              {videoConsultationAvailable && (
                <button
                  onClick={() => {
                    setPreselectedType('video');
                    setIsBookingOpen(true);
                  }}
                  className="w-full py-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Video className="w-4 h-4 text-emerald-600" />
                  <span>Book Video Consultation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        doctor={doctor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          fetchDoctor();
        }}
      />
    </div>
  );
}
