import express from 'express';
import {
  getVideoMeeting,
  createVideoMeeting,
  endVideoMeeting,
} from '../controllers/videoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:appointmentId', protect, getVideoMeeting);
router.post('/create', protect, createVideoMeeting);
router.post('/end', protect, endVideoMeeting);

export default router;
