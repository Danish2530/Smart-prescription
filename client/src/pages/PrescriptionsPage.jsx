import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import api from '../services/api';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await api.get('/prescriptions');
        if (res.data.success) {
          setPrescriptions(res.data.prescriptions || []);
        }
      } catch (err) {
        setError('Failed to load prescriptions.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your uploaded prescriptions, verified medications, and treatment records.
          </p>
        </div>

        <Link
          to="/prescriptions/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-200 transition shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Prescription</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading your prescriptions...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Prescriptions Uploaded Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Upload a doctor's prescription slip or digital copy to automatically extract medications and
            generate your reminder schedule.
          </p>
          <Link
            to="/prescriptions/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Your First Prescription</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.map((rx) => {
            const medCount = rx.extractedMedications?.length || 0;
            return (
              <div
                key={rx._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        rx.verified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {rx.verified ? 'Verified & Active' : 'Pending Verification'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Thumbnail / Preview representation */}
                  <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                    {rx.imageUrl ? (
                      <img
                        src={rx.imageUrl}
                        alt="Prescription Scan"
                        className="w-full h-full object-cover object-top opacity-90"
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">
                    Prescription #{rx._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {medCount} {medCount === 1 ? 'Medication' : 'Medications'} extracted
                  </p>

                  <div className="space-y-1 mb-4">
                    {rx.extractedMedications?.slice(0, 3).map((m, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{m.name}</span>
                        <span className="text-slate-400 text-[11px] shrink-0 ml-2">{m.strength}</span>
                      </div>
                    ))}
                    {medCount > 3 && (
                      <div className="text-[11px] text-slate-400 italic">
                        +{medCount - 3} more medications
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/prescriptions/${rx._id}`}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    rx.verified
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs shadow-blue-200'
                  }`}
                >
                  <span>{rx.verified ? 'Review Prescription' : 'Verify & Generate Schedule'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
