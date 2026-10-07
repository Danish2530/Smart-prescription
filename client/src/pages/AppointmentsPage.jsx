import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Plus,
  Activity,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import QueueStatusBanner from '../components/QueueStatusBanner';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past

  const fetchAppointments = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await api.get('/appointments/my');
      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Unable to load your appointments. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.post(`/appointments/${appointmentId}/check-in`);
      if (res.data.success) {
        fetchAppointments(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in.');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, {
        status: 'cancelled',
      });
      if (res.data.success) {
        fetchAppointments(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  // Split into upcoming vs past/completed
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter(
    (a) => !['completed', 'cancelled', 'no_show'].includes(a.status)
  );
  const pastAppointments = appointments.filter((a) =>
    ['completed', 'cancelled', 'no_show'].includes(a.status)
  );

  // Active or top appointment for banner
  const heroAppointment = upcomingAppointments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>MY CONSULTATIONS &amp; QUEUES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Consultations &amp; Live Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your queue progress in real-time, view estimated waiting periods, and join video consultations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAppointments(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition shadow-2xs"
            title="Refresh queue status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>

          <Link
            to="/doctors"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>Book Doctor</span>
          </Link>
        </div>
      </div>

      {/* Featured Live Queue Status Banner for Next / Ongoing Appointment */}
      {heroAppointment && (
        <QueueStatusBanner
          appointment={heroAppointment}
          onRefresh={() => fetchAppointments(true)}
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming &amp; In-Queue</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
            {upcomingAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'past'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Past Consultations</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
            {pastAppointments.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Fetching appointment records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : activeTab === 'upcoming' && upcomingAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Upcoming Appointments</h3>
          <p className="text-xs text-slate-500 mb-5">
            You don't have any appointments scheduled right now. Browse certified doctors and book easily.
          </p>
          <Link
            to="/doctors"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <span>Find a Doctor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : activeTab === 'past' && pastAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No past consultation history found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(activeTab === 'upcoming' ? upcomingAppointments : pastAppointments).map((apt) => {
            const isVideo = apt.type === 'video';
            const queueInfo = apt.queueInfo || {};

            return (
              <div
                key={apt._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Doctor details */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center text-base flex-shrink-0">
                    {apt.doctorId?.name?.replace(/^Dr\.\s*/, '')[0] || 'D'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900">
                        {apt.doctorId?.name || 'Practitioner'}
                      </h4>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {apt.doctorId?.specialization || 'Medicine'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.time}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {isVideo ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-emerald-600" />
                            Video
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            In-Person
                          </span>
                        )}
                      </span>
                    </p>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      Reason: <span className="text-slate-600">{apt.reason || 'General Health Consultation'}</span>
                    </p>
                  </div>
                </div>

                {/* Queue & Status Info */}
                <div className="flex flex-wrap items-center gap-3 md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs font-semibold text-indigo-700">
                      Queue #{apt.queueNumber}
                    </div>
                    {apt.status === 'in_consultation' ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" />
                        In Consultation Now
                      </span>
                    ) : queueInfo.patientsAhead !== undefined ? (
                      <span className="text-[11px] text-slate-500">
                        {queueInfo.patientsAhead} ahead • ~{queueInfo.estimatedWaitMinutes}m wait
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 capitalize">{apt.status}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isVideo && ['confirmed', 'checked_in', 'waiting', 'in_consultation'].includes(apt.status) && (
                      <Link
                        to={`/video-consultation/${apt._id}`}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm shadow-emerald-200"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video</span>
                      </Link>
                    )}

                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckIn(apt._id)}
                        className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition"
                      >
                        Check-in Now
                      </button>
                    )}

                    {['confirmed', 'waiting', 'pending'].includes(apt.status) && (
                      <button
                        onClick={() => handleCancelAppointment(apt._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Cancel appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
