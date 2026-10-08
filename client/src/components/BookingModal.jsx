import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export default function BookingModal({ doctor, isOpen, onClose, onSuccess }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultationType, setConsultationType] = useState('in_person');
  const [reason, setReason] = useState('General Consultation');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (!doctor || !isOpen) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setError('');
        const res = await api.get(`/doctors/${doctor._id}/slots?date=${selectedDate}`);
        if (res.data.success) {
          setSlots(res.data.slots || []);
          // Pick first available slot by default
          const firstAvailable = res.data.slots.find((s) => !s.isBooked);
          if (firstAvailable) {
            setSelectedSlot(firstAvailable.time);
          } else {
            setSelectedSlot('');
          }
        }
      } catch (err) {
        console.error('Error loading slots:', err);
        setError('Failed to fetch available time slots for this date.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctor, selectedDate, isOpen]);

  if (!isOpen || !doctor) return null;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/appointments', {
        doctorId: doctor._id,
        date: selectedDate,
        time: selectedSlot,
        type: consultationType,
        reason,
      });

      if (res.data.success) {
        setBookingSuccessData(res.data);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(
        err.response?.data?.message || 'Failed to complete booking. Please select another slot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setBookingSuccessData(null);
    setError('');
    onClose();
  };

  // Generate date options (next 7 days)
  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Tomorrow'
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    dateOptions.push({ dateStr, label });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 block">
              Book Consultation
            </span>
            <h2 className="text-lg font-bold">{doctor.name}</h2>
            <p className="text-xs text-blue-100">{doctor.specialization} • {doctor.clinicName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingSuccessData ? (
          /* Confirmation Screen */
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Appointment Confirmed!
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Your consultation has been reserved and your position in the patient queue is secured.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left max-w-md mx-auto mb-6 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-semibold text-slate-900">{doctor.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-semibold text-slate-900">
                  {bookingSuccessData.appointment?.date} at {bookingSuccessData.appointment?.time}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Consultation Mode:</span>
                <span className="font-semibold capitalize text-blue-600">
                  {bookingSuccessData.appointment?.type === 'video' ? '📹 Video Call' : '🏥 In-Person Clinic'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Queue Number:</span>
                <span className="font-bold text-sm text-indigo-600">
                  #{bookingSuccessData.appointment?.queueNumber}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Estimated Waiting Time:</span>
                <span className="font-semibold text-emerald-600">
                  ~{bookingSuccessData.queueInfo?.estimatedWaitMinutes || 15} minutes
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md shadow-blue-200"
            >
              Done &amp; View in Appointments
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleBooking} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>1. Select Date</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {dateOptions.map(({ dateStr, label }) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      type="button"
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Consultation Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-600" />
                <span>2. Select Consultation Mode</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConsultationType('in_person')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                    consultationType === 'in_person'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-5 h-5 mt-0.5 ${consultationType === 'in_person' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">In-Person Clinic</h4>
                    <p className="text-[11px] text-slate-500">Visit {doctor.clinicName}</p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!doctor.videoConsultationAvailable}
                  onClick={() => setConsultationType('video')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                    !doctor.videoConsultationAvailable
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : consultationType === 'video'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Video className={`w-5 h-5 mt-0.5 ${consultationType === 'video' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Video Consultation</h4>
                    <p className="text-[11px] text-slate-500">
                      {doctor.videoConsultationAvailable ? 'Online via MedSick' : 'Unavailable'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Available Time Slots */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>3. Choose Time Slot</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  ~{doctor.averageConsultationMinutes || 15} mins duration
                </span>
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                  Loading available time slots...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                  No slots available on this date. Please choose another date.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 px-1.5 rounded-lg text-xs font-semibold text-center transition ${
                          slot.isBooked
                            ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed border border-transparent'
                            : isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-500'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 4: Reason / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Visit (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Fever checkup, Prescription renewal, Skin rash"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Footer Summary & Submit */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Consultation Fee</span>
                <span className="text-base font-bold text-slate-900">₹{doctor.consultationFee}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
