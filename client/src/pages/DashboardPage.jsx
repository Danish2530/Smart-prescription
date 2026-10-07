import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Calendar,
  BarChart3,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Video,
  Bot,
  Users,
  Sparkles,
  Activity,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DoseCard from '../components/DoseCard';
import DoctorCard from '../components/DoctorCard';
import QueueStatusBanner from '../components/QueueStatusBanner';
import BookingModal from '../components/BookingModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayDoses, setTodayDoses] = useState([]);
  const [activeMedsCount, setActiveMedsCount] = useState(0);
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking modal state
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dosesRes, medsRes, adhRes, aptsRes, docsRes] = await Promise.all([
        api.get('/doses/today'),
        api.get('/medications'),
        api.get('/adherence/summary'),
        api.get('/appointments/my').catch(() => ({ data: { success: false } })),
        api.get('/doctors').catch(() => ({ data: { success: false } })),
      ]);

      if (dosesRes.data.success) {
        setTodayDoses(dosesRes.data.doses || []);
      }
      if (medsRes.data.success) {
        setActiveMedsCount(medsRes.data.count || 0);
      }
      if (adhRes.data.success) {
        setAdherenceStats(adhRes.data.summary);
      }
      if (aptsRes.data.success && aptsRes.data.appointments?.length > 0) {
        const nextActive = aptsRes.data.appointments.find(
          (a) => !['completed', 'cancelled', 'no_show'].includes(a.status)
        );
        setUpcomingAppointment(nextActive || aptsRes.data.appointments[0]);
      }
      if (docsRes.data.success) {
        setFeaturedDoctors((docsRes.data.doctors || []).slice(0, 3));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to load some dashboard metrics. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkTaken = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/taken`);
      fetchDashboardData();
    } catch (err) {
      console.error('Error marking taken:', err);
    }
  };

  const handleMarkMissed = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/missed`);
      fetchDashboardData();
    } catch (err) {
      console.error('Error marking missed:', err);
    }
  };

  // Determine greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate today's specific adherence
  const takenCount = todayDoses.filter((d) => d.status === 'taken').length;
  const missedCount = todayDoses.filter((d) => d.status === 'missed').length;
  const pendingCount = todayDoses.filter((d) => d.status === 'pending').length;
  const totalToday = todayDoses.length;
  const todayEvaluated = takenCount + missedCount;
  const todayAdherence =
    todayEvaluated > 0
      ? Math.round((takenCount / todayEvaluated) * 100)
      : totalToday > 0
      ? 100
      : 0;

  // Find next upcoming/pending dose
  const upcomingDose = todayDoses.find((d) => d.status === 'pending');

  const handleOpenBooking = (doctor) => {
    setSelectedDoctorForBooking(doctor);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HERO SECTION - PRESCRIPTO HERO USP */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-indigo-600/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>PRESCRIPTO HERO USP • DIGITAL HEALTHCARE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Find the Right Doctor, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">
              Without the Long Wait.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Discover nearby doctors, observe their live patient queue and estimated waiting times,
            book instant in-person or video consultations, and manage your complete medication schedules.
          </p>

          {/* Key Value Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Patient Traffic
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Accurate Wait Times
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              Video Telehealth
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              AI Health Assistant
            </span>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Link
              to="/doctors"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-blue-600/30"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Find a Doctor</span>
            </Link>

            <Link
              to="/health-assistant"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition backdrop-blur-xs"
            >
              <Bot className="w-4 h-4 text-sky-300" />
              <span>AI Health Assistant</span>
            </Link>

            <Link
              to="/prescriptions/upload"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition backdrop-blur-xs"
            >
              <UploadCloud className="w-4 h-4 text-emerald-300" />
              <span>Scan Prescription</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ACTIVE QUEUE STATUS BANNER (If upcoming appointment exists) */}
      {upcomingAppointment && (
        <QueueStatusBanner
          appointment={upcomingAppointment}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* FEATURED DOCTORS & LIVE TRAFFIC PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <span>Available Doctors &amp; Real-Time Traffic</span>
            </h2>
            <p className="text-xs text-slate-500">
              Doctors currently taking consultations with live wait times.
            </p>
          </div>

          <Link
            to="/doctors"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Doctors</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDoctors.map((doc) => (
            <DoctorCard
              key={doc._id}
              doctor={doc}
              onBookClick={handleOpenBooking}
            />
          ))}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MEDICATION & ADHERENCE METRICS CARDS (Preserved existing functionality) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>Medication Adherence Overview</span>
          </h2>
          <Link
            to="/adherence"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Detailed Analytics</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Today's Adherence */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Adherence</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-slate-900">{todayAdherence}%</span>
              <span className="text-xs text-slate-500">
                ({takenCount} of {totalToday} doses taken)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  todayAdherence >= 80
                    ? 'bg-emerald-500'
                    : todayAdherence >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${todayAdherence}%` }}
              />
            </div>
          </div>

          {/* Active Medications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Medications</span>
              <Pill className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-slate-900">{activeMedsCount}</span>
              <span className="text-xs text-slate-500">verified active</span>
            </div>
            <p className="text-xs text-slate-400">
              {activeMedsCount > 0 ? 'Generating daily schedule' : 'No active prescriptions yet'}
            </p>
          </div>

          {/* Upcoming Dose */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Next Dose</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            {upcomingDose ? (
              <div>
                <div className="text-base font-bold text-slate-900 truncate">
                  {upcomingDose.medicationName} {upcomingDose.strength}
                </div>
                <div className="text-xs font-semibold text-blue-700 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled for {upcomingDose.scheduledTime}</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-base font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>All caught up!</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">No more pending doses for today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TODAY'S DOSES SCHEDULE & QUICK ACTIONS (Preserved existing functionality) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Today's Medication List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Today's Prescribed Doses</span>
            </h2>
            <Link
              to="/schedule"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Loading today's schedule...
            </div>
          ) : todayDoses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Doses Scheduled for Today</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your prescription to automatically generate your verified medication schedule.
              </p>
              <Link
                to="/prescriptions/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Prescription</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayDoses.map((dose) => (
                <DoseCard
                  key={dose._id}
                  dose={dose}
                  onMarkTaken={handleMarkTaken}
                  onMarkMissed={handleMarkMissed}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Overall Stats */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Healthcare Tools
            </h3>
            <div className="space-y-2.5">
              <Link
                to="/doctors"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Find a Doctor &amp; View Traffic</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/appointments"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Appointments &amp; Live Queue</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/health-assistant"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-sky-600" />
                  <span>Ask AI Health Assistant</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/prescriptions/upload"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Scan &amp; Upload Prescription</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Adherence Mini Summary */}
          {adherenceStats && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Overall Adherence
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    adherenceStats.category === 'Excellent'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : adherenceStats.category === 'Moderate'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {adherenceStats.category}
                </span>
              </div>

              <div className="text-3xl font-extrabold text-slate-900 mb-2">
                {adherenceStats.adherenceRate}%
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {adherenceStats.taken} of {adherenceStats.taken + adherenceStats.missed} evaluated
                doses taken across your medication courses.
              </p>

              <Link
                to="/adherence"
                className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 border-t border-slate-100"
              >
                Explore detailed adherence breakdown &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
