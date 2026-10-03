import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Pill,
  Clock,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Info,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';

export default function MedicationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMedication = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/medications/${id}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        setError('Failed to load medication details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedication();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading clinical medicine guide...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl mb-4">
          {error || 'Medication not found.'}
        </div>
        <Link to="/medications" className="text-sm font-semibold text-blue-600 hover:underline">
          &larr; Back to Medications List
        </Link>
      </div>
    );
  }

  const { medication, referenceInfo } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        to="/medications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Medications</span>
      </Link>

      {/* Main Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {referenceInfo?.category || 'Prescription Drug'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {medication.name}
              </h1>
              {medication.strength && (
                <p className="text-sm text-slate-500 font-medium">{medication.strength}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Patient-Specific Prescription Information (Section 25 & 26) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Your Verified Prescription
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dosing instructions verified by you from the physician's prescription order.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Prescribed Dose</span>
            <span className="text-base font-bold text-slate-900">
              {medication.doseAmount} {medication.doseUnit}
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Frequency</span>
            <span className="text-base font-bold text-slate-900">{medication.frequency}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Prescribed Duration</span>
            <span className="text-base font-bold text-slate-900">
              {medication.durationValue} {medication.durationUnit}
            </span>
          </div>
        </div>

        {medication.instructions ? (
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700">
            <strong className="text-blue-900 font-semibold">Special Instructions: </strong>
            <span>{medication.instructions}</span>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
            Take according to the verified prescription.
          </div>
        )}
      </div>

      {/* SECTION 2: General Trusted Medication Reference Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span>About This Medication</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Curated clinical reference information from trusted pharmaceutical datasets.
          </p>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Description &amp; Action
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {referenceInfo?.description}
          </p>
        </div>

        {/* Common Uses */}
        {referenceInfo?.commonUses && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Common Uses &amp; Indications
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {referenceInfo.commonUses.map((use, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{use}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Storage */}
        {referenceInfo?.storage && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Storage Recommendations
            </h3>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {referenceInfo.storage}
            </p>
          </div>
        )}

        {/* Warnings */}
        {referenceInfo?.warnings && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Precautions &amp; Patient Warnings</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {referenceInfo.warnings.map((warn, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 3: Standard Medical Safety Callout (Section 25) */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
        <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Important Safety Advice:</strong>
          {referenceInfo?.disclaimer ||
            'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.'}
        </div>
      </div>
    </div>
  );
}
