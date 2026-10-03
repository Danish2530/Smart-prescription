import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import Medication from '../models/Medication.js';
import Dose from '../models/Dose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createSamplePrescriptionFile = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const samplePath = path.join(uploadsDir, 'sample-prescription.png');
  // Create an SVG-based PNG placeholder or lightweight image if not exists
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#ffffff;font-family:Arial,sans-serif;">
    <rect width="600" height="800" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
    <rect x="20" y="20" width="560" height="120" fill="#f0f9ff" rx="8"/>
    <text x="40" y="55" font-size="22" font-weight="bold" fill="#0369a1">APOLLO CLINIC &amp; HEALTHCARE</text>
    <text x="40" y="80" font-size="14" fill="#0284c7">Dr. S. Mehta, MBBS, MD (General Medicine)</text>
    <text x="40" y="102" font-size="12" fill="#64748b">Reg No: MC-49201 | Ph: +91 98765 43210</text>
    <line x1="20" y1="160" x2="580" y2="160" stroke="#cbd5e1" stroke-width="2"/>
    <text x="40" y="190" font-size="14" font-weight="bold" fill="#334155">Patient: Rahul Sharma</text>
    <text x="320" y="190" font-size="14" fill="#334155">Age: 38 Yrs | Male</text>
    <text x="40" y="215" font-size="13" fill="#64748b">Date: ${new Date().toLocaleDateString('en-US')}</text>
    <text x="40" y="260" font-size="30" font-weight="bold" fill="#0284c7" font-style="italic">Rx</text>
    <!-- Med 1 -->
    <rect x="35" y="280" width="530" height="100" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="50" y="310" font-size="16" font-weight="bold" fill="#0f172a">1. Amoxicillin 500 mg (Tablet)</text>
    <text x="70" y="335" font-size="14" fill="#334155">Take 1 tablet three times daily (TID)</text>
    <text x="70" y="360" font-size="13" fill="#64748b">Duration: 5 days | Take after meals with plenty of water</text>
    <!-- Med 2 -->
    <rect x="35" y="400" width="530" height="100" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="50" y="430" font-size="16" font-weight="bold" fill="#0f172a">2. Pantoprazole 40 mg (Tablet)</text>
    <text x="70" y="455" font-size="14" fill="#334155">Take 1 tablet once daily (OD)</text>
    <text x="70" y="480" font-size="13" fill="#64748b">Duration: 5 days | Take before breakfast on empty stomach</text>
    <!-- Advice -->
    <text x="40" y="540" font-size="13" font-weight="bold" fill="#0f172a">Instructions &amp; Advice:</text>
    <text x="40" y="565" font-size="13" fill="#64748b">• Complete the entire course of antibiotics as directed.</text>
    <text x="40" y="585" font-size="13" fill="#64748b">• Drink adequate fluids and maintain rest.</text>
    <!-- Signature -->
    <line x1="380" y1="710" x2="540" y2="710" stroke="#0f172a" stroke-width="1"/>
    <text x="400" y="730" font-size="13" font-weight="bold" fill="#0f172a">Dr. S. Mehta</text>
    <text x="400" y="748" font-size="11" fill="#64748b">Authorized Medical Practitioner</text>
  </svg>`;

  fs.writeFileSync(samplePath, svgData);
  console.log('[Seed] Sample prescription generated at:', samplePath);
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_medication_db';
    console.log('[Seed] Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Cleaning existing data...');
    await User.deleteMany({});
    await Prescription.deleteMany({});
    await Medication.deleteMany({});
    await Dose.deleteMany({});

    createSamplePrescriptionFile();

    // 1. Create Demo User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Demo@123', salt);

    const demoUser = await User.create({
      name: 'Rahul Sharma',
      email: 'demo@example.com',
      password: hashedPassword,
      phone: '+91 98765 43210',
    });
    console.log('[Seed] Demo User created:', demoUser.email);

    // 2. Create Demo Prescription
    const ocrSampleText = `APOLLO CLINIC & HEALTHCARE
Dr. S. Mehta, MBBS, MD (General Medicine)
Reg No: MC-49201 | Ph: +91 98765 43210

