import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function QueueStatusBanner({ appointment, onRefresh }) {
  if (!appointment) return null;

  const {
    _id,
    doctorName,
    doctorStatus,
    queueNumber,
    patientsAhead = 0,
    estimatedWaitMinutes = 0,
    statusMessage,
    type,
    time,
    date,
    status,
    meetingRoomId,
    currentServingNumber,
  } = appointment.queueInfo ? { ...appointment, ...appointment.queueInfo } : appointment;

  const isVideo = type === 'video';
  const isInConsultation = status === 'in_consultation';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-5 sm:p-6 shadow-lg shadow-blue-500/10 mb-6">
      {/* Background graphic */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Queue Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE PATIENT QUEUE</span>
            <span className="opacity-60">•</span>
            <span>{date === new Date().toISOString().split('T')[0] ? 'Today' : date} at {time}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Dr. {doctorName || appointment.doctorId?.name || 'Assigned Physician'}
          </h3>

          <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>{statusMessage || `${patientsAhead} patients ahead of you.`}</span>
          </p>
        </div>

        {/* Center: Live Numbers */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-white/15 w-full lg:w-auto">
          <div className="text-center px-2">
            <span className="text-[10px] sm:text-xs text-blue-100 uppercase tracking-wider block font-medium">
              Your Queue
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              #{queueNumber || 1}
            </span>
          </div>

          <div className="text-center px-2 border-x border-white/15">
            <span className="text-[10px] sm:text-xs text-blue-100 uppercase tracking-wider block font-medium">
              Patients Ahead
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">
              {isInConsultation ? 0 : patientsAhead}
            </span>
          </div>

          <div className="text-center px-2">
            <span className="text-[10px] sm:text-xs text-blue-100 uppercase tracking-wider block font-medium">
              Est. Wait
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">
              {isInConsultation ? 'Now' : `${estimatedWaitMinutes}m`}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {isVideo && (
            <Link
              to={`/video-consultation/${_id || appointment._id}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-700/30"
            >
              <Video className="w-4 h-4" />
              <span>Join Video Consultation</span>
            </Link>
          )}

          <Link
            to="/appointments"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
