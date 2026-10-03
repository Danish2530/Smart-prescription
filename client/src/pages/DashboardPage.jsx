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
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DoseCard from '../components/DoseCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayDoses, setTodayDoses] = useState([]);
  const [activeMedsCount, setActiveMedsCount] = useState(0);
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dosesRes, medsRes, adhRes] = await Promise.all([
        api.get('/doses/today'),
        api.get('/medications'),
        api.get('/adherence/summary'),
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Patient'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your daily medication status and adherence overview for today.
          </p>
        </div>

        {/* Quick Action primary button */}
        <Link
          to="/prescriptions/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-200 transition shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Prescription</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Metric Cards matching Section 8 */}
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
            ></div>
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

      {/* Main Content: Today's Medication Schedule + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Today's Medication List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Today's Medication</span>
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
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <Link
                to="/prescriptions/upload"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Upload Prescription</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/schedule"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>View Full Schedule</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/adherence"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>View Adherence Analytics</span>
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
                  Overall Compliance
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
                doses taken across your treatment courses.
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
    </div>
  );
}
