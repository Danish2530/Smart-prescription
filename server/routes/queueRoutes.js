import express from 'express';
import {
  getDoctorQueue,
  getPatientQueue,
  callNextPatient,
  startConsultation,
  completeConsultation,
  markPatientAbsent,
} from '../controllers/queueController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/doctor/:doctorId', getDoctorQueue);
router.get('/position/:appointmentId', protect, getPatientQueue);
router.post('/doctor/call-next', protect, authorize('doctor', 'admin'), callNextPatient);
router.post('/:appointmentId/start', protect, authorize('doctor', 'admin'), startConsultation);
router.post('/:appointmentId/complete', protect, authorize('doctor', 'admin'), completeConsultation);
router.post('/:appointmentId/absent', protect, authorize('doctor', 'admin'), markPatientAbsent);

export default router;
