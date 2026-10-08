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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (val) {
            // Optional: if not provided or empty, valid
            if (!val || val.length === 0) return true;
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              typeof val[0] === 'number' &&
              typeof val[1] === 'number' &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] numbers.',
        },
      },
      address: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries (nearby doctors)
doctorSchema.index({ location: '2dsphere' });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
