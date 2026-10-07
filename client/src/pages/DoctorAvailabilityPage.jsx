import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Video,
} from 'lucide-react';
import api from '../services/api';

export default function DoctorAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicAddress: '',
    consultationFee: 500,
    averageConsultationMinutes: 15,
    videoConsultationAvailable: true,
    availableHours: { start: '09:00', end: '18:00' },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/doctors/me');
        if (res.data.success) {
          const doc = res.data.doctor;
          setFormData({
            clinicName: doc.clinicName || '',
            clinicAddress: doc.clinicAddress || '',
            consultationFee: doc.consultationFee || 500,
            averageConsultationMinutes: doc.averageConsultationMinutes || 15,
            videoConsultationAvailable: doc.videoConsultationAvailable ?? true,
            availableHours: doc.availableHours || { start: '09:00', end: '18:00' },
          });
        }
      } catch (err) {
        console.error('Fetch availability error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await api.put('/doctors/profile', formData);
      if (res.data.success) {
        setSuccessMsg('Availability parameters and consultation timings successfully saved!');
      }
    } catch (err) {
      alert('Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/doctor/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Command Center</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consultation Timings &amp; Practice Settings</h1>
        <p className="text-xs text-slate-500">
          Configure average consultation duration, daily hours, and fee structures. These values automatically drive the live waiting queue calculations.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Average duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Average Consultation Duration (Minutes)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Directly influences the live queue wait estimations for patients.
            </p>
            <input
              type="number"
              min="5"
              max="60"
              value={formData.averageConsultationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, averageConsultationMinutes: parseInt(e.target.value, 10) })
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Consultation Fee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Consultation Fee (₹)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Standard rate per consultation session.</p>
            <input
              type="number"
              min="0"
              step="50"
              value={formData.consultationFee}
              onChange={(e) =>
                setFormData({ ...formData, consultationFee: parseInt(e.target.value, 10) })
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Hours Start */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Daily Practice Start Time
            </label>
            <input
              type="time"
              value={formData.availableHours.start}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  availableHours: { ...formData.availableHours, start: e.target.value },
                })
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Hours End */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Daily Practice End Time
            </label>
            <input
              type="time"
              value={formData.availableHours.end}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  availableHours: { ...formData.availableHours, end: e.target.value },
                })
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Clinic Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Name</label>
            <input
              type="text"
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Video Toggle */}
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.videoConsultationAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, videoConsultationAvailable: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Offer Video Consultations</span>
                <span className="text-[11px] text-slate-400">Allow patients to book remote digital visits</span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
