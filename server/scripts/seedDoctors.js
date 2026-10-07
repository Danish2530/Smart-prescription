import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const demoDoctors = [
  {
    name: 'Dr. Rahul Sharma',
    email: 'doctor.rahul@prescripto.com',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 8,
    clinicName: 'City Care Clinic',
    clinicAddress: '12 Sector 4, Connaught Place, New Delhi',
    city: 'New Delhi',
    consultationFee: 500,
    averageConsultationMinutes: 12,
    rating: 4.8,
    reviewCount: 142,
    status: 'AVAILABLE',
    videoConsultationAvailable: true,
    languages: ['English', 'Hindi'],
    about: 'Experienced internal medicine specialist focusing on evidence-based primary care, preventive wellness, and routine family medicine.',
    waitingPatientCount: 3, // ~20 min wait
  },
  {
    name: 'Dr. Priya Verma',
    email: 'doctor.priya@prescripto.com',
    specialization: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology & Venereology)',
    experience: 11,
    clinicName: 'Skin & Aesthetics Center',
    clinicAddress: '45 Defense Colony, South Delhi',
    city: 'New Delhi',
    consultationFee: 700,
    averageConsultationMinutes: 15,
    rating: 4.9,
    reviewCount: 215,
    status: 'BUSY',
    videoConsultationAvailable: true,
    languages: ['English', 'Hindi', 'Punjabi'],
    about: 'Board-certified dermatologist specializing in clinical dermatology, acne management, allergy evaluations, and modern laser therapies.',
    waitingPatientCount: 8, // ~50 min wait (Moderate)
  },
  {
    name: 'Dr. Amit Kumar',
    email: 'doctor.amit@prescripto.com',
    specialization: 'Cardiologist',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience: 14,
    clinicName: 'Heart Beat Care Institute',
    clinicAddress: '88 Apollo Enclave, Saket, New Delhi',
    city: 'New Delhi',
    consultationFee: 900,
    averageConsultationMinutes: 20,
    rating: 4.9,
    reviewCount: 320,
    status: 'AVAILABLE',
    videoConsultationAvailable: true,
    languages: ['English', 'Hindi'],
    about: 'Senior interventional cardiologist with expertise in hypertensive disorders, lipid management, ECG interpretation, and preventive cardiology.',
    waitingPatientCount: 1, // ~10-20 min wait (Low)
  },
  {
    name: 'Dr. Ananya Sen',
    email: 'doctor.ananya@prescripto.com',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experience: 7,
    clinicName: 'Little Smiles Child Clinic',
    clinicAddress: '23 Greenwood Avenue, Vasant Vihar, New Delhi',
    city: 'New Delhi',
    consultationFee: 600,
    averageConsultationMinutes: 15,
    rating: 4.7,
    reviewCount: 98,
    status: 'AVAILABLE',
    videoConsultationAvailable: true,
    languages: ['English', 'Hindi', 'Bengali'],
    about: 'Compassionate child health specialist focused on developmental milestones, newborn immunization, nutrition, and pediatric infections.',
    waitingPatientCount: 4, // Moderate
  },
  {
    name: 'Dr. Vikram Malhotra',
    email: 'doctor.vikram@prescripto.com',
    specialization: 'Orthopedic Surgeon',
    qualification: 'MBBS, MS (Orthopedics), MCh',
    experience: 16,
    clinicName: 'Apex Bone & Joint Hospital',
    clinicAddress: '102 Medical Hub, Greater Kailash, New Delhi',
    city: 'New Delhi',
    consultationFee: 800,
    averageConsultationMinutes: 15,
    rating: 4.8,
    reviewCount: 184,
    status: 'ON_BREAK',
    videoConsultationAvailable: false,
    languages: ['English', 'Hindi'],
    about: 'Expert orthopedic surgeon specializing in sports injuries, knee and hip arthroplasty, spinal alignment, and rehabilitation.',
    waitingPatientCount: 2,
  },
  {
    name: 'Dr. Sneha Reddy',
    email: 'doctor.sneha@prescripto.com',
    specialization: 'Neurologist',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience: 9,
    clinicName: 'NeuroCare Clinic & Diagnostics',
    clinicAddress: '19 Park Street, Nehru Place, New Delhi',
    city: 'New Delhi',
    consultationFee: 850,
    averageConsultationMinutes: 20,
    rating: 4.9,
    reviewCount: 110,
    status: 'AVAILABLE',
    videoConsultationAvailable: true,
    languages: ['English', 'Hindi', 'Telugu'],
    about: 'Consultant neurologist with deep focus on migraine management, vertigo, neuromuscular conditions, and cognitive health.',
    waitingPatientCount: 0, // Low traffic / instant
  },
];

