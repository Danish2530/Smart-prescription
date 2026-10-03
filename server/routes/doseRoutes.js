import express from 'express';
import {
  getTodayDoses,
  getDoseHistory,
  markDoseTaken,
  markDoseMissed,
  snoozeDose,
} from '../controllers/doseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/today', protect, getTodayDoses);
router.get('/history', protect, getDoseHistory);
router.post('/:id/taken', protect, markDoseTaken);
router.post('/:id/missed', protect, markDoseMissed);
router.post('/:id/snooze', protect, snoozeDose);

export default router;
