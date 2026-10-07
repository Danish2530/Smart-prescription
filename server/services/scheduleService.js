import Dose from '../models/Dose.js';

/**
 * Schedule Service
 *
 * Converts VERIFIED medication details into scheduled Dose records.
 *
 * IMPORTANT:
 * - Never invent medication information.
 * - Never create fixed schedules for PRN/SOS.
 * - Never assume a missing duration.
 * - Never assume an unknown frequency.
 */
class ScheduleService {
  /**
   * Determine dose times based on verified frequency
   */
  getDoseTimesForFrequency(frequency, instructions = '') {
    const freq = (frequency || '').toLowerCase().trim();
    const inst = (instructions || '').toLowerCase().trim();

    if (!freq) {
      return [];
    }

    /*
     * PRN / SOS / As Needed
     *
     * These should NOT generate automatic fixed doses.
     */
    if (
      freq.includes('as needed') ||
      freq.includes('prn') ||
      freq.includes('sos') ||
      freq.includes('flexible') ||
      freq.includes('when required')
    ) {
      return [];
    }

    /*
     * Three times daily
     */
    if (
      freq.includes('3 times') ||
      freq.includes('three times') ||
      freq.includes('tid')
    ) {
      return [
        '08:00 AM',
        '02:00 PM',
        '08:00 PM',
      ];
    }

    /*
     * Four times daily
     */
    if (
      freq.includes('4 times') ||
      freq.includes('four times') ||
      freq.includes('qid')
    ) {
      return [
        '08:00 AM',
        '12:00 PM',
        '04:00 PM',
        '08:00 PM',
      ];
    }

    /*
     * Twice daily
     */
    if (
      freq.includes('twice') ||
      freq.includes('2 times') ||
      freq.includes('bid')
    ) {
      return [
        '08:00 AM',
        '08:00 PM',
      ];
    }

    /*
     * Once daily
     */
    if (
      freq.includes('once') ||
      freq.includes('1 time') ||
      freq === 'daily' ||
      freq.includes('daily') ||
      freq.includes('qd')
    ) {
      /*
       * These times are application scheduling defaults,
       * not AI-generated medical instructions.
       */

      if (
        inst.includes('bedtime') ||
        inst.includes('before bedtime') ||
        inst.includes('night')
      ) {
        return ['09:30 PM'];
      }

      if (
        inst.includes('lunch') ||
        inst.includes('afternoon')
      ) {
        return ['01:00 PM'];
      }

      if (
        inst.includes('dinner') ||
        inst.includes('evening')
      ) {
        return ['08:00 PM'];
      }

      /*
       * Default application time for once-daily
       * after the user has explicitly verified
       * "once daily".
       */
      return ['08:00 AM'];
    }

    /*
     * Unknown frequency:
     * DO NOT invent a schedule.
     */
    console.warn(
      `[ScheduleService] Unknown frequency: "${frequency}". No automatic doses created.`
    );

    return [];
  }

  /**
   * Generate scheduled Dose documents
   */
  async generateMedicationSchedule(medication) {
    if (!medication) {
      throw new Error(
        'Medication information is required.'
      );
    }

    if (!medication.verified) {
      throw new Error(
        'Only verified medications can generate active schedules.'
      );
    }

    /*
     * Validate required fields
     */
    const requiredFields = [
      'name',
      'strength',
      'doseAmount',
      'doseUnit',
      'frequency',
      'durationValue',
      'durationUnit',
    ];

    for (const field of requiredFields) {
      if (
        medication[field] === null ||
        medication[field] === undefined ||
        medication[field] === ''
      ) {
        throw new Error(
          `Medication field "${field}" is required before generating a schedule.`
        );
      }
    }

    /*
     * Validate numeric values
     */
    const doseAmount = Number(
      medication.doseAmount
    );

    if (
      !Number.isFinite(doseAmount) ||
      doseAmount <= 0
    ) {
      throw new Error(
        'Medication dose amount must be a valid positive number.'
      );
    }

    let daysCount = Number(
      medication.durationValue
    );

    if (
      !Number.isFinite(daysCount) ||
      daysCount <= 0
    ) {
      throw new Error(
        'Medication duration must be a valid positive number.'
      );
    }

    /*
     * Convert duration to days
     */
    const unit = String(
      medication.durationUnit
    ).toLowerCase();

    if (unit.startsWith('week')) {
      daysCount *= 7;
    } else if (unit.startsWith('month')) {
      daysCount *= 30;
    }

    /*
     * Safety/performance cap
     */
    daysCount = Math.min(
      Math.ceil(daysCount),
      90
    );

    /*
     * Determine schedule times
     */
    const times =
      this.getDoseTimesForFrequency(
        medication.frequency,
        medication.instructions
      );

    /*
     * PRN / unknown frequency
     */
    if (times.length === 0) {
      return [];
    }

    /*
     * Start date
     */
    const startDate = medication.startDate
      ? new Date(medication.startDate)
      : new Date();

    if (Number.isNaN(startDate.getTime())) {
      throw new Error(
        'Invalid medication start date.'
      );
    }

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    /*
     * Build Dose documents
     */
    const dosesToCreate = [];

    for (
      let dayOffset = 0;
      dayOffset < daysCount;
      dayOffset++
    ) {
      const currentDate =
        new Date(startDate);

      currentDate.setDate(
        startDate.getDate() + dayOffset
      );

      currentDate.setHours(
        0,
        0,
        0,
        0
      );

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

    if (dosesToCreate.length === 0) {
      return [];
    }

    return await Dose.insertMany(
      dosesToCreate
    );
  }
}

export default new ScheduleService();