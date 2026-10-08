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
        message:
          'No prescription file uploaded. Please upload a clear image or PDF.',
      });
    }

    const filePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // ---------------------------------------------------------
    // Step 1: OCR
    // ---------------------------------------------------------

    let ocrText = '';

    try {
      ocrText = await ocrService.extractTextFromImage(
        filePath,
        req.file.originalname
      );
    } catch (ocrErr) {
      console.error('OCR Error:', ocrErr);

      return res.status(422).json({
        success: false,
        message:
          'Unable to read this prescription. Try uploading a clearer image.',
      });
    }

    // ---------------------------------------------------------
    // Step 2: Gemini AI extraction
    // ---------------------------------------------------------

    let extractedMedications = [];

    try {
      const extractionResult =
        await aiPrescriptionService.extractMedications(ocrText);

      extractedMedications =
        extractionResult.medications || [];
    } catch (aiErr) {
      console.error('AI Extraction Error:', aiErr);

      return res.status(422).json({
        success: false,
        message:
          "We couldn't reliably extract medication information. Please enter the details manually.",
      });
    }

    // ---------------------------------------------------------
    // Step 3: Save prescription
    // ---------------------------------------------------------

    const prescription = await Prescription.create({
      patientId: req.user._id,
      imageUrl,
      ocrText,
      extractionStatus: 'completed',
      extractedMedications,
      verified: false,
    });

    return res.status(201).json({
      success: true,
      message:
        'Prescription uploaded and analyzed successfully.',
      prescription,
    });
  } catch (error) {
    console.error('Upload Error:', error);

    return res.status(500).json({
      success: false,
      message:
        'Something went wrong during prescription upload. Please try again.',
    });
  }
};


// @desc    Get all prescriptions for logged in patient
// @route   GET /api/prescriptions
// @access  Private

export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions =
      await Prescription.find({
        patientId: req.user._id,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    console.error(
      'Get Prescriptions Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to retrieve prescriptions.',
    });
  }
};


// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private

export const getPrescriptionById = async (
  req,
  res
) => {
  try {
    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patientId: req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          'Prescription not found.',
      });
    }

    return res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error(
      'Get Prescription Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to retrieve prescription details.',
    });
  }
};


// @desc    Verify prescription and generate medication records + schedule
// @route   POST /api/prescriptions/:id/verify
// @access  Private

