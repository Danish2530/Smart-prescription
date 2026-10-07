import healthChatService from '../services/healthChatService.js';

// @desc    Process patient query with AI Health Assistant
// @route   POST /api/health-chat
// @access  Public or Private (can be used by all users)
export const askHealthAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message query is required.',
      });
    }

    const result = await healthChatService.processHealthQuery(message, history || []);

    res.json({
      success: true,
      reply: result.reply,
      isEmergency: result.isEmergency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process health inquiry at this moment.',
    });
  }
};
