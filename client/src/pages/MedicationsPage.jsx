import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Clock, Calendar, Info, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import api from '../services/api';

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/medications');
        if (res.data.success) {
          setMedications(res.data.medications || []);
        }
      } catch (err) {
        setError('Failed to load medications.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Medications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your verified prescriptions and access trusted clinical medicine information.
          </p>
        </div>

        <Link
          to="/prescriptions/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-200 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add from Prescription</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Pill className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Medications</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Upload and verify your doctor's prescription to generate your schedule and active medicines.
          </p>
          <Link
            to="/prescriptions/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            <span>Upload Prescription</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((med) => (
            <div
              key={med._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-baseline gap-2">
                    <span>{med.name}</span>
                    {med.strength && (
                      <span className="text-xs font-semibold text-slate-500">{med.strength}</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {med.doseAmount || 1} {med.doseUnit || 'tablet'} &bull;{' '}
                    <span className="font-semibold text-blue-700">{med.frequency}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Duration:
                    </span>
                    <span className="font-medium text-slate-800">
                      {med.durationValue} {med.durationUnit}
                    </span>
                  </div>

                  {med.instructions && (
                    <div className="pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400">Advice: </span>
                      <span className="font-medium text-slate-800">{med.instructions}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                <Link
                  to={`/medications/${med._id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>View Medication Information</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
