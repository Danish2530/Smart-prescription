import Dose from '../models/Dose.js';

/**
 * Get scheduled dose times based on medication frequency.
 *
 * Returns an empty array for PRN / As Needed medications
 * because those doses should not be automatically scheduled.
 */
const getDoseTimesForFrequency = (frequency, instructions = '') => {
  const freq = String(frequency || '').toLowerCase().trim();
  const instructionText = String(instructions || '').toLowerCase().trim();

  // PRN / As Needed
  if (
    freq.includes('prn') ||
    freq.includes('as needed') ||
    freq.includes('sos') ||
    freq.includes('flexible') ||
    freq.includes('when required')
  ) {
    return [];
  }

  // 3 times daily
  if (
    freq.includes('3 times') ||
    freq.includes('three times') ||
    freq.includes('tid')
  ) {
    return ['08:00 AM', '02:00 PM', '08:00 PM'];
  }

  // 4 times daily
  if (
    freq.includes('4 times') ||
    freq.includes('four times') ||
    freq.includes('qid')
  ) {
    return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
  }

  // Twice daily
  if (
    freq.includes('twice') ||
    freq.includes('2 times') ||
    freq.includes('two times') ||
    freq.includes('bid')
  ) {
    return ['08:00 AM', '08:00 PM'];
  }

  // Once daily
  if (
    freq.includes('once') ||
    freq.includes('daily') ||
    freq.includes('qd')
  ) {
    if (
      instructionText.includes('bedtime') ||
      instructionText.includes('night')
    ) {
      return ['09:30 PM'];
    }

    if (
      instructionText.includes('lunch') ||
      instructionText.includes('afternoon')
    ) {
      return ['01:00 PM'];
    }

    if (
      instructionText.includes('dinner') ||
      instructionText.includes('evening')
    ) {
      return ['08:00 PM'];
    }

    return ['08:00 AM'];
  }

  console.warn(
    `[ScheduleService] Unknown frequency: "${frequency}". No automatic doses created.`
  );

  return [];
};

/**
 * Convert a date to a clean scheduled date.
 */
const createScheduledDate = (startDate, dayOffset) => {
  const date = new Date(startDate);

  date.setDate(date.getDate() + dayOffset);

  return date;
};

/**
 * Build dose documents in memory.
 *
 * IMPORTANT:
 * This function DOES NOT write to MongoDB.
 *
 * It only creates the documents so the controller can combine
 * doses from all medications and perform ONE bulk insert.
 */
const buildMedicationDoseDocuments = (medication) => {
  if (!medication) {
    throw new Error('Medication data is required.');
  }

  if (!medication.verified) {
    throw new Error(
      `Medication "${medication.name || 'Unknown'}" must be verified before scheduling.`
    );
  }

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
      medication[field] === undefined ||
      medication[field] === null ||
      medication[field] === ''
    ) {
      throw new Error(
        `Missing required medication field: ${field}`
      );
    }
  }

  const doseAmount = Number(medication.doseAmount);

  if (!Number.isFinite(doseAmount) || doseAmount <= 0) {
    throw new Error(
      `Invalid dose amount for medication "${medication.name}".`
    );
  }

  let durationDays = Number(medication.durationValue);

  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw new Error(
      `Invalid duration for medication "${medication.name}".`
    );
  }

  const durationUnit = String(
    medication.durationUnit || 'days'
  ).toLowerCase();

  if (
    durationUnit.includes('week')
  ) {
    durationDays *= 7;
  } else if (
    durationUnit.includes('month')
  ) {
    durationDays *= 30;
  }

  // Safety cap
  durationDays = Math.min(
    Math.ceil(durationDays),
    90
  );

  const doseTimes = getDoseTimesForFrequency(
    medication.frequency,
    medication.instructions
  );

  // PRN / unsupported frequency
  if (!doseTimes.length) {
    return [];
  }

  const startDate = new Date(medication.startDate);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error(
      `Invalid start date for medication "${medication.name}".`
    );
  }

  const doses = [];

  for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
    const scheduledDate = createScheduledDate(
      startDate,
      dayOffset
    );

    for (const scheduledTime of doseTimes) {
      doses.push({
        patientId: medication.patientId,
        medicationId: medication._id,
        scheduledDate,
        scheduledTime,
        status: 'pending',
      });
    }
  }

  return doses;
};

/**
 * Generate and save schedule for ONE medication.
 *
 * Kept for compatibility with existing code elsewhere.
 */
const generateMedicationSchedule = async (medication) => {
  const doses = buildMedicationDoseDocuments(medication);

  if (!doses.length) {
    return [];
  }

  return await Dose.insertMany(doses);
};

/**
 * Generate schedules for MULTIPLE medications using ONE database insert.
 *
 * This is the optimized method used by prescription verification.
 */
const generateBulkMedicationSchedule = async (medications) => {
  if (!Array.isArray(medications) || medications.length === 0) {
    return [];
  }

  const allDoses = [];

  for (const medication of medications) {
    const medicationDoses =
      buildMedicationDoseDocuments(medication);

    allDoses.push(...medicationDoses);
  }

  if (!allDoses.length) {
    return [];
  }

  console.log(
    `[ScheduleService] Bulk inserting ${allDoses.length} doses...`
  );

  const createdDoses = await Dose.insertMany(
    allDoses,
    {
      ordered: false,
    }
  );

  console.log(
    `[ScheduleService] Created ${createdDoses.length} doses.`
  );

  return createdDoses;
};

const scheduleService = {
  getDoseTimesForFrequency,
  buildMedicationDoseDocuments,
  generateMedicationSchedule,
  generateBulkMedicationSchedule,
};

export default scheduleService;