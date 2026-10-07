import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // Format: HH:mm (e.g. "10:30")
      required: true,
    },
    type: {
      type: String,
      enum: ['in_person', 'video'],
      default: 'in_person',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'checked_in',
        'waiting',
        'in_consultation',
        'completed',
        'cancelled',
        'no_show',
      ],
      default: 'confirmed',
    },
    queueNumber: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: 'General Consultation',
      trim: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    consultationStartedAt: {
      type: Date,
      default: null,
    },
    consultationEndedAt: {
      type: Date,
      default: null,
    },
    meetingRoomId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate booking for same doctor, date, and time if not cancelled
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled', 'no_show'] } },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
