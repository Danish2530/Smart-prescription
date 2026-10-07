import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runComprehensiveVerification() {
  console.log('===============================================================');
  console.log('   PRESCRIPTO - COMPREHENSIVE REGRESSION & INTEGRATION SUITE   ');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${title}`);
    } else {
      console.error(`  ✗ [FAIL] ${title}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Health check
    console.log('Test 1: Health check');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.data.status === 'OK', 'Server is healthy and running');

    // 2. Patient Auth
    console.log('\nTest 2: Patient Authentication & Session');
    const patientLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'demo@example.com',
      password: 'Demo@123',
    });
    const patientToken = patientLogin.data.token;
    const patientHeaders = { Authorization: `Bearer ${patientToken}` };
    assert(patientLogin.data.success && patientLogin.data.user.role === 'patient', 'Patient login returns valid JWT and patient role');

    // 3. Existing Prescription & Medication Pipeline Check
    console.log('\nTest 3: Existing Medication & Adherence Regression Check');
    const medsRes = await axios.get(`${BASE_URL}/medications`, { headers: patientHeaders });
    assert(medsRes.data.success && Array.isArray(medsRes.data.medications), 'Existing medications API intact');

    const dosesRes = await axios.get(`${BASE_URL}/doses/today`, { headers: patientHeaders });
    assert(dosesRes.data.success && Array.isArray(dosesRes.data.doses), 'Existing dose schedule API intact');

    const adhRes = await axios.get(`${BASE_URL}/adherence/summary`, { headers: patientHeaders });
    assert(adhRes.data.success && adhRes.data.summary.adherenceRate !== undefined, 'Existing adherence analytics API intact');

    // 4. Doctor Auth
    console.log('\nTest 4: Doctor Authentication & Role Protection');
    const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'doctor.rahul@prescripto.com',
      password: 'Doctor@123',
    });
    const doctorToken = doctorLogin.data.token;
    const doctorHeaders = { Authorization: `Bearer ${doctorToken}` };
    assert(doctorLogin.data.success && doctorLogin.data.user.role === 'doctor', 'Doctor login authenticates with doctor role');

    // 5. Doctor Discovery & Live Queue Enrichment
    console.log('\nTest 5: Feature #1 & #2 - Doctor Discovery, Traffic & Wait Times');
    const doctorsRes = await axios.get(`${BASE_URL}/doctors`);
    assert(doctorsRes.data.success && doctorsRes.data.doctors.length >= 5, `Retrieved ${doctorsRes.data.doctors.length} doctors`);
    
    const drRahul = doctorsRes.data.doctors.find((d) => d.name.includes('Rahul Sharma'));
    assert(drRahul && drRahul.liveQueue && drRahul.liveQueue.trafficLevel, 'Doctor cards enriched with liveQueue traffic level');
    assert(drRahul.liveQueue.estimatedWaitMinutes !== undefined, `Calculated estimated wait time: ${drRahul.liveQueue.estimatedWaitMinutes} min`);

    // 6. Available Slots
    console.log('\nTest 6: Feature #4 - Doctor Available Slots');
    const slotsRes = await axios.get(`${BASE_URL}/doctors/${drRahul._id}/slots`);
    assert(slotsRes.data.success && slotsRes.data.slots.length > 0, `Generated ${slotsRes.data.slots.length} consultation slots`);

    // 7. Appointment Booking
    console.log('\nTest 7: Feature #4 & #7 - Online Appointment Booking & Queue Number');
    // Find an open slot
    const openSlot = slotsRes.data.slots.find((s) => !s.isBooked) || { time: '17:30' };
    const bookingRes = await axios.post(
      `${BASE_URL}/appointments`,
      {
        doctorId: drRahul._id,
        date: new Date().toISOString().split('T')[0],
        time: openSlot.time,
        type: 'video',
        reason: 'E2E Automated Healthcare Verification',
      },
      { headers: patientHeaders }
    );
    assert(bookingRes.data.success, 'Appointment booked successfully');
    const newAppointment = bookingRes.data.appointment;
    assert(newAppointment.queueNumber > 0, `Assigned queue number: #${newAppointment.queueNumber}`);
    assert(newAppointment.meetingRoomId, `Generated video meeting room: ${newAppointment.meetingRoomId}`);

    // 8. Double-Booking Prevention
    console.log('\nTest 8: Double-Booking Prevention');
    try {
      await axios.post(
        `${BASE_URL}/appointments`,
        {
          doctorId: drRahul._id,
          date: new Date().toISOString().split('T')[0],
          time: openSlot.time,
          type: 'video',
        },
        { headers: patientHeaders }
      );
      assert(false, 'Double booking allowed (FAIL)');
    } catch (err) {
      assert(err.response?.status === 409, 'Double booking rejected with 409 Conflict');
    }

    // 9. Patient Queue Position & Live Traffic Calculation
    console.log('\nTest 9: Feature #2 - Patient Queue Position & Estimated Wait');
    const queuePosRes = await axios.get(`${BASE_URL}/queue/position/${newAppointment._id}`, {
      headers: patientHeaders,
    });
    assert(queuePosRes.data.success, 'Queue position returned successfully');
    assert(queuePosRes.data.position.patientsAhead !== undefined, `Patients ahead: ${queuePosRes.data.position.patientsAhead}`);
    assert(queuePosRes.data.position.statusMessage, `Status message: "${queuePosRes.data.position.statusMessage}"`);

    // 10. Patient Check-In
    console.log('\nTest 10: Patient Queue Check-in');
    const checkInRes = await axios.post(`${BASE_URL}/appointments/${newAppointment._id}/check-in`, {}, {
      headers: patientHeaders,
    });
    assert(checkInRes.data.success && checkInRes.data.appointment.status === 'waiting', 'Patient checked in to waiting status');

    // 11. Video Consultation Room & Token Abstraction
    console.log('\nTest 11: Feature #5 - Video Consultation Abstraction');
    const videoRes = await axios.get(`${BASE_URL}/video/${newAppointment._id}`, {
      headers: patientHeaders,
    });
    assert(videoRes.data.success, 'Video room details retrieved');
    assert(videoRes.data.meeting.token && videoRes.data.meeting.roomId, 'Security token and room ID issued');

    // 12. AI Health Assistant (Feature #6)
    console.log('\nTest 12: Feature #6 - AI Health Assistant (Isolated Service)');
    const aiChatRes = await axios.post(`${BASE_URL}/health-chat`, {
      message: 'What does BID and TID mean on my medicine?',
    });
    assert(aiChatRes.data.success, 'AI Health Assistant answered inquiry');
    assert(aiChatRes.data.reply.toLowerCase().includes('bid') || aiChatRes.data.reply.toLowerCase().includes('twice'), 'Accurately explained medical abbreviation');
    assert(aiChatRes.data.reply.toLowerCase().includes('disclaimer') || aiChatRes.data.reply.toLowerCase().includes('doctor'), 'Medical disclaimer included in response');

    // 13. Doctor Admin Panel & Queue Actions (Feature #3)
    console.log('\nTest 13: Feature #3 - Doctor Command Center & Queue Operations');
    const docProfileRes = await axios.get(`${BASE_URL}/doctors/me`, { headers: doctorHeaders });
    assert(docProfileRes.data.success && docProfileRes.data.doctor.name.includes('Rahul'), 'Doctor console profile loaded');

    // Change status
    const statusUpdateRes = await axios.patch(
      `${BASE_URL}/doctors/status`,
      { status: 'BUSY' },
      { headers: doctorHeaders }
    );
    assert(statusUpdateRes.data.success && statusUpdateRes.data.doctor.status === 'BUSY', 'Doctor status updated to BUSY');

    // Restore to AVAILABLE
    await axios.patch(`${BASE_URL}/doctors/status`, { status: 'AVAILABLE' }, { headers: doctorHeaders });

    // Call Next Patient
    const callNextRes = await axios.post(`${BASE_URL}/queue/doctor/call-next`, {}, {
      headers: doctorHeaders,
    });
    assert(callNextRes.data.success, 'Doctor called next patient into consultation');

    console.log('\n===============================================================');
    console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('Test execution failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runComprehensiveVerification();
