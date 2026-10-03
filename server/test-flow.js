import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- Starting Smart Medication Adherence E2E Verification ---');

  // 1. Health check
  const health = await axios.get('http://localhost:5000/api/health');
  console.log('✓ Health check passed:', health.data.service);

  // 2. Login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'demo@example.com',
    password: 'Demo@123',
  });
  const token = loginRes.data.token;
  console.log('✓ Login successful for:', loginRes.data.user.name);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Upload Prescription Image & trigger OCR + AI
  const form = new FormData();
  const sampleImagePath = './uploads/sample-prescription.png';
  form.append('prescription', fs.createReadStream(sampleImagePath));

  const uploadRes = await axios.post(`${BASE_URL}/prescriptions/upload`, form, {
    headers: { ...authHeaders, ...form.getHeaders() },
  });
  const rx = uploadRes.data.prescription;
  console.log('✓ Prescription uploaded & OCR completed: ID =', rx._id);
  console.log(`  Extracted ${rx.extractedMedications.length} medications:`);
  rx.extractedMedications.forEach((m) => {
    console.log(`  - ${m.name} ${m.strength} (${m.doseAmount} ${m.doseUnit}) | ${m.frequency} | ${m.durationValue} ${m.durationUnit} | Confidence: ${m.confidence}`);
  });

  // 4. Verify Prescription & generate active schedule
  const verifyRes = await axios.post(
    `${BASE_URL}/prescriptions/${rx._id}/verify`,
    { medications: rx.extractedMedications },
    { headers: authHeaders }
  );
  console.log('✓ Prescription verified! Created doses count:', verifyRes.data.totalDosesCreated);

  // 5. Fetch Today's doses
  const todayRes = await axios.get(`${BASE_URL}/doses/today`, { headers: authHeaders });
  console.log(`✓ Today's scheduled doses (${todayRes.data.doses.length} doses):`);
  const pendingDose = todayRes.data.doses.find((d) => d.status === 'pending');
  if (pendingDose) {
    console.log(`  Found pending dose: ${pendingDose.medicationName} at ${pendingDose.scheduledTime}`);

    // 6. Mark pending dose as Taken
    const markTakenRes = await axios.post(`${BASE_URL}/doses/${pendingDose._id}/taken`, {}, { headers: authHeaders });
    console.log('✓ Marked dose as taken:', markTakenRes.data.message);
  }

  // 7. Check Adherence Dashboard Analytics
  const adhRes = await axios.get(`${BASE_URL}/adherence/summary`, { headers: authHeaders });
  console.log(`✓ Adherence Summary: Rate = ${adhRes.data.summary.adherenceRate}% (${adhRes.data.summary.category})`);
  console.log(`  Taken: ${adhRes.data.summary.taken}, Missed: ${adhRes.data.summary.missed}, Total: ${adhRes.data.summary.totalScheduled}`);

  // 8. Weekly trend
  const weeklyRes = await axios.get(`${BASE_URL}/adherence/weekly`, { headers: authHeaders });
  console.log(`✓ Weekly trend points: ${weeklyRes.data.weekly.length} days of chart data`);

  // 9. Medication information
  const medsRes = await axios.get(`${BASE_URL}/medications`, { headers: authHeaders });
  const med = medsRes.data.medications[0];
  const medInfoRes = await axios.get(`${BASE_URL}/medications/${med._id}`, { headers: authHeaders });
  console.log(`✓ Medication Information for ${medInfoRes.data.medication.name}:`);
  console.log(`  Category: ${medInfoRes.data.referenceInfo.category}`);
  console.log(`  Description: ${medInfoRes.data.referenceInfo.description.substring(0, 80)}...`);

  console.log('\n======================================================');
  console.log('  ALL 8 MVP FEATURES SUCCESSFULLY TESTED & VERIFIED!  ');
  console.log('======================================================');
}

runTest().catch((err) => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