export const seedDoctors = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_medication_db';
    console.log('[Seed Doctors] Connecting to MongoDB...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const salt = await bcrypt.genSalt(10);
    const doctorPassword = await bcrypt.hash('Doctor@123', salt);

    // Ensure demo patient exists
    let demoPatient = await User.findOne({ email: 'demo@example.com' });
    if (!demoPatient) {
      demoPatient = await User.create({
        name: 'Rahul Sharma',
        email: 'demo@example.com',
        password: await bcrypt.hash('Demo@123', salt),
        phone: '+91 98765 43210',
        role: 'patient',
      });
    }

    // Seed dummy queue patient names
    const dummyNames = [
      'Amit Verma',
      'Pooja Nair',
      'Karan Johar',
      'Sunita Patel',
      'Rohan Gupta',
      'Deepika Das',
      'Vikas Dubey',
      'Meera Iyer',
      'Suresh Menon',
      'Anita Joshi',
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    console.log('[Seed Doctors] Upserting doctors and deterministic queue...');

    for (const data of demoDoctors) {
      // 1. Create or update user account for doctor
      let user = await User.findOne({ email: data.email });
      if (!user) {
        user = await User.create({
          name: data.name,
          email: data.email,
          password: doctorPassword,
          role: 'doctor',
          phone: '+91 98111 ' + Math.floor(10000 + Math.random() * 90000),
        });
      } else {
        user.role = 'doctor';
        await user.save();
      }

      // 2. Create or update Doctor profile
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        doctor = await Doctor.create({
          userId: user._id,
          name: data.name,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          clinicName: data.clinicName,
          clinicAddress: data.clinicAddress,
          city: data.city,
          consultationFee: data.consultationFee,
          averageConsultationMinutes: data.averageConsultationMinutes,
          rating: data.rating,
          reviewCount: data.reviewCount,
          status: data.status,
          videoConsultationAvailable: data.videoConsultationAvailable,
          languages: data.languages,
          about: data.about,
          availableHours: { start: '09:00', end: '18:00' },
        });
      } else {
        doctor.status = data.status;
        doctor.averageConsultationMinutes = data.averageConsultationMinutes;
        doctor.consultationFee = data.consultationFee;
        await doctor.save();
      }

      // 3. Clear today's non-patient appointments for this doctor to keep queue deterministic
      await Appointment.deleteMany({
        doctorId: doctor._id,
        date: todayStr,
        patientId: { $ne: demoPatient._id },
      });

      // 4. Create deterministic waiting appointments
      const count = data.waitingPatientCount;
      for (let i = 1; i <= count; i++) {
        // dummy patient user
        const dummyEmail = `patient${i}.${data.specialization.toLowerCase().replace(/[^a-z]/g, '')}@example.com`;
        let dummyUser = await User.findOne({ email: dummyEmail });
        if (!dummyUser) {
          dummyUser = await User.create({
            name: dummyNames[(i - 1) % dummyNames.length],
            email: dummyEmail,
            password: doctorPassword,
            role: 'patient',
          });
        }

        const hour = 9 + Math.floor((i * data.averageConsultationMinutes) / 60);
        const min = (i * data.averageConsultationMinutes) % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const isCurrentlyServing = i === 1 && data.status !== 'OFFLINE' && count > 1;

        await Appointment.create({
          patientId: dummyUser._id,
          doctorId: doctor._id,
          date: todayStr,
          time: timeStr,
          type: i % 2 === 0 ? 'video' : 'in_person',
          status: isCurrentlyServing ? 'in_consultation' : 'waiting',
          queueNumber: i,
          reason: 'Follow-up checkup',
          consultationStartedAt: isCurrentlyServing ? new Date() : null,
          checkedInAt: new Date(),
        });
      }

      console.log(`[Seed Doctors] Seeded ${data.name} (${data.specialization}) with ${count} waiting patients.`);
    }

    // 5. Ensure demo patient has at least one active appointment with Dr. Rahul Sharma so queue tracking shows up immediately!
    const drRahul = await Doctor.findOne({ name: 'Dr. Rahul Sharma' });
    if (drRahul && demoPatient) {
      const existingDemoAppointment = await Appointment.findOne({
        patientId: demoPatient._id,
        doctorId: drRahul._id,
        date: todayStr,
        status: { $in: ['confirmed', 'waiting', 'in_consultation'] },
      });

      if (!existingDemoAppointment) {
        await Appointment.create({
          patientId: demoPatient._id,
          doctorId: drRahul._id,
          date: todayStr,
          time: '11:45',
          type: 'video',
          status: 'waiting',
          queueNumber: 4,
          reason: 'Routine consultation & prescription review',
          checkedInAt: new Date(),
        });
        console.log('[Seed Doctors] Seeded active video appointment for demo patient with Dr. Rahul Sharma');
      }
    }

    console.log('[Seed Doctors] Successfully finished doctor and queue seeding!');
  } catch (err) {
    console.error('[Seed Doctors] Error seeding doctors:', err);
  }
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('seedDoctors.js')) {
  seedDoctors().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}
