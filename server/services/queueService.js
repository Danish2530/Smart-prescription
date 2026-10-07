import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

/**
 * Queue Calculation & Traffic Service
 *
 * "Patient Traffic" indicates how busy the doctor currently is.
 * MVP calculation: estimatedWaitTime = patientsAhead × averageConsultationMinutes
 * Traffic levels: LOW (0-3), MODERATE (4-8), HIGH (>8)
 */
class QueueService {
  /**
   * Determine patient traffic status based on waiting count
   */
  getTrafficLevel(waitingCount) {
    if (waitingCount <= 3) return 'LOW';
    if (waitingCount <= 8) return 'MODERATE';
    return 'HIGH';
  }

  /**
   * Get queue analytics for a specific doctor today
   */
  async getDoctorQueueStats(doctorId, dateString = null) {
    const today = dateString || new Date().toISOString().split('T')[0];
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const appointmentsToday = await Appointment.find({
      doctorId,
      date: today,
      status: { $ne: 'cancelled' },
    }).sort({ queueNumber: 1, time: 1 });

    const waitingPatients = appointmentsToday.filter((a) =>
      ['checked_in', 'waiting'].includes(a.status)
    );
    const inConsultation = appointmentsToday.find(
      (a) => a.status === 'in_consultation'
    );
    const completedToday = appointmentsToday.filter(
      (a) => a.status === 'completed'
    );

    const patientsWaitingCount = waitingPatients.length;
    const avgDuration = doctor.averageConsultationMinutes || 15;
    const estimatedWaitMinutes = patientsWaitingCount * avgDuration;
    const trafficLevel = this.getTrafficLevel(patientsWaitingCount);

    // Calculate next available slot
    let nextAvailableSlot = null;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(
      currentMinute
    ).padStart(2, '0')}`;

    const bookedTimes = new Set(
      appointmentsToday
        .filter((a) => a.status !== 'cancelled')
        .map((a) => a.time)
    );

    const startH = parseInt(doctor.availableHours?.start?.split(':')[0] || '9', 10);
    const endH = parseInt(doctor.availableHours?.end?.split(':')[0] || '18', 10);

    for (let h = Math.max(startH, currentHour); h < endH; h++) {
      for (let m = 0; m < 60; m += avgDuration) {
        const slotTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (slotTime > currentTimeStr && !bookedTimes.has(slotTime)) {
          nextAvailableSlot = slotTime;
          break;
        }
      }
      if (nextAvailableSlot) break;
    }

    if (!nextAvailableSlot) {
      nextAvailableSlot = 'Tomorrow 09:30 AM';
    }

    return {
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorStatus: doctor.status,
      date: today,
      totalToday: appointmentsToday.length,
      patientsWaiting: patientsWaitingCount,
      currentConsultation: inConsultation
        ? {
            appointmentId: inConsultation._id,
            queueNumber: inConsultation.queueNumber,
            startedAt: inConsultation.consultationStartedAt,
          }
        : null,
      completedTodayCount: completedToday.length,
      averageConsultationMinutes: avgDuration,
      estimatedWaitMinutes,
      trafficLevel,
      nextAvailableSlot,
      queue: waitingPatients.map((p) => ({
        appointmentId: p._id,
        queueNumber: p.queueNumber,
        status: p.status,
        time: p.time,
        patientId: p.patientId,
      })),
    };
  }

  /**
   * Get queue position & estimated wait for a specific patient appointment
   */
  async getPatientQueuePosition(appointmentId) {
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) throw new Error('Appointment not found');

    const doctor = appointment.doctorId;
    const avgDuration = doctor.averageConsultationMinutes || 15;

    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      return {
        appointmentId: appointment._id,
        status: appointment.status,
        queueNumber: appointment.queueNumber,
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        statusMessage: `Appointment is ${appointment.status}`,
      };
    }

    // Find all patients currently ahead in queue
    const patientsAheadList = await Appointment.find({
      doctorId: doctor._id,
      date: appointment.date,
      status: { $in: ['checked_in', 'waiting'] },
      queueNumber: { $lt: appointment.queueNumber },
    }).sort({ queueNumber: 1 });

    const inConsultation = await Appointment.findOne({
      doctorId: doctor._id,
      date: appointment.date,
      status: 'in_consultation',
    });

    let patientsAhead = patientsAheadList.length;
    if (inConsultation && inConsultation._id.toString() !== appointment._id.toString()) {
      patientsAhead += 1;
    }

    const estimatedWaitMinutes = patientsAhead * avgDuration;

    let statusMessage = "You're scheduled";
    if (appointment.status === 'in_consultation') {
      statusMessage = "It's your turn! In consultation now.";
    } else if (patientsAhead === 0 && inConsultation) {
      statusMessage = "You're next in line! Doctor will call you shortly.";
    } else if (patientsAhead <= 2) {
      statusMessage = "You're almost there! Please be ready.";
    } else {
      statusMessage = `${patientsAhead} patients ahead of you.`;
    }

    return {
      appointmentId: appointment._id,
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorStatus: doctor.status,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      queueNumber: appointment.queueNumber,
      patientsAhead,
      estimatedWaitMinutes,
      statusMessage,
      trafficLevel: this.getTrafficLevel(patientsAhead),
      currentServingNumber: inConsultation ? inConsultation.queueNumber : (patientsAheadList[0]?.queueNumber || appointment.queueNumber),
    };
  }

  /**
   * Generate next sequential queue number for doctor on given date
   */
  async getNextQueueNumber(doctorId, dateString) {
    const lastAppointment = await Appointment.findOne({
      doctorId,
      date: dateString,
    }).sort({ queueNumber: -1 });

    return lastAppointment && lastAppointment.queueNumber ? lastAppointment.queueNumber + 1 : 1;
  }
}

export default new QueueService();
