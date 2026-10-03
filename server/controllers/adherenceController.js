import adherenceService from '../services/adherenceService.js';

// @desc    Get overall adherence summary and stats
// @route   GET /api/adherence/summary
// @access  Private
export const getAdherenceSummary = async (req, res) => {
  try {
    const summary = await adherenceService.calculateOverallAdherence(req.user._id);
    const missedRecent = await adherenceService.getMissedDoses(req.user._id, 5);

    res.json({
      success: true,
      summary,
      recentMissed: missedRecent,
    });
  } catch (error) {
    console.error('Adherence Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate adherence summary.',
    });
  }
};

// @desc    Get 7-day adherence trend for chart
// @route   GET /api/adherence/weekly
// @access  Private
export const getWeeklyAdherence = async (req, res) => {
  try {
    const weekly = await adherenceService.calculateWeeklyAdherence(req.user._id);
    res.json({
      success: true,
      weekly,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve weekly adherence.',
    });
  }
};

// @desc    Get medication-wise adherence breakdown
// @route   GET /api/adherence/by-medication
// @access  Private
export const getMedicationAdherence = async (req, res) => {
  try {
    const medicationAdherence = await adherenceService.calculateMedicationAdherence(req.user._id);
    res.json({
      success: true,
      medications: medicationAdherence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medication adherence.',
    });
  }
};
