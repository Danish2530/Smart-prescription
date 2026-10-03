import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  History,
  Pill,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';
import DoseCard from '../components/DoseCard';
import StatusBadge from '../components/StatusBadge';

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [todayDoses, setTodayDoses] = useState([]);
  const [historyDoses, setHistoryDoses] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('today'); // 'today' | 'week' | 'month' | 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTodayDoses = async () => {
    try {
      const res = await api.get('/doses/today');
      if (res.data.success) {
        setTodayDoses(res.data.doses || []);
      }
    } catch (err) {
      setError('Failed to load today schedule.');
    }
  };

  const fetchDoseHistory = async (filterVal) => {
    try {
      const res = await api.get(`/doses/history?filter=${filterVal}`);
      if (res.data.success) {
        setHistoryDoses(res.data.doses || []);
      }
    } catch (err) {
      setError('Failed to load dose history.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchTodayDoses(), fetchDoseHistory(historyFilter)]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = async (filterVal) => {
    setHistoryFilter(filterVal);
    fetchDoseHistory(filterVal);
  };

  const handleMarkTaken = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/taken`);
      fetchTodayDoses();
      fetchDoseHistory(historyFilter);
    } catch (err) {
      console.error('Error marking taken:', err);
    }
  };

  const handleMarkMissed = async (doseId) => {
    try {
      await api.post(`/doses/${doseId}/missed`);
      fetchTodayDoses();
      fetchDoseHistory(historyFilter);
    } catch (err) {
      console.error('Error marking missed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Medication Schedule &amp; Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Follow your personalized daily dose routine and review past dose intake history.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'today'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dose History Log
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* TODAY'S SCHEDULE TAB */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {todayDoses.length} {todayDoses.length === 1 ? 'dose' : 'doses'} scheduled today
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading schedule...</div>
            ) : todayDoses.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No doses scheduled for today</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Make sure your prescriptions are verified to generate automated daily doses.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-blue-100 ml-4 pl-6 sm:pl-8 space-y-6">
                {todayDoses.map((dose) => (
                  <div key={dose._id} className="relative">
                    {/* Timeline bullet dot */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 bg-white ${
                        dose.status === 'taken'
                          ? 'border-emerald-500 bg-emerald-500'
                          : dose.status === 'missed'
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-blue-500'
                      }`}
                    ></div>

                    <DoseCard
                      dose={dose}
                      onMarkTaken={handleMarkTaken}
                      onMarkMissed={handleMarkMissed}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 17: Flexible / As Needed Instruction box */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 leading-relaxed">
              <strong className="font-semibold block mb-0.5">Flexible / As Needed Medications:</strong>
              If your prescription specifies "Take as directed", "As needed", "PRN", or "SOS", MedSync does not invent arbitrary fixed hours. Follow the specific instructions provided by your healthcare professional.
            </div>
          </div>
        </div>
      )}

      {/* DOSE HISTORY TAB (Section 21) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Dose Intake History</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit trail of taken and missed medication doses.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['today', 'week', 'month', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    historyFilter === f
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'today' ? 'Today' : f === 'week' ? 'Past 7 Days' : f === 'month' ? 'Past 30 Days' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading history...</div>
          ) : historyDoses.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No dose history recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Dose Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historyDoses.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {new Date(d.scheduledDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {d.scheduledTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">
                          {d.medicationId?.name || 'Medication'}
                        </span>
                        {d.medicationId?.strength && (
                          <span className="text-slate-400 ml-1.5">
                            ({d.medicationId.strength})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.medicationId?.doseAmount || 1} {d.medicationId?.doseUnit || 'tablet'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {d.takenAt
                          ? new Date(d.takenAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
