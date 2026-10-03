import React, { useState } from 'react';
import { Pill, Check, X, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function DoseCard({ dose, onMarkTaken, onMarkMissed }) {
  const [loading, setLoading] = useState(false);

  const handleTaken = async () => {
    setLoading(true);
    try {
      await onMarkTaken(dose._id);
    } finally {
      setLoading(false);
    }
  };

  const handleMissed = async () => {
    setLoading(true);
    try {
      await onMarkMissed(dose._id);
    } finally {
      setLoading(false);
    }
  };

  const status = dose.status || 'pending';

  // Soft healthcare color styling matching Section 31
  const cardBorderClasses = {
    taken: 'border-emerald-200 bg-white shadow-xs',
    upcoming: 'border-sky-200 bg-white shadow-xs',
    pending: 'border-slate-200 bg-white shadow-xs',
    missed: 'border-rose-200 bg-white shadow-xs',
    skipped: 'border-amber-200 bg-white shadow-xs',
  }[status] || 'border-slate-200 bg-white';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition hover:shadow-md ${cardBorderClasses}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {dose.medicationName || 'Medication'}
              {dose.strength && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {dose.strength}
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {dose.doseAmount || 1} {dose.doseUnit || 'tablet'} &bull; Scheduled at{' '}
              <span className="text-slate-800 font-semibold">{dose.scheduledTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge status={status} />
        </div>
      </div>

      {dose.instructions && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-600 mb-3.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Instructions: <strong className="text-slate-700">{dose.instructions}</strong></span>
        </div>
      )}

      {/* Action buttons if dose is pending */}
      {status === 'pending' && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleTaken}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs shadow-emerald-200 transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark as Taken</span>
          </button>

          <button
            onClick={handleMissed}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Mark as Missed</span>
          </button>
        </div>
      )}

      {/* Confirmation indicator for taken */}
      {status === 'taken' && dose.takenAt && (
        <div className="text-[11px] text-emerald-700 pt-1 font-medium flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Recorded at {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
}
