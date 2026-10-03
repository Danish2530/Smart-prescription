import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    strength: {
      type: String,
      default: '',
      trim: true,
    },
    doseAmount: {
      type: Number,
      default: 1,
    },
    doseUnit: {
      type: String,
      default: 'tablet',
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    durationValue: {
      type: Number,
      default: 1,
    },
    durationUnit: {
      type: String,
      default: 'days',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Medication = mongoose.model('Medication', medicationSchema);
export default Medication;
