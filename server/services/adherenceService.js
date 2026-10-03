import mongoose from 'mongoose';
import Dose from '../models/Dose.js';
import Medication from '../models/Medication.js';

/**
 * Adherence Calculation Service
 * Centralizes all analytics, calculations, and compliance rates for patients.
 */
class AdherenceService {
  /**
   * Determine adherence visual badge category
   * @param {number} rate
   * @returns {string} 'Excellent' | 'Moderate' | 'Needs Attention'
   */
  getAdherenceCategory(rate) {
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Moderate';
    return 'Needs Attention';
  }

  /**
   * Calculate overall adherence summary for a patient
   * Formula: Taken / (Taken + Missed + Completed/Past Scheduled) * 100
   * @param {string|mongoose.Types.ObjectId} patientId
   */
  async calculateOverallAdherence(patientId) {
    const pId = new mongoose.Types.ObjectId(patientId);

    const stats = await Dose.aggregate([
      { $match: { patientId: pId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let taken = 0;
    let missed = 0;
    let pending = 0;
    let skipped = 0;

    stats.forEach((item) => {
      if (item._id === 'taken') taken = item.count;
      else if (item._id === 'missed') missed = item.count;
      else if (item._id === 'pending') pending = item.count;
      else if (item._id === 'skipped') skipped = item.count;
    });

    const totalScheduled = taken + missed + pending + skipped;
    // Evaluated doses (doses that have reached an outcome or should have been taken)
    const evaluatedDoses = taken + missed;

    let adherenceRate = 0;
    if (evaluatedDoses > 0) {
      adherenceRate = Math.round((taken / evaluatedDoses) * 1000) / 10;
    } else if (totalScheduled > 0 && pending > 0) {
      adherenceRate = 100; // All pending so far without missed
    }

    return {
      adherenceRate,
      category: this.getAdherenceCategory(adherenceRate),
      totalScheduled,
      taken,
      missed,
      pending,
      skipped,
    };
  }

  /**
   * Calculate 7-day adherence trend for Recharts
   * @param {string|mongoose.Types.ObjectId} patientId
   */
  async calculateWeeklyAdherence(patientId) {
    const pId = new mongoose.Types.ObjectId(patientId);

    const now = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      days.push({
        start: d,
        end: nextDay,
        dayLabel: dayNames[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
      });
    }

    const weeklyTrend = [];

    for (const day of days) {
      const dayDoses = await Dose.find({
        patientId: pId,
        scheduledDate: { $gte: day.start, $lt: day.end },
      });

      let taken = 0;
      let missed = 0;
      let pending = 0;

      dayDoses.forEach((d) => {
        if (d.status === 'taken') taken++;
        else if (d.status === 'missed') missed++;
        else pending++;
      });

      const total = dayDoses.length;
      const evaluated = taken + missed;
      let rate = 0;
      if (evaluated > 0) {
        rate = Math.round((taken / evaluated) * 100);
      } else if (total > 0 && pending > 0) {
        rate = 100;
      }

      weeklyTrend.push({
        day: day.dayLabel,
        date: day.dateStr,
        scheduled: total,
        taken,
        missed,
        pending,
        adherence: rate,
      });
    }

    return weeklyTrend;
  }

  /**
   * Calculate per-medication adherence breakdown
   * @param {string|mongoose.Types.ObjectId} patientId
   */
  async calculateMedicationAdherence(patientId) {
    const pId = new mongoose.Types.ObjectId(patientId);

    const medications = await Medication.find({ patientId: pId });
    const results = [];

    for (const med of medications) {
      const doses = await Dose.find({
        patientId: pId,
        medicationId: med._id,
      });

      let taken = 0;
      let missed = 0;
      let pending = 0;

      doses.forEach((d) => {
        if (d.status === 'taken') taken++;
        else if (d.status === 'missed') missed++;
        else pending++;
      });

      const total = doses.length;
      const evaluated = taken + missed;
      let rate = 0;
      if (evaluated > 0) {
        rate = Math.round((taken / evaluated) * 1000) / 10;
      } else if (total > 0) {
        rate = 100;
      }

      results.push({
        medicationId: med._id,
        name: med.name,
        strength: med.strength,
        frequency: med.frequency,
        totalScheduled: total,
        taken,
        missed,
        pending,
        adherenceRate: rate,
        category: this.getAdherenceCategory(rate),
      });
    }

    return results;
  }

  /**
   * Fetch the last N missed doses with medication details
   * @param {string|mongoose.Types.ObjectId} patientId
   * @param {number} limit
   */
  async getMissedDoses(patientId, limit = 5) {
    const pId = new mongoose.Types.ObjectId(patientId);

    const missed = await Dose.find({
      patientId: pId,
      status: 'missed',
    })
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .limit(limit)
      .populate('medicationId', 'name strength doseAmount doseUnit instructions')
      .lean();

    return missed;
  }

  /**
   * Get basic dose counts
   */
  async getDoseStatistics(patientId) {
    return this.calculateOverallAdherence(patientId);
  }
}

export default new AdherenceService();
