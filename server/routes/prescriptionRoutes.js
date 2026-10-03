import express from 'express';
import {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionById,
  verifyPrescription,
  updatePrescription,
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', protect, upload.single('prescription'), uploadPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.post('/:id/verify', protect, verifyPrescription);
router.put('/:id', protect, updatePrescription);

export default router;
