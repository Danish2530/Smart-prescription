import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

/**
 * PRESCRIPTO AI Health Assistant
 *
 * Fast architecture:
 * 1. Emergency detection
 * 2. Instant deterministic answers for common questions
 * 3. Gemini only for questions that actually need AI
 * 4. Fast fallback if Gemini is unavailable
 */
class HealthChatService {
  constructor() {
    this.ai = null;

    if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.AI_API_KEY,
        });
      } catch (err) {
        console.warn(
          '[HealthChatService] Unable to init GoogleGenAI:',
          err.message
        );
      }
    }
  }

  /**
   * System instructions for Gemini.
   *
   * Kept separate from the user message so Gemini receives
   * the instructions through the proper systemInstruction field.
   */
  getSystemInstructions() {
    return `
You are PRESCRIPTO's AI Health Assistant.

Your job is to provide concise, educational health and medication information.

STRICT SAFETY RULES:
1. Never diagnose diseases.
2. Never prescribe medicines.
3. Never tell users to change, stop, increase, or decrease medication doses.
4. For emergency symptoms such as severe chest pain, difficulty breathing,
   stroke symptoms, uncontrolled bleeding, sudden confusion, or severe
   allergic reactions, tell the user to seek emergency medical care immediately.
5. Do not replace a doctor or pharmacist.
6. Keep responses concise and practical.
7. Always include:
"I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice."
`;
  }

  /**
   * Fast emergency detection.
   *
   * This happens BEFORE Gemini.
   */
  isEmergencyQuery(query) {
  return /severe chest pain|crushing chest pain|cannot breathe|can't breathe|difficulty breathing|severe shortness of breath|stroke symptoms|face drooping|sudden weakness|sudden confusion|uncontrolled bleeding|severe bleeding|unconscious|passed out|severe allergic reaction|anaphylaxis/i.test(
    query
  );
}

  /**
   * Instant responses for common medication terminology.
   *
   * These responses never call Gemini.
   */
  getFastAnswer(query) {
    const q = query.toLowerCase().trim();

    if (
      /\bbid\b/.test(q) ||
      /twice a day/.test(q) ||
      /twice daily/.test(q)
    ) {
      return `**BID** stands for *"Bis in Die"*, meaning **twice a day**.

It generally means taking the medication two times during the day, with the exact timing depending on your prescription.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /\btid\b/.test(q) ||
      /three times a day/.test(q) ||
      /three times daily/.test(q)
    ) {
      return `**TID** stands for *"Ter in Die"*, meaning **three times a day**.

It generally means taking the medication three times during the day. Follow the timing specified by your doctor or pharmacist.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /\bod\b/.test(q) ||
      /once a day/.test(q) ||
      /once daily/.test(q)
    ) {
      return `**OD** generally means **once daily**.

This means the medication is taken once each day. Follow the exact timing provided on your prescription.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /\bqid\b/.test(q) ||
      /four times a day/.test(q) ||
      /four times daily/.test(q)
    ) {
      return `**QID** means **four times a day**.

The exact timing should follow the instructions provided by your doctor or pharmacist.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /\bprn\b/.test(q) ||
      /\bsos\b/.test(q) ||
      /as needed/.test(q) ||
      /when required/.test(q)
    ) {
      return `**PRN** means **"as needed"** or **"when required"**.

It means the medication is not necessarily taken at a fixed time. You should still follow the maximum dose and minimum interval specified by your doctor or medication label.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /before meals/.test(q) ||
      /before meal/.test(q) ||
      /empty stomach/.test(q) ||
      /\bac\b/.test(q)
    ) {
      return `**Before meals / AC** generally means taking the medication before eating.

The exact timing depends on the medication, so follow the instructions on your prescription or medication label.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    if (
      /after meals/.test(q) ||
      /after meal/.test(q) ||
      /with food/.test(q) ||
      /\bpc\b/.test(q)
    ) {
      return `**After meals / PC** generally means taking the medication after eating.

Follow the specific timing provided by your doctor or pharmacist.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
    }

    return null;
  }

  /**
   * Emergency response.
   */
  getEmergencyResponse() {
    return `⚠️ **EMERGENCY WARNING**

The symptoms you mentioned may indicate a medical emergency.

Please call emergency services (such as **112 / 108**) or go to the nearest emergency department immediately.

Do not wait for an online health assistant during an emergency.

*Disclaimer: I am an AI assistant, not a doctor.*`;
  }

  /**
   * Generic fallback if Gemini is unavailable.
   */
  getEducationalFallback(query) {
    return `I can help with general medication terminology, prescription instructions, and basic health education.

For questions involving a diagnosis, treatment decision, or medication change, please consult a qualified doctor or pharmacist.

*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice.*`;
  }

  /**
   * Ask Gemini for questions that require actual AI reasoning.
   */
  async askGemini(message) {
    if (!this.ai) {
      return null;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: [
          {
            role: 'user',
            parts: [
              {
                text: message,
              },
            ],
          },
        ],

        config: {
          systemInstruction: this.getSystemInstructions(),

          temperature: 0.2,

          // Keep responses short and therefore faster.
          maxOutputTokens: 500,
        },
      });

      const reply =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply && reply.trim()) {
        return reply.trim();
      }

      return null;
    } catch (error) {
      console.warn(
        '[HealthChatService] Gemini error:',
        error.message
      );

      return null;
    }
  }

  /**
   * Main health query processor.
   */
  async processHealthQuery(message, conversationHistory = []) {
    if (
      !message ||
      typeof message !== 'string' ||
      !message.trim()
    ) {
      throw new Error('Please provide a question or message.');
    }

    const trimmedMsg = message.trim();

    /*
     * STEP 1
     * Emergency check.
     *
     * Never send obvious emergencies to Gemini first.
     */
    if (this.isEmergencyQuery(trimmedMsg)) {
      return {
        reply: this.getEmergencyResponse(),
        isEmergency: true,
      };
    }

    /*
     * STEP 2
     * Instant knowledge base.
     *
     * This is the biggest speed improvement.
     */
    const fastAnswer = this.getFastAnswer(trimmedMsg);

    if (fastAnswer) {
      return {
        reply: fastAnswer,
        isEmergency: false,
      };
    }

    /*
     * STEP 3
     * Gemini for more complex questions.
     */
    if (this.ai) {
      const aiReply = await this.askGemini(trimmedMsg);

      if (aiReply) {
        return {
          reply: aiReply,
          isEmergency: false,
        };
      }
    }

    /*
     * STEP 4
     * Safe fallback.
     */
    return {
      reply: this.getEducationalFallback(trimmedMsg),
      isEmergency: false,
    };
  }
}

export default new HealthChatService();