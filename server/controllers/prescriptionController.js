import path from 'path';
import Prescription from '../models/Prescription.js';
import Medication from '../models/Medication.js';
import ocrService from '../services/ocrService.js';
import aiPrescriptionService from '../services/aiPrescriptionService.js';
import scheduleService from '../services/scheduleService.js';

// @desc    Upload prescription image & trigger OCR + AI extraction
// @route   POST /api/prescriptions/upload
// @access  Private
export const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No prescription file uploaded. Please upload a clear image or PDF.',
      });
    }

    const filePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Step 1: Perform OCR extraction
    let ocrText = '';
    try {
      ocrText = await ocrService.extractTextFromImage(filePath, req.file.originalname);
    } catch (ocrErr) {
      console.error('OCR Error:', ocrErr);
      return res.status(422).json({
        success: false,
        message: 'Unable to read this prescription. Try uploading a clearer image.',
      });
    }

    // Step 2: Perform AI structured clinical extraction
    let extractedMedications = [];
    try {
      const extractionResult = await aiPrescriptionService.extractMedications(ocrText);
      extractedMedications = extractionResult.medications || [];
    } catch (aiErr) {
      console.error('AI Extraction Error:', aiErr);
      return res.status(422).json({
        success: false,
        message: "We couldn't reliably extract medication information. Please enter the details manually.",
      });
    }

    // Step 3: Save Prescription record
    const prescription = await Prescription.create({
      patientId: req.user._id,
      imageUrl,
      ocrText,
      extractionStatus: 'completed',
      extractedMedications,
      verified: false,
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded and analyzed successfully.',
      prescription,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during prescription upload. Please try again.',
    });
  }
};

// @desc    Get all prescriptions for logged in patient
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptions.',
    });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found.',
      });
    }

    res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescription details.',
    });
  }
};

// @desc    Verify prescription and automatically generate medication records + schedule doses
// @route   POST /api/prescriptions/:id/verify
// @access  Private
export const verifyPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found.',
      });
    }

    const { medications } = req.body;
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one medication to verify and confirm.',
      });
    }

    // Save updated extractedMedications and mark prescription as verified
    prescription.extractedMedications = medications;
    prescription.verified = true;
    await prescription.save();

    const createdMedications = [];
    let totalDosesCreated = 0;

    for (const med of medications) {
      const startDate = med.startDate ? new Date(med.startDate) : new Date();
      let durationDays = med.durationValue || 5;
      const unit = (med.durationUnit || 'days').toLowerCase();
      if (unit.startsWith('week')) durationDays *= 7;
      if (unit.startsWith('month')) durationDays *= 30;

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      const newMed = await Medication.create({
        patientId: req.user._id,
        prescriptionId: prescription._id,
        name: med.name || 'Prescribed Medication',
        strength: med.strength || '',
        doseAmount: Number(med.doseAmount) || 1,
        doseUnit: med.doseUnit || 'tablet',
        frequency: med.frequency || 'once daily',
        durationValue: Number(med.durationValue) || 5,
        durationUnit: med.durationUnit || 'days',
        instructions: med.instructions || '',
        startDate,
        endDate,
        verified: true,
      });

      createdMedications.push(newMed);

      // Generate active dose schedules automatically
      const doses = await scheduleService.generateMedicationSchedule(newMed);
      totalDosesCreated += doses.length;
    }

    res.json({
      success: true,
      message: 'Prescription verified and medication schedule generated successfully!',
      prescription,
      medications: createdMedications,
      totalDosesCreated,
    });
  } catch (error) {
    console.error('Prescription Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify prescription and create schedule.',
    });
  }
};

// @desc    Update draft prescription details
// @route   PUT /api/prescriptions/:id
// @access  Private
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found.',
      });
    }

    if (req.body.extractedMedications) {
      prescription.extractedMedications = req.body.extractedMedications;
    }
    if (req.body.ocrText !== undefined) {
      prescription.ocrText = req.body.ocrText;
    }

    await prescription.save();

    res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription.',
    });
  }
};
