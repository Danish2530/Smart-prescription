import express from 'express';
import { askHealthAssistant } from '../controllers/healthChatController.js';

const router = express.Router();

router.post('/', askHealthAssistant);

export default router;
