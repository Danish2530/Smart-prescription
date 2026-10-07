import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Video,
  Calendar,
  Building2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import TrafficBadge from './TrafficBadge';

export default function DoctorCard({ doctor, onBookClick }) {
  const {
    _id,
    name,
    specialization,
    qualification,
    experience,
    clinicName,
    clinicAddress,
    consultationFee,
    rating,
    reviewCount,
    status,
    videoConsultationAvailable,
    liveQueue = {},
  } = doctor;

  const isAvailable = status === 'AVAILABLE';
  const isBusy = status === 'BUSY';
  const isOnBreak = status === 'ON_BREAK';

  const getStatusBadge = () => {
    if (isAvailable) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Available
        </span>
      );
    }
    if (isBusy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Busy (Consulting)
        </span>
      );
    }
    if (isOnBreak) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          On Break
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Offline
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Top Header: Avatar, Name, Specialization & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
              {name
                .replace(/^Dr\.\s*/, '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                  {name}
                </h3>
                <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" title="Verified Practitioner" />
              </div>
              <p className="text-xs font-medium text-blue-600">{specialization}</p>
              <p className="text-[11px] text-slate-400">{qualification}</p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Doctor Ratings & Experience */}
        <div className="flex items-center gap-3 pb-3.5 mb-3.5 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{rating?.toFixed(1) || '4.8'}</span>
            <span className="text-slate-400 font-normal">({reviewCount || 40})</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            <span className="font-semibold text-slate-800">{experience} yrs</span> exp
          </div>
          <span className="text-slate-300">•</span>
          <div className="font-semibold text-slate-900">₹{consultationFee}</div>
        </div>

        {/* Clinic info */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex items-start gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="font-medium text-slate-700 line-clamp-1">{clinicName}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{clinicAddress}</span>
          </div>
        </div>

        {/* Live Patient Traffic Section */}
        <div className="mb-4">
          <TrafficBadge
            trafficLevel={liveQueue.trafficLevel || 'LOW'}
            patientsWaiting={liveQueue.patientsWaiting || 0}
            estimatedWaitMinutes={liveQueue.estimatedWaitMinutes || 10}
          />
        </div>

        {/* Next Slot & Video Availability */}
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Next: <strong className="text-slate-900">{liveQueue.nextAvailableSlot || '11:30 AM'}</strong></span>
          </div>

          {videoConsultationAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              <Video className="w-3 h-3" />
              Video Available
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">In-Person Only</span>
          )}
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/doctors/${_id}`}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center transition shadow-2xs"
        >
          View Doctor
        </Link>
        <button
          onClick={() => onBookClick && onBookClick(doctor)}
          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition shadow-sm shadow-blue-200"
        >
          <span>Book Appointment</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
