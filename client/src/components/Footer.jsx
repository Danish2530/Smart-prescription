import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Medical Safety Disclaimer as required by Section 25 & 37 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-slate-600 text-xs leading-relaxed">
            <strong className="text-slate-800 font-semibold">Medical Safety Notice:</strong> PRESCRIPTO is a digital healthcare platform providing doctor discovery, appointment queues, telehealth, and medication adherence assistance. It does not replace professional medical judgment, diagnosis, or clinical emergency care. Always consult certified physicians for acute medical conditions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">
              PRESCRIPTO — AI-Powered Digital Healthcare Platform
            </span>
          </div>
          <div className="text-slate-400">
            &copy; {new Date().getFullYear()} PRESCRIPTO Health. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
