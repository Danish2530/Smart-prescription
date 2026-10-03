import Medication from '../models/Medication.js';
import medicationInfoService from '../services/medicationInfoService.js';

// @desc    Get all verified medications for logged-in patient
// @route   GET /api/medications
// @access  Private
export const getMedications = async (req, res) => {
  try {
    const medications = await Medication.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('prescriptionId', 'imageUrl verified createdAt');

    res.json({
      success: true,
      count: medications.length,
      medications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medications.',
    });
  }
};

// @desc    Get single medication with trusted reference information
// @route   GET /api/medications/:id
// @access  Private
export const getMedicationById = async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    }).populate('prescriptionId', 'imageUrl verified createdAt');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found.',
      });
    }

    // Retrieve trusted general medication reference information
    const referenceInfo = medicationInfoService.getMedicationInfo(medication.name);

    res.json({
      success: true,
      medication,
      referenceInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medication details.',
    });
  }
};

// @desc    Update medication details
// @route   PUT /api/medications/:id
// @access  Private
export const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found.',
      });
    }

    const { instructions, frequency, strength, doseAmount, doseUnit } = req.body;
    if (instructions !== undefined) medication.instructions = instructions;
    if (frequency !== undefined) medication.frequency = frequency;
    if (strength !== undefined) medication.strength = strength;
    if (doseAmount !== undefined) medication.doseAmount = doseAmount;
    if (doseUnit !== undefined) medication.doseUnit = doseUnit;

    await medication.save();

    res.json({
      success: true,
      medication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update medication.',
    });
  }
};
