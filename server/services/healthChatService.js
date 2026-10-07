import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

/**
 * AI Health Assistant Service (PRESCRIPTO)
 *
 * Distinct and isolated from the prescription extraction pipeline.
 * Designed exclusively for patient educational inquiries, medication terminology,
 * scheduling explanations, and general wellness guidance.
 *
 * Strict Guardrails:
 * - Never diagnoses illnesses
 * - Never prescribes or alters medication dosages
 * - Instructs emergency cases to seek immediate emergency care
 * - Includes mandatory medical disclaimer
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
        console.warn('[HealthChatService] Unable to init GoogleGenAI:', err.message);
      }
    }
  }

  getSystemInstructions() {
    return `
You are PRESCRIPTO's AI Health Assistant — a friendly, accurate, and safety-conscious digital health companion.

YOUR PURPOSE:
- Help patients understand medical and prescription terminology (e.g., BID, TID, OD, PRN, AC, PC).
- Explain general medication instructions (e.g., "Take after meals", "Take on an empty stomach", hydration, proper storage).
- Explain general health concepts, wellness advice, and routine medication management.
- Help users understand their schedule concepts clearly.

STRICT MEDICAL & ETHICAL GUARDRAILS (ZERO TOLERANCE):
1. NEVER diagnose diseases or conditions. If a user describes symptoms, explain general potential causes neutrally and advise consulting a qualified physician.
2. NEVER prescribe drugs or recommend specific prescription medications.
3. NEVER instruct a user to change, stop, increase, or decrease their prescribed medication dosage.
4. If a user mentions emergency warning signs (severe chest pain, shortness of breath, stroke symptoms, uncontrolled bleeding, sudden confusion, severe allergic reaction), immediately advise them to contact emergency medical services (e.g., 911 / 108 / 112) or go to the nearest emergency room.
5. ALWAYS conclude with or include the standard disclaimer: "I am an AI assistant, not a doctor. Please consult your physician or pharmacist for medical advice."
`;
  }

  /**
   * Deterministic educational fallback when AI API is unavailable or rate-limited
   */
  getEducationalFallback(query) {
    const q = query.toLowerCase();

    if (/bid|twice a day|twice daily/i.test(q)) {
      return `**BID** stands for *"Bis in Die"* in Latin, meaning **twice a day**.\n\nUsually, this means taking the dose approximately 12 hours apart (e.g., 8:00 AM and 8:00 PM) to maintain steady levels of the medication in your body throughout the day.\n\n*Disclaimer: I am an AI assistant, not a doctor. Please follow your physician's specific instructions.*`;
    }

    if (/tid|three times a day|3 times daily|three times daily/i.test(q)) {
      return `**TID** stands for *"Ter in Die"* in Latin, meaning **three times a day**.\n\nGenerally, doses are spaced roughly 8 hours apart (e.g., morning around 8:00 AM, afternoon around 2:00 PM, and night around 8:00 PM) or taken with breakfast, lunch, and dinner if directed with meals.\n\n*Disclaimer: I am an AI assistant, not a doctor. Please confirm exact timing with your doctor or pharmacist.*`;
    }

    if (/od|once a day|once daily/i.test(q)) {
      return `**OD** stands for *"Omne in Die"* in Latin, meaning **once daily**.\n\nIt is best taken at the same consistent hour every day (e.g., every morning with breakfast or every evening at bedtime) for optimum consistency.\n\n*Disclaimer: I am an AI assistant, not a doctor. Always consult your healthcare provider.*`;
    }

    if (/qid|four times a day|4 times daily/i.test(q)) {
      return `**QID** stands for *"Quater in Die"*, meaning **four times a day**.\n\nThese doses are typically spaced approximately 4 to 6 hours apart during waking hours (e.g., 8 AM, 12 PM, 4 PM, 8 PM).\n\n*Disclaimer: I am an AI assistant, not a doctor. Consult your physician for exact schedules.*`;
    }

    if (/prn|sos|as needed|when required/i.test(q)) {
      return `**PRN** stands for *"Pro Re Nata"* (or **SOS** *"Si Opus Sit"*), which means **take as needed or when required**.\n\nThese medicines (such as pain relievers or anti-nausea meds) are not on a rigid schedule, but have strict maximum daily limits and minimum gap times between doses specified by your doctor.\n\n*Disclaimer: I am an AI assistant, not a doctor. Never exceed your doctor's prescribed maximum daily limit.*`;
    }

    if (/before meal|empty stomach|ac\b/i.test(q)) {
      return `**Before Meals (AC - Ante Cibum / Empty Stomach)**:\n\nTaking medication on an empty stomach typically means taking it **at least 30 to 60 minutes before eating**, or **2 hours after a meal**.\n\nThis ensures stomach acid or food components do not degrade the medicine or impede absorption.\n\n*Disclaimer: I am an AI assistant, not a doctor. Always check your medicine label.*`;
    }

    if (/after meal|with food|pc\b/i.test(q)) {
      return `**After Meals (PC - Post Cibum / With Food)**:\n\nTaking medication after meals means taking it **immediately after or within 15–30 minutes of eating a meal or snack**.\n\nThis helps minimize stomach irritation and can improve absorption for certain medications.\n\n*Disclaimer: I am an AI assistant, not a doctor. Consult your healthcare provider for personalized guidance.*`;
    }

    if (/chest pain|heart attack|stroke|difficulty breathing|shortness of breath|severe bleeding/i.test(q)) {
      return `⚠️ **EMERGENCY WARNING**\n\nThe symptoms you mentioned may indicate a critical medical emergency. Please seek immediate medical attention by calling emergency services (such as 911 / 108 / 112) or visiting the nearest hospital emergency room immediately.\n\n*Do not wait or rely on online health tools during emergencies.*`;
    }

    return `Hello! As your PRESCRIPTO AI Health Assistant, I can help you understand medical abbreviations (like BID, TID, OD, PRN), medication administration tips (before/after meals, hydration), and general wellness concepts.\n\nFor questions about specific medical diagnoses, treatments, or dosage adjustments, please book a consultation with one of our certified doctors on PRESCRIPTO.\n\n*Disclaimer: I am an AI assistant, not a doctor. Please consult your physician for medical advice.*`;
  }

  /**
   * Process patient health message and generate safe, educational response
   */
  async processHealthQuery(message, conversationHistory = []) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Please provide a question or message.');
    }

    const trimmedMsg = message.trim();

    // Check for obvious emergency keywords first
    if (/severe chest pain|cannot breathe|difficulty breathing|stroke symptoms|face drooping/i.test(trimmedMsg)) {
      return {
        reply: `⚠️ **EMERGENCY WARNING**:\n\nThe symptoms you mentioned may indicate an acute medical emergency. Please call emergency services (such as 911, 112, or 108) or go to the nearest emergency department immediately.\n\n*Disclaimer: I am an AI assistant, not a doctor.*`,
        isEmergency: true,
      };
    }

    if (this.ai) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${this.getSystemInstructions()}\n\nPatient question: ${trimmedMsg}` }],
          },
        ];

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            temperature: 0.3,
          },
        });

        const reply = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          return {
            reply: reply.trim(),
            isEmergency: false,
          };
        }
      } catch (err) {
        console.warn('[HealthChatService] Gemini call encountered error:', err.message);
      }
    }

    // Graceful fallback to deterministic medical knowledge base
    return {
      reply: this.getEducationalFallback(trimmedMsg),
      isEmergency: false,
    };
  }
}

export default new HealthChatService();
