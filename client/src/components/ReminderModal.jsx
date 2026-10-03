import React from 'react';
import { Pill, Clock, Check, BellRing, X } from 'lucide-react';
import { useReminder } from '../context/ReminderContext';

export default function ReminderModal() {
  const { activeReminder, markAsTaken, snooze, dismiss } = useReminder();

  if (!activeReminder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-blue-100 relative">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          title="Dismiss Reminder"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-bounce duration-1000">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 block">
              Dose Reminder
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Time for your medication
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-blue-600" />
              {activeReminder.medicationName || 'Prescribed Medicine'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
              {activeReminder.strength || ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Dose Amount:</span>
            <span className="font-medium text-slate-800">
              {activeReminder.doseAmount || 1} {activeReminder.doseUnit || 'tablet'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Scheduled Time:
            </span>
            <span className="font-semibold text-blue-700">{activeReminder.scheduledTime}</span>
          </div>

          {activeReminder.instructions && (
            <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200/60">
              Instructions: {activeReminder.instructions}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => markAsTaken(activeReminder._id)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition"
          >
            <Check className="w-4 h-4" />
            <span>Mark as Taken</span>
          </button>

          <button
            onClick={() => snooze(activeReminder._id, 15)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
          >
            Snooze (15m)
          </button>
        </div>
      </div>
    </div>
  );
}
