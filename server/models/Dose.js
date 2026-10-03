import mongoose from 'mongoose';

const doseSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'taken', 'missed', 'skipped'],
      default: 'pending',
      index: true,
    },
    takenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Dose = mongoose.model('Dose', doseSchema);
export default Dose;
