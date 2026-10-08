import express from 'express';
import { askHealthAssistant } from '../controllers/healthChatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, askHealthAssistant);

export default router;