Patient: Rahul Sharma    Age: 38 Yrs | Male
Date: ${new Date().toLocaleDateString('en-US')}

Rx:
1. Amoxicillin 500 mg
   Take 1 tablet 3 times daily
   Duration: 5 days
   Instructions: After meals

2. Pantoprazole 40 mg
   Take 1 tablet once daily
   Duration: 5 days
   Instructions: Before breakfast

Doctor's Signature: Dr. S. Mehta`;

    const prescription = await Prescription.create({
      patientId: demoUser._id,
      imageUrl: '/uploads/sample-prescription.png',
      ocrText: ocrSampleText,
      extractionStatus: 'completed',
      extractedMedications: [
        {
          name: 'Amoxicillin',
          strength: '500 mg',
          doseAmount: 1,
          doseUnit: 'tablet',
          frequency: '3 times daily',
          durationValue: 5,
          durationUnit: 'days',
          instructions: 'After meals',
          confidence: 'high',
          needsVerification: false,
        },
        {
          name: 'Pantoprazole',
          strength: '40 mg',
          doseAmount: 1,
          doseUnit: 'tablet',
          frequency: 'once daily',
          durationValue: 5,
          durationUnit: 'days',
          instructions: 'Before breakfast',
          confidence: 'high',
          needsVerification: false,
        },
      ],
      verified: true,
    });
    console.log('[Seed] Demo Prescription created');

    // 3. Create Demo Medications
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const medStartDate = new Date(today);
    medStartDate.setDate(today.getDate() - 3); // Started 3 days ago

    const medEndDate = new Date(medStartDate);
    medEndDate.setDate(medStartDate.getDate() + 5);

    const medAmox = await Medication.create({
      patientId: demoUser._id,
      prescriptionId: prescription._id,
      name: 'Amoxicillin',
      strength: '500 mg',
      doseAmount: 1,
      doseUnit: 'tablet',
      frequency: '3 times daily',
      durationValue: 5,
      durationUnit: 'days',
      instructions: 'Take after meals with water',
      startDate: medStartDate,
      endDate: medEndDate,
      verified: true,
    });

    const medPanto = await Medication.create({
      patientId: demoUser._id,
      prescriptionId: prescription._id,
      name: 'Pantoprazole',
      strength: '40 mg',
      doseAmount: 1,
      doseUnit: 'tablet',
      frequency: 'once daily',
      durationValue: 5,
      durationUnit: 'days',
      instructions: 'Take 30 mins before breakfast',
      startDate: medStartDate,
      endDate: medEndDate,
      verified: true,
    });
    console.log('[Seed] Verified Medications created');

    // 4. Create Historical and Current Doses
    // Target metrics as specified in Prompt:
    // Scheduled: 30 evaluated (26 taken, 4 missed) -> 86.7% Adherence
    const doses = [];

    // Let's create doses for past 7 days:
    // Days -7 to -1: exactly 24 taken, 4 missed
    // Day 0 (Today): 2 taken (morning), 2 pending (afternoon & evening)
    // Total taken so far = 26, missed = 4. 26/30 = 86.7%!
    
    // Past days breakdown:
    const pastDaysDistribution = [
      { dayOffset: -7, taken: 4, missed: 0 },
      { dayOffset: -6, taken: 3, missed: 1 },
      { dayOffset: -5, taken: 4, missed: 0 },
      { dayOffset: -4, taken: 3, missed: 1 },
      { dayOffset: -3, taken: 4, missed: 0 },
      { dayOffset: -2, taken: 3, missed: 1 },
      { dayOffset: -1, taken: 3, missed: 1 },
    ];

    pastDaysDistribution.forEach((dist) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + dist.dayOffset);

      // Morning Amoxicillin (Taken)
      doses.push({
        patientId: demoUser._id,
        medicationId: medAmox._id,
        scheduledDate: dayDate,
        scheduledTime: '08:00 AM',
        status: 'taken',
        takenAt: new Date(dayDate.getTime() + 8 * 3600000 + 15 * 60000),
      });

      // Morning Pantoprazole (Taken)
      doses.push({
        patientId: demoUser._id,
        medicationId: medPanto._id,
        scheduledDate: dayDate,
        scheduledTime: '08:00 AM',
        status: 'taken',
        takenAt: new Date(dayDate.getTime() + 7 * 3600000 + 45 * 60000),
      });

      // Afternoon Amoxicillin
      doses.push({
        patientId: demoUser._id,
        medicationId: medAmox._id,
        scheduledDate: dayDate,
        scheduledTime: '02:00 PM',
        status: dist.missed > 0 ? 'missed' : 'taken',
        takenAt: dist.missed > 0 ? null : new Date(dayDate.getTime() + 14 * 3600000 + 20 * 60000),
      });

      // Evening Amoxicillin (Taken)
      doses.push({
        patientId: demoUser._id,
        medicationId: medAmox._id,
        scheduledDate: dayDate,
        scheduledTime: '08:00 PM',
        status: 'taken',
        takenAt: new Date(dayDate.getTime() + 20 * 3600000 + 10 * 60000),
      });
    });

    // Today's doses:
    // Today 08:00 AM Amoxicillin -> Taken
    doses.push({
      patientId: demoUser._id,
      medicationId: medAmox._id,
      scheduledDate: today,
      scheduledTime: '08:00 AM',
      status: 'taken',
      takenAt: new Date(today.getTime() + 8 * 3600000 + 12 * 60000),
    });

    // Today 08:00 AM Pantoprazole -> Taken
    doses.push({
      patientId: demoUser._id,
      medicationId: medPanto._id,
      scheduledDate: today,
      scheduledTime: '08:00 AM',
      status: 'taken',
      takenAt: new Date(today.getTime() + 7 * 3600000 + 50 * 60000),
    });

    // Today 02:00 PM Amoxicillin -> Pending
    doses.push({
      patientId: demoUser._id,
      medicationId: medAmox._id,
      scheduledDate: today,
      scheduledTime: '02:00 PM',
      status: 'pending',
      takenAt: null,
    });

    // Today 08:00 PM Amoxicillin -> Pending (Upcoming)
    doses.push({
      patientId: demoUser._id,
      medicationId: medAmox._id,
      scheduledDate: today,
      scheduledTime: '08:00 PM',
      status: 'pending',
      takenAt: null,
    });

    // Adjust past doses if needed to reach exactly 26 taken and 4 missed among evaluated
    let takenDoses = doses.filter((d) => d.status === 'taken');
    let missedDoses = doses.filter((d) => d.status === 'missed');

    while (missedDoses.length < 4 && takenDoses.length > 26) {
      const idx = doses.findIndex((d) => d.status === 'taken' && d.scheduledDate < today);
      if (idx !== -1) {
        doses[idx].status = 'missed';
        doses[idx].takenAt = null;
      }
      takenDoses = doses.filter((d) => d.status === 'taken');
      missedDoses = doses.filter((d) => d.status === 'missed');
    }

    while (takenDoses.length > 26 && doses.length > 30) {
      // Remove an extra past dose to keep 30 evaluated/scheduled doses
      const idx = doses.findIndex((d) => d.scheduledDate < today && d.status === 'taken');
      if (idx !== -1) {
        doses.splice(idx, 1);
        takenDoses = doses.filter((d) => d.status === 'taken');
      }
    }

    await Dose.insertMany(doses);

    const totalEvaluated = doses.filter((d) => d.status === 'taken' || d.status === 'missed');
    const finalTaken = doses.filter((d) => d.status === 'taken').length;
    const finalMissed = doses.filter((d) => d.status === 'missed').length;
    const finalAdherence = Math.round((finalTaken / totalEvaluated.length) * 1000) / 10;

    console.log(`[Seed Completed Successfully]!`);
    console.log(`Demo User: demo@example.com / Demo@123`);
    console.log(`Doses summary -> Evaluated: ${totalEvaluated.length}, Taken: ${finalTaken}, Missed: ${finalMissed}, Rate: ${finalAdherence}%`);
    console.log(`Today's Doses -> ${doses.filter((d) => d.scheduledDate.getTime() === today.getTime()).length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
