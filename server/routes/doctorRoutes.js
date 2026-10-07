import express from 'express';
import {
  getDoctors,
  getSpecializations,
  getDoctorById,
  getDoctorSlots,
  getMyDoctorProfile,
  updateDoctorStatus,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public doctor discovery routes
router.get('/', getDoctors);
router.get('/specializations', getSpecializations);
router.get('/me', protect, authorize('doctor', 'admin'), getMyDoctorProfile);
router.patch('/status', protect, authorize('doctor'), updateDoctorStatus);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

export default router;
