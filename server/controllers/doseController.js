import Dose from '../models/Dose.js';
import Medication from '../models/Medication.js';

// @desc    Get today's scheduled doses for patient
// @route   GET /api/doses/today
// @access  Private
export const getTodayDoses = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const doses = await Dose.find({
      patientId: req.user._id,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('medicationId', 'name strength doseAmount doseUnit frequency instructions')
      .sort({ scheduledTime: 1 });

    // Format dose records with clean helper attributes
    const formatted = doses.map((d) => {
      const obj = d.toObject();
      return {
        ...obj,
        medicationName: obj.medicationId?.name || 'Medication',
        strength: obj.medicationId?.strength || '',
        doseAmount: obj.medicationId?.doseAmount || 1,
        doseUnit: obj.medicationId?.doseUnit || 'tablet',
        instructions: obj.medicationId?.instructions || '',
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      doses: formatted,
    });
  } catch (error) {
    console.error('Error fetching today doses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve today doses.',
    });
  }
};

// @desc    Get dose history with optional filters (today, week, month, all)
// @route   GET /api/doses/history
// @access  Private
export const getDoseHistory = async (req, res) => {
  try {
    const { filter } = req.query; // 'today', 'week', 'month', 'all'
    const query = { patientId: req.user._id };

    const now = new Date();
    if (filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      query.scheduledDate = { $gte: startOfDay };
    } else if (filter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      query.scheduledDate = { $gte: startOfWeek };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now);
      startOfMonth.setDate(now.getDate() - 30);
      startOfMonth.setHours(0, 0, 0, 0);
      query.scheduledDate = { $gte: startOfMonth };
    }

    const doses = await Dose.find(query)
      .populate('medicationId', 'name strength doseAmount doseUnit instructions')
      .sort({ scheduledDate: -1, scheduledTime: -1 });

    res.json({
      success: true,
      count: doses.length,
      doses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dose history.',
    });
  }
};

// @desc    Mark a dose as taken
// @route   POST /api/doses/:id/taken
// @access  Private
export const markDoseTaken = async (req, res) => {
  try {
    const dose = await Dose.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    }).populate('medicationId', 'name strength doseAmount doseUnit');

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled dose not found.',
      });
    }

    dose.status = 'taken';
    dose.takenAt = new Date();
    await dose.save();

    res.json({
      success: true,
      message: `Dose of ${dose.medicationId?.name || 'Medication'} marked as taken.`,
      dose,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark dose as taken.',
    });
  }
};

// @desc    Mark a dose as missed
// @route   POST /api/doses/:id/missed
// @access  Private
export const markDoseMissed = async (req, res) => {
  try {
    const dose = await Dose.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    }).populate('medicationId', 'name strength doseAmount doseUnit');

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled dose not found.',
      });
    }

    dose.status = 'missed';
    dose.takenAt = null;
    await dose.save();

    res.json({
      success: true,
      message: `Dose of ${dose.medicationId?.name || 'Medication'} marked as missed.`,
      dose,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark dose as missed.',
    });
  }
};

// @desc    Snooze a dose reminder
// @route   POST /api/doses/:id/snooze
// @access  Private
export const snoozeDose = async (req, res) => {
  try {
    const dose = await Dose.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled dose not found.',
      });
    }

    // Keep status as pending, client reminder timer handles snooze interval
    res.json({
      success: true,
      message: 'Dose reminder snoozed for 15 minutes.',
      dose,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to snooze dose.',
    });
  }
};
