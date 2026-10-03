import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Pill,
  ArrowRight,
  ShieldCheck,
  Eye,
  Edit3,
} from 'lucide-react';
import api from '../services/api';

export default function PrescriptionVerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/prescriptions/${id}`);
        if (res.data.success && res.data.prescription) {
          const rx = res.data.prescription;
          setPrescription(rx);
          // Initialize medication edit state from extractedMedications
          const initialMeds = (rx.extractedMedications || []).map((m) => ({
            name: m.name || '',
            strength: m.strength || '',
            doseAmount: m.doseAmount || 1,
            doseUnit: m.doseUnit || 'tablet',
            frequency: m.frequency || 'once daily',
            durationValue: m.durationValue || 5,
            durationUnit: m.durationUnit || 'days',
            instructions: m.instructions || '',
            startDate: new Date().toISOString().split('T')[0],
            confidence: m.confidence || 'high',
            needsVerification: m.needsVerification || false,
          }));

          // If no meds were extracted, provide 1 empty template for manual entry
          if (initialMeds.length === 0) {
            initialMeds.push({
              name: '',
              strength: '',
              doseAmount: 1,
              doseUnit: 'tablet',
              frequency: 'once daily',
              durationValue: 5,
              durationUnit: 'days',
              instructions: '',
              startDate: new Date().toISOString().split('T')[0],
              confidence: 'medium',
              needsVerification: true,
            });
          }

          setMedications(initialMeds);
        }
      } catch (err) {
        setError('Failed to load prescription for verification.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const handleMedChange = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        strength: '',
        doseAmount: 1,
        doseUnit: 'tablet',
        frequency: 'once daily',
        durationValue: 5,
        durationUnit: 'days',
        instructions: '',
        startDate: new Date().toISOString().split('T')[0],
        confidence: 'high',
        needsVerification: false,
      },
    ]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length <= 1) {
      setError('Prescription must include at least one medication.');
      return;
    }
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
  };

  const handleConfirmPrescription = async () => {
    setError('');

    // Validate that all medicines have names
    for (let i = 0; i < medications.length; i++) {
      if (!medications[i].name || medications[i].name.trim() === '') {
        setError(`Please enter a valid medicine name for Medication #${i + 1}.`);
        return;
      }
    }

    setConfirming(true);
    try {
      const res = await api.post(`/prescriptions/${id}/verify`, {
        medications,
      });

      if (res.data.success) {
        setSuccessMsg('Prescription verified and active dose schedule generated!');
        setTimeout(() => {
          navigate('/schedule');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please review your entries.');
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Preparing prescription verification...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Safety Step 2 of 4
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {prescription?.verified ? 'Already Verified' : 'Awaiting Confirmation'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Your Prescription
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare the scanned prescription image with the AI-extracted details below. Make any
            corrections before confirming.
          </p>
        </div>

        {/* Status Callout */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Only verified medicines generate schedules</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Two-Column Layout (Section 14 & Section 31): Left = Image, Right = Extracted Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Original Prescription Image */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Original Prescription Image</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Reference Copy</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-2 min-h-[360px] max-h-[580px]">
            {prescription?.imageUrl ? (
              <img
                src={prescription.imageUrl}
                alt="Original Scanned Prescription"
                className="max-h-[540px] w-full object-contain rounded-lg shadow-2xs"
              />
            ) : (
              <div className="text-center text-slate-400 p-8">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No image preview available</p>
              </div>
            )}
          </div>

          {/* OCR Raw Text Accordion (Collapsed/Expandable helper) */}
          {prescription?.ocrText && (
            <details className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <summary className="font-semibold text-slate-700 cursor-pointer select-none">
                View Raw OCR Text Extracted
              </summary>
              <pre className="mt-2 text-[11px] font-mono text-slate-600 whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200">
                {prescription.ocrText}
              </pre>
            </details>
          )}
        </div>

        {/* Right Column: Extracted Information & Editable Fields */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Extracted Medications ({medications.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify or edit names, strengths, frequencies, and durations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMedication}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* List of Editable Medication Forms */}
            <div className="space-y-6">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 relative space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {med.name || `Medication #${idx + 1}`}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Confidence Tag (Section 13) */}
                      {med.confidence === 'low' || med.needsVerification ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Verify Details</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>AI High Confidence</span>
                        </span>
                      )}

                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Field Grids */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Medicine Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Medicine Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Amoxicillin"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Strength */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Strength / Concentration
                      </label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => handleMedChange(idx, 'strength', e.target.value)}
                        placeholder="e.g. 500 mg, 40 mg"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Dose Amount & Unit */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dose per Intake
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={med.doseAmount}
                          onChange={(e) =>
                            handleMedChange(idx, 'doseAmount', parseInt(e.target.value, 10) || 1)
                          }
                          className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <select
                          value={med.doseUnit}
                          onChange={(e) => handleMedChange(idx, 'doseUnit', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="tablet">tablet(s)</option>
                          <option value="capsule">capsule(s)</option>
                          <option value="ml">ml</option>
                          <option value="drop">drop(s)</option>
                          <option value="puff">puff(s)</option>
                        </select>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="once daily">Once daily (OD)</option>
                        <option value="twice daily">Twice daily (BID - 08:00 AM, 08:00 PM)</option>
                        <option value="3 times daily">
                          3 times daily (TID - 08:00 AM, 02:00 PM, 08:00 PM)
                        </option>
                        <option value="4 times daily">4 times daily (QID)</option>
                        <option value="Flexible / As Needed">
                          Flexible / As Needed (PRN / SOS)
                        </option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duration
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={med.durationValue}
                          onChange={(e) =>
                            handleMedChange(idx, 'durationValue', parseInt(e.target.value, 10) || 1)
                          }
                          className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <select
                          value={med.durationUnit}
                          onChange={(e) => handleMedChange(idx, 'durationUnit', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="days">days</option>
                          <option value="weeks">weeks</option>
                          <option value="months">months</option>
                        </select>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Specific Instructions
                      </label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                        placeholder="e.g. After meals, Before breakfast"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>By confirming, you verify these medications match your doctor's order.</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmPrescription}
                disabled={confirming}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold shadow-sm shadow-emerald-200 transition disabled:opacity-50"
              >
                {confirming ? (
                  <span>Generating Schedule...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Prescription &amp; Build Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
