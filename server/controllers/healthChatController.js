import healthChatService from '../services/healthChatService.js';

// @desc    Ask the AI Health Assistant
// @route   POST /api/health-chat
// @access  Private
export const askHealthAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a health-related question.',
      });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          'Your question is too long. Please keep it under 2000 characters.',
      });
    }

    const result = await healthChatService.processHealthQuery(
      trimmedMessage
    );

    return res.status(200).json({
      success: true,
      reply: result.reply,
      isEmergency: result.isEmergency || false,
    });
  } catch (error) {
    console.error('[HealthChatController] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to process your health question right now.',
    });
  }
};