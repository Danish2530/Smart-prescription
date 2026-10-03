import express from 'express';
import {
  getMedications,
  getMedicationById,
  updateMedication,
} from '../controllers/medicationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMedications);
router.get('/:id', protect, getMedicationById);
router.put('/:id', protect, updateMedication);

export default router;
