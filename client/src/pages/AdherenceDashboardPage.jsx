import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Pill,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';

export default function AdherenceDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [medicationsAdh, setMedicationsAdh] = useState([]);
  const [recentMissed, setRecentMissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdherenceData = async () => {
      try {
        setLoading(true);
        const [sumRes, weekRes, medRes] = await Promise.all([
          api.get('/adherence/summary'),
          api.get('/adherence/weekly'),
          api.get('/adherence/by-medication'),
        ]);

        if (sumRes.data.success) {
          setSummary(sumRes.data.summary);
          setRecentMissed(sumRes.data.recentMissed || []);
        }
        if (weekRes.data.success) {
          setWeekly(weekRes.data.weekly || []);
        }
        if (medRes.data.success) {
          setMedicationsAdh(medRes.data.medications || []);
        }
      } catch (err) {
        setError('Failed to calculate adherence metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdherenceData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Calculating adherence analytics...</p>
      </div>
    );
  }

  const rate = summary?.adherenceRate || 0;
  const category = summary?.category || 'Moderate';

  // Section 24 UX color states
  const categoryColorClass =
    rate >= 90
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : rate >= 75
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Adherence Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your overall medication adherence rate, 7-day trend, and medicine-specific consistency.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* TOP SECTION: Overall Adherence Large Card (Section 22 & 23) + Dose Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large Overall Adherence Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Adherence
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${categoryColorClass}`}
              >
                {category} Adherence
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
                {rate}%
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4">
              Formula: (Taken Doses / Evaluated Doses) &times; 100
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Taken doses:</span>
                <strong className="text-slate-900">{summary?.taken || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Missed doses:</span>
                <strong className="text-slate-900">{summary?.missed || 0}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1">
                <span>Total evaluated doses:</span>
                <strong className="text-slate-900">
                  {(summary?.taken || 0) + (summary?.missed || 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 24 Mandatory Medical Safety Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span>
              These adherence categories are application UX indicators only, not clinical diagnoses or clinical risk categories.
            </span>
          </div>
        </div>

        {/* 4 Dose Statistics Cards (Section 23) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {/* Total Scheduled */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Scheduled</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              {summary?.totalScheduled || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Total prescribed doses</span>
          </div>

          {/* Taken */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Taken Doses
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-3">
              {summary?.taken || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Successfully completed</span>
          </div>

          {/* Missed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Missed Doses
              </span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 mt-3">
              {summary?.missed || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Doses marked missed</span>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Doses</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-700 mt-3">
              {summary?.pending || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Awaiting scheduled time</span>
          </div>
        </div>
      </div>

      {/* WEEKLY TREND CHART USING RECHARTS (Section 23) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>7-Day Dose Adherence Trend</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily comparison of taken doses versus missed doses over the past week.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">Past 7 Days</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="taken" name="Taken Doses" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" name="Missed Doses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 Bottom Columns: Medication-Wise Adherence & Recent Missed Doses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Medication-Wise Adherence (Section 23) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <span>Medication-Wise Adherence</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compliance percentage calculated for each active prescribed medicine.
            </p>
          </div>

          {medicationsAdh.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active medications to analyze.
            </div>
          ) : (
            <div className="space-y-4">
              {medicationsAdh.map((med) => {
                const medRate = med.adherenceRate || 0;
                return (
                  <div key={med.medicationId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 font-semibold">{med.name}</strong>
                        {med.strength && (
                          <span className="text-slate-400 ml-1.5 font-normal">
                            ({med.strength})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">
                          {med.taken}/{med.taken + med.missed} taken
                        </span>
                        <span className="font-bold text-slate-900">{medRate}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          medRate >= 90
                            ? 'bg-emerald-500'
                            : medRate >= 75
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${medRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Missed Doses (Section 23: Last 5 missed doses) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Recent Missed Doses</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Last missed doses recorded for review.
            </p>
          </div>

          {recentMissed.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="font-semibold text-slate-700">Zero Recent Missed Doses!</span>
              <span>Keep up the excellent adherence.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMissed.map((dose) => (
                <div
                  key={dose._id}
                  className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {dose.medicationId?.name || 'Medication'}{' '}
                        {dose.medicationId?.strength && (
                          <span className="font-normal text-slate-500">
                            ({dose.medicationId.strength})
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Scheduled for {dose.scheduledTime} &bull;{' '}
                        {new Date(dose.scheduledDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                    Missed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
