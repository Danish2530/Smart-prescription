import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      default: 'MBBS, MD',
      trim: true,
    },
    experience: {
      type: Number,
      required: true,
      default: 5,
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
    },
    clinicAddress: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: 'New Delhi',
      trim: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      default: 500,
    },
    averageConsultationMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 48,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'],
      default: 'AVAILABLE',
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    availableHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    videoConsultationAvailable: {
      type: Boolean,
      default: true,
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    avatar: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
