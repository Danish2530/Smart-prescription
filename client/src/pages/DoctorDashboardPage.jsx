import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Video,
  CheckCircle2,
  Calendar,
  Activity,
  AlertCircle,
  Play,
  Check,
  UserX,
  PhoneCall,
  Loader2,
  RefreshCw,
  Building2,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TrafficBadge from '../components/TrafficBadge';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  const fetchDoctorDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [profileRes, aptsRes] = await Promise.all([
        api.get('/doctors/me'),
        api.get(`/appointments/doctor?date=${new Date().toISOString().split('T')[0]}`),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.doctor);
        setQueueStats(profileRes.data.queueStats);
      }
      if (aptsRes.data.success) {
        setAppointments(aptsRes.data.appointments || []);
      }
    } catch (err) {
      console.error('Doctor dashboard load error:', err);
      setError('Unable to load doctor workspace. Ensure your account has doctor privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDashboard();
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch('/doctors/status', { status: newStatus });
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, status: newStatus }));
        fetchDoctorDashboard();
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/queue/doctor/call-next');
      if (res.data.success) {
        fetchDoctorDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error calling next patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/queue/${appointmentId}/start`);
      if (res.data.success) {
        fetchDoctorDashboard();
      }
    } catch (err) {
      alert('Error starting consultation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConsultation = async (appointmentId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/queue/${appointmentId}/complete`, { notes });
      if (res.data.success) {
        setNotes('');
        fetchDoctorDashboard();
      }
    } catch (err) {
      alert('Error completing consultation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAbsent = async (appointmentId) => {
    if (!window.confirm('Mark this patient as absent (No-show)?')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/queue/${appointmentId}/absent`);
      if (res.data.success) {
        fetchDoctorDashboard();
      }
    } catch (err) {
      alert('Error marking patient absent.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading Doctor Command Center...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Doctor Profile Access Required</h2>
        <p className="text-xs text-slate-500 mb-6">
          {error || 'No doctor credentials found for this account.'}
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 mb-6 text-left space-y-1">
          <p className="font-semibold text-slate-800">Quick Hackathon Demo Doctor Login:</p>
          <p>Email: <code>doctor.rahul@prescripto.com</code></p>
          <p>Password: <code>Doctor@123</code></p>
        </div>
        <Link
          to="/login"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Sign In as Doctor
        </Link>
      </div>
    );
  }

  const currentConsultation = appointments.find((a) => a.status === 'in_consultation');
  const waitingPatients = appointments.filter((a) =>
    ['waiting', 'checked_in', 'confirmed'].includes(a.status)
  );
  const completedToday = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Doctor Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
            {profile.name.replace(/^Dr\.\s*/, '')[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{profile.name}</h1>
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-blue-600">
              {profile.specialization} • {profile.clinicName}
            </p>
            <p className="text-[11px] text-slate-400">
              Avg Consultation: {profile.averageConsultationMinutes} min • Fee: ₹{profile.consultationFee}
            </p>
          </div>
        </div>

        {/* Doctor Status Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Practice Status:</span>
          {['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'].map((st) => {
            const isCurrent = profile.status === st;
            return (
              <button
                key={st}
                disabled={actionLoading}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isCurrent
                    ? st === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'BUSY'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : st === 'ON_BREAK'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    st === 'AVAILABLE'
                      ? 'bg-emerald-300'
                      : st === 'BUSY'
                      ? 'bg-amber-300'
                      : st === 'ON_BREAK'
                      ? 'bg-orange-300'
                      : 'bg-slate-300'
                  }`}
                />
                <span>{st}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Total</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {appointments.length}
          </div>
          <span className="text-[11px] text-slate-400">Total appointments booked</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Patients Waiting</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {waitingPatients.length}
          </div>
          <span className="text-[11px] text-slate-400">
            ~{waitingPatients.length * (profile.averageConsultationMinutes || 15)} min estimated
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>In Consultation</span>
            <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">
            {currentConsultation ? 1 : 0}
          </div>
          <span className="text-[11px] text-slate-400">
            {currentConsultation ? `Queue #${currentConsultation.queueNumber}` : 'Room vacant'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {completedToday.length}
          </div>
          <span className="text-[11px] text-slate-400">Consultations finished</span>
        </div>
      </div>

      {/* Main Grid: Active Consultation & Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Live Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Today's Patient Queue</span>
            </h2>

            <button
              onClick={handleCallNext}
              disabled={actionLoading || waitingPatients.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Next Patient</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No appointments booked for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const isCurrent = apt.status === 'in_consultation';
                  const isWaiting = ['waiting', 'checked_in', 'confirmed'].includes(apt.status);
                  const isDone = apt.status === 'completed';

                  return (
                    <div
                      key={apt._id}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isCurrent ? 'bg-indigo-50/60 ring-1 ring-indigo-300' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{apt.queueNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {apt.patientId?.name || 'Patient'}
                            </h4>
                            <span className="text-[11px] text-slate-400">({apt.time})</span>
                            {apt.type === 'video' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Reason: {apt.reason || 'General Checkup'} • Phone: {apt.patientId?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <div className="flex items-center gap-2">
                            {apt.type === 'video' && (
                              <Link
                                to={`/video-consultation/${apt._id}`}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Room</span>
                              </Link>
                            )}
                            <button
                              onClick={() => handleCompleteConsultation(apt._id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          </div>
                        ) : isWaiting ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartConsultation(apt._id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start</span>
                            </button>
                            <button
                              onClick={() => handleMarkAbsent(apt._id)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Mark No-Show"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {apt.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Ongoing Patient Card & Clinical Desk */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Current Consultation Desk</span>
            </h3>

            {currentConsultation ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800">
                      Queue #{currentConsultation.queueNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      In Session
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {currentConsultation.patientId?.name || 'Patient'}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {currentConsultation.patientId?.email}
                  </p>
                  <p className="text-xs text-slate-600">
                    Type: <strong className="capitalize">{currentConsultation.type}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Summary &amp; Advice
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter prescribed medications, dietary advice, or follow-up instructions..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {currentConsultation.type === 'video' && (
                    <Link
                      to={`/video-consultation/${currentConsultation._id}`}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Feed</span>
                    </Link>
                  )}
                  <button
                    onClick={() => handleCompleteConsultation(currentConsultation._id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete Session</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active consultation</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Call the next waiting patient when you are ready.
                </p>
                <button
                  onClick={handleCallNext}
                  disabled={waitingPatients.length === 0 || actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Call Next Patient
                </button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block mb-2">Doctor Controls</span>
            <Link
              to="/doctor/appointments"
              className="block p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-medium"
            >
              📅 Manage All Appointments
            </Link>
            <Link
              to="/doctor/availability"
              className="block p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-medium"
            >
              🕐 Adjust Consultation Hours &amp; Average Duration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
