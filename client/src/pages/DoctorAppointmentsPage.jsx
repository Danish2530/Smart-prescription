import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  Check,
  X,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import api from '../services/api';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      let url = `/appointments/doctor?date=${selectedDate}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, statusFilter]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchAppointments();
      }
    } catch (err) {
      alert('Unable to update status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Appointments Schedule</h1>
          <p className="text-xs text-slate-500">Filter and manage bookings by date and attendance.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waiting">Waiting</option>
            <option value="in_consultation">In Consultation</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs">{error}</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No appointments recorded for {selectedDate}.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
          {appointments.map((apt) => (
            <div key={apt._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  #{apt.queueNumber}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{apt.patientId?.name || 'Patient'}</h4>
                  <p className="text-xs text-slate-500">
                    {apt.time} • {apt.type === 'video' ? '📹 Video' : '🏥 In-Person'} • {apt.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {apt.status}
                </span>

                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(apt._id, 'waiting')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl hover:bg-blue-100"
                  >
                    Check In
                  </button>
                )}

                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Cancel Booking"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
