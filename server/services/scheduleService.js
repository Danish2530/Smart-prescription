import Dose from '../models/Dose.js';

/**
 * Schedule Service
 * Converts verified medication details, frequency, duration, and instructions
 * into discrete scheduled Dose records in the database.
 */
class ScheduleService {
  /**
   * Determine dose times based on frequency and specific instructions
   * @param {string} frequency
   * @param {string} [instructions]
   * @returns {string[]} Array of formatted time strings (e.g. ['08:00 AM', '08:00 PM'])
   */
  getDoseTimesForFrequency(frequency, instructions = '') {
    const freq = (frequency || '').toLowerCase();
    const inst = (instructions || '').toLowerCase();

    // Check for flexible / PRN / as needed
    if (
      freq.includes('as needed') ||
      freq.includes('prn') ||
      freq.includes('sos') ||
      freq.includes('directed') ||
      freq.includes('flexible')
    ) {
      return []; // Do not invent fixed times for PRN / As Needed prescriptions
    }

    if (freq.includes('3 times') || freq.includes('three times') || freq.includes('tid')) {
      return ['08:00 AM', '02:00 PM', '08:00 PM'];
    }

    if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
      return ['08:00 AM', '08:00 PM'];
    }

    if (freq.includes('4 times') || freq.includes('four times') || freq.includes('qid')) {
      return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
    }

    if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily') || freq.includes('qd')) {
      if (inst.includes('bedtime') || inst.includes('night')) {
        return ['09:30 PM'];
      }
      if (inst.includes('lunch') || inst.includes('afternoon')) {
        return ['01:00 PM'];
      }
      if (inst.includes('dinner') || inst.includes('evening')) {
        return ['08:00 PM'];
      }
      // Default morning dose for once-daily
      return ['08:00 AM'];
    }

    // Default fallback: 1 dose per day
    return ['09:00 AM'];
  }

  /**
   * Generate and insert scheduled dose documents for a verified medication
   * @param {Object} medication - Verified Medication document or object
   * @returns {Promise<Array>} List of generated Dose documents
   */
  async generateMedicationSchedule(medication) {
    if (!medication || !medication.verified) {
      throw new Error('Only verified medications can generate active schedules.');
    }

    const times = this.getDoseTimesForFrequency(medication.frequency, medication.instructions);

    // If PRN / As Needed, no automatic fixed doses are scheduled
    if (times.length === 0) {
      return [];
    }

    // Calculate total days
    let daysCount = medication.durationValue || 5;
    const unit = (medication.durationUnit || 'days').toLowerCase();
    if (unit.startsWith('week')) {
      daysCount *= 7;
    } else if (unit.startsWith('month')) {
      daysCount *= 30;
    }

    // Cap maximum auto-generated schedule to 90 days for safety and performance
    daysCount = Math.min(daysCount, 90);

    const startDate = medication.startDate ? new Date(medication.startDate) : new Date();
    // Normalize to start of day
    startDate.setHours(0, 0, 0, 0);

    const dosesToCreate = [];

    for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      currentDate.setHours(0, 0, 0, 0);

      for (const timeStr of times) {
        dosesToCreate.push({
          patientId: medication.patientId,
          medicationId: medication._id,
          scheduledDate: currentDate,
          scheduledTime: timeStr,
          status: 'pending',
          takenAt: null,
        });
      }
    }

    if (dosesToCreate.length > 0) {
      const createdDoses = await Dose.insertMany(dosesToCreate);
      return createdDoses;
    }

    return [];
  }
}

export default new ScheduleService();
