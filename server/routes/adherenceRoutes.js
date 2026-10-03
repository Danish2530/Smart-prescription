import express from 'express';
import {
  getAdherenceSummary,
  getWeeklyAdherence,
  getMedicationAdherence,
} from '../controllers/adherenceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, getAdherenceSummary);
router.get('/weekly', protect, getWeeklyAdherence);
router.get('/by-medication', protect, getMedicationAdherence);

export default router;