export const verifyPrescription = async (
  req,
  res
) => {
  try {
    // ---------------------------------------------------------
    // Find prescription
    // ---------------------------------------------------------

    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patientId: req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          'Prescription not found.',
      });
    }

    // ---------------------------------------------------------
    // Validate medications array
    // ---------------------------------------------------------

    const { medications } = req.body;

    if (
      !medications ||
      !Array.isArray(medications) ||
      medications.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide at least one medication to verify and confirm.',
      });
    }

    // ---------------------------------------------------------
    // Validate EVERY medication BEFORE creating anything
    // ---------------------------------------------------------

    for (
      let i = 0;
      i < medications.length;
      i++
    ) {
      const med = medications[i];

      const medicationNumber = i + 1;

      // Medicine name
      if (
        !med.name ||
        typeof med.name !== 'string' ||
        med.name.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please enter a valid medicine name for Medication #${medicationNumber}.`,
        });
      }

      // Strength
      if (
        !med.strength ||
        typeof med.strength !== 'string' ||
        med.strength.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please enter the medicine strength for Medication #${medicationNumber}.`,
        });
      }

      // Dose amount
      if (
        med.doseAmount === null ||
        med.doseAmount === undefined ||
        med.doseAmount === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please enter the dose amount for Medication #${medicationNumber}.`,
        });
      }

      const doseAmount = Number(
        med.doseAmount
      );

      if (
        !Number.isFinite(doseAmount) ||
        doseAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Dose amount for Medication #${medicationNumber} must be a valid positive number.`,
        });
      }

      // Dose unit
      if (
        !med.doseUnit ||
        typeof med.doseUnit !== 'string' ||
        med.doseUnit.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please select a dose unit for Medication #${medicationNumber}.`,
        });
      }

      // Frequency
      if (
        !med.frequency ||
        typeof med.frequency !== 'string' ||
        med.frequency.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please select a frequency for Medication #${medicationNumber}.`,
        });
      }

      // Duration
      if (
        med.durationValue === null ||
        med.durationValue === undefined ||
        med.durationValue === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please enter the duration for Medication #${medicationNumber}.`,
        });
      }

      const durationValue = Number(
        med.durationValue
      );

      if (
        !Number.isFinite(durationValue) ||
        durationValue <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Duration for Medication #${medicationNumber} must be a valid positive number.`,
        });
      }

      // Duration unit
      if (
        !med.durationUnit ||
        typeof med.durationUnit !== 'string' ||
        med.durationUnit.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Please select a duration unit for Medication #${medicationNumber}.`,
        });
      }
    }

    // ---------------------------------------------------------
    // Save verified prescription
    // ---------------------------------------------------------

    prescription.extractedMedications =
      medications;

    prescription.verified = true;

    await prescription.save();

    // ---------------------------------------------------------
    // Prepare ALL medication documents in memory
    // ---------------------------------------------------------

    const medicationDocuments =
      medications.map((med) => {
        // Start date
        const startDate = med.startDate
          ? new Date(med.startDate)
          : new Date();

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          throw new Error(
            `Invalid start date for medication "${med.name}".`
          );
        }

        // Convert duration to days
        let durationDays =
          Number(med.durationValue);

        const unit = String(
          med.durationUnit
        ).toLowerCase();

        if (unit.startsWith('week')) {
          durationDays *= 7;
        } else if (
          unit.startsWith('month')
        ) {
          durationDays *= 30;
        }

        // Safety limit
        durationDays = Math.min(
          Math.ceil(durationDays),
          90
        );

        // Calculate end date
        //
        // Keep the schedule and medication
        // duration aligned: a 5-day medication
        // has doses on day 0 through day 4.
        const endDate =
          new Date(startDate);

        endDate.setDate(
          startDate.getDate() +
            durationDays -
            1
        );

        return {
          patientId: req.user._id,

          prescriptionId:
            prescription._id,

          name: med.name.trim(),

          strength:
            med.strength.trim(),

          doseAmount:
            Number(med.doseAmount),

          doseUnit:
            med.doseUnit.trim(),

          frequency:
            med.frequency.trim(),

          durationValue:
            Number(med.durationValue),

          durationUnit:
            med.durationUnit.trim(),

          instructions:
            med.instructions
              ? med.instructions.trim()
              : '',

          startDate,

          endDate,

          verified: true,
        };
      });

    // ---------------------------------------------------------
    // Create ALL medications with ONE MongoDB operation
    // ---------------------------------------------------------

    console.log(
      `[Prescription] Creating ${medicationDocuments.length} medications...`
    );

    const createdMedications =
      await Medication.insertMany(
        medicationDocuments
      );

    console.log(
      `[Prescription] Created ${createdMedications.length} medications.`
    );

    // ---------------------------------------------------------
    // Generate ALL schedules with ONE bulk dose insert
    // ---------------------------------------------------------

    console.log(
      '[Prescription] Generating medication schedule...'
    );

    const createdDoses =
      await scheduleService.generateBulkMedicationSchedule(
        createdMedications
      );

    const totalDosesCreated =
      createdDoses.length;

    console.log(
      `[Prescription] Created ${totalDosesCreated} doses.`
    );

    // ---------------------------------------------------------
    // Success response
    // ---------------------------------------------------------

    return res.json({
      success: true,

      message:
        'Prescription verified and medication schedule generated successfully!',

      prescription,

      medications:
        createdMedications,

      totalDosesCreated,
    });
  } catch (error) {
    console.error(
      'Prescription Verification Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to verify prescription and create schedule.',
    });
  }
};


// @desc    Update draft prescription details
// @route   PUT /api/prescriptions/:id
// @access  Private

export const updatePrescription = async (
  req,
  res
) => {
  try {
    const prescription =
      await Prescription.findOne({
        _id: req.params.id,
        patientId: req.user._id,
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          'Prescription not found.',
      });
    }

    if (
      req.body.extractedMedications
    ) {
      prescription.extractedMedications =
        req.body.extractedMedications;
    }

    if (
      req.body.ocrText !== undefined
    ) {
      prescription.ocrText =
        req.body.ocrText;
    }

    await prescription.save();

    return res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error(
      'Update Prescription Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update prescription.',
    });
  }
};