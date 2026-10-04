import 'dotenv/config';

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY,
});

/*
|--------------------------------------------------------------------------
| Gemini Structured Output Schema
|--------------------------------------------------------------------------
*/

const prescriptionSchema = {
  type: 'object',
  properties: {
    medications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: ['string', 'null'],
          },

          strength: {
            type: ['string', 'null'],
          },

          doseAmount: {
            type: ['number', 'null'],
          },

          doseUnit: {
            type: ['string', 'null'],
          },

          frequency: {
            type: ['string', 'null'],
          },

          durationValue: {
            type: ['number', 'null'],
          },

          durationUnit: {
            type: ['string', 'null'],
          },

          instructions: {
            type: ['string', 'null'],
          },

          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },

          needsVerification: {
            type: 'boolean',
          },
        },

        required: [
          'name',
          'strength',
          'doseAmount',
          'doseUnit',
          'frequency',
          'durationValue',
          'durationUnit',
          'instructions',
          'confidence',
          'needsVerification',
        ],
      },
    },
  },

  required: ['medications'],
};

/*
|--------------------------------------------------------------------------
| AI Prescription Service
|--------------------------------------------------------------------------
*/

class AIPrescriptionService {
  /*
  |--------------------------------------------------------------------------
  | Main extraction method
  |--------------------------------------------------------------------------
  */

  async extractMedications(ocrText) {
    if (
      !ocrText ||
      typeof ocrText !== 'string' ||
      ocrText.trim() === ''
    ) {
      return {
        medications: [],
      };
    }

    const aiApiKey = process.env.AI_API_KEY;

    /*
    |--------------------------------------------------------------------------
    | Try Gemini first
    |--------------------------------------------------------------------------
    */

    if (aiApiKey && aiApiKey.trim() !== '') {
      try {
        const externalResult = await this.callExternalLLM(
          ocrText,
          aiApiKey
        );

        if (externalResult) {
          return externalResult;
        }
      } catch (error) {
        console.error(
          '[AIPrescriptionService] Gemini failed:',
          error?.message || error
        );

        console.warn(
          '[AIPrescriptionService] Falling back to local parser.'
        );
      }
    } else {
      console.warn(
        '[AIPrescriptionService] AI_API_KEY is missing.'
      );

      console.warn(
        '[AIPrescriptionService] Falling back to local parser.'
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Local fallback
    |--------------------------------------------------------------------------
    */

    return this.parsePrescriptionText(ocrText);
  }

  /*
  |--------------------------------------------------------------------------
  | Gemini API
  |--------------------------------------------------------------------------
  */

  async callExternalLLM(ocrText, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Gemini API key is missing.');
    }

    /*
    |--------------------------------------------------------------------------
    | Safety-focused extraction prompt
    |--------------------------------------------------------------------------
    */

    const prompt = `
You are a prescription information extraction system.

Your ONLY task is to extract medication information that is explicitly
present in the OCR text.

This is NOT a diagnosis task.
This is NOT a treatment recommendation task.
This is NOT a medication scheduling task.

STRICT SAFETY RULES:

1. Never invent a medication.
2. Never invent a medication strength.
3. Never invent a dose.
4. Never invent a frequency.
5. Never invent a duration.
6. Never infer missing information.
7. If information is missing, return null.
8. Extract only information explicitly supported by the OCR text.
9. Preserve the doctor's written instructions.
10. Do not recommend alternative medicines.
11. Do not change or reinterpret the prescription.
12. Do not calculate a dose.
13. Do not create a medication schedule.
14. Do not diagnose the patient.
15. Do not recommend treatment.
16. PRN, SOS, "as needed", "when required", and similar instructions
    must remain flexible/as-needed.
17. If OCR text is ambiguous, use low confidence.
18. If any critical medication field is uncertain or missing,
    set needsVerification to true.
19. Do not assume that a medication is a tablet or capsule unless
    that information is explicitly present.
20. Do not assume doseAmount is 1 unless the prescription explicitly
    states it.
21. Do not convert or calculate frequencies.
22. Do not add information from your general medical knowledge.

Return ONLY JSON matching the provided schema.

OCR TEXT:
--------------------
${ocrText}
--------------------
`;

    /*
    |--------------------------------------------------------------------------
    | Retry temporary Gemini failures
    |--------------------------------------------------------------------------
    */

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `[Gemini] Attempt ${attempt}/${maxAttempts}`
        );

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',

          contents: prompt,

          config: {
            temperature: 0,

            responseMimeType: 'application/json',

            responseSchema: prescriptionSchema,
          },
        });

        /*
        |--------------------------------------------------------------------------
        | Read Gemini response
        |--------------------------------------------------------------------------
        */

        const rawText = response?.text;

        if (!rawText) {
          throw new Error(
            'Gemini returned an empty response.'
          );
        }

        let parsed;

        try {
          parsed = JSON.parse(rawText);
        } catch (error) {
          console.error(
            '[Gemini Raw Response]',
            rawText
          );

          throw new Error(
            'Gemini returned invalid JSON.'
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate overall response
        |--------------------------------------------------------------------------
        */

        if (
          !parsed ||
          !Array.isArray(parsed.medications)
        ) {
          throw new Error(
            'Gemini returned an invalid medication structure.'
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate each medication
        |--------------------------------------------------------------------------
        */

        const medications = parsed.medications.map(
          (medication) =>
            this.validateMedication(medication)
        );

        console.log(
          `[Gemini] Successfully extracted ${medications.length} medication(s).`
        );

        return {
          medications,
        };
      } catch (error) {
        const errorMessage =
          error?.message || String(error);

        console.warn(
          `[Gemini] Attempt ${attempt} failed:`,
          errorMessage
        );

        /*
        |--------------------------------------------------------------------------
        | Retry only temporary errors
        |--------------------------------------------------------------------------
        */

        const retryable =
          errorMessage.includes('503') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.includes('429') ||
          errorMessage.includes('RESOURCE_EXHAUSTED');

        /*
        |--------------------------------------------------------------------------
        | Stop immediately for non-retryable errors
        |--------------------------------------------------------------------------
        */

        if (
          !retryable ||
          attempt === maxAttempts
        ) {
          throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Exponential backoff
        |
        | Attempt 1 -> wait 2 seconds
        | Attempt 2 -> wait 4 seconds
        |--------------------------------------------------------------------------
        */

        const delay = 2000 * attempt;

        console.log(
          `[Gemini] Retrying in ${delay / 1000}s...`
        );

        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }

    throw new Error(
      'Gemini extraction failed after all retry attempts.'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Validate AI-generated medication
  |--------------------------------------------------------------------------
  */

  validateMedication(medication) {
    /*
    |--------------------------------------------------------------------------
    | Protect against invalid AI output
    |--------------------------------------------------------------------------
    */

    if (
      !medication ||
      typeof medication !== 'object'
    ) {
      return {
        name: null,
        strength: null,
        doseAmount: null,
        doseUnit: null,
        frequency: null,
        durationValue: null,
        durationUnit: null,
        instructions: null,
        confidence: 'low',
        needsVerification: true,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Critical fields
    |--------------------------------------------------------------------------
    */

    const criticalFields = [
      'name',
      'strength',
      'doseAmount',
      'doseUnit',
      'frequency',
      'durationValue',
      'durationUnit',
    ];

    const missingCriticalField =
      criticalFields.some(
        (field) =>
          medication[field] === null ||
          medication[field] === undefined ||
          medication[field] === ''
      );

    /*
    |--------------------------------------------------------------------------
    | Missing information requires verification
    |--------------------------------------------------------------------------
    */

    if (missingCriticalField) {
      medication.confidence = 'low';
      medication.needsVerification = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Medication name is especially important
    |--------------------------------------------------------------------------
    */

    if (!medication.name) {
      medication.confidence = 'low';
      medication.needsVerification = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure valid confidence
    |--------------------------------------------------------------------------
    */

    if (
      !['high', 'medium', 'low'].includes(
        medication.confidence
      )
    ) {
      medication.confidence = 'low';
      medication.needsVerification = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure needsVerification is always boolean
    |--------------------------------------------------------------------------
    */

    medication.needsVerification =
      medication.needsVerification === true;

    /*
    |--------------------------------------------------------------------------
    | Safety override
    |--------------------------------------------------------------------------
    */

    if (missingCriticalField) {
      medication.needsVerification = true;
    }

    return medication;
  }

  /*
  |--------------------------------------------------------------------------
  | Local fallback parser
  |--------------------------------------------------------------------------
  |
  | This parser is intentionally conservative.
  | It should NEVER invent missing prescription information.
  |
  |--------------------------------------------------------------------------
  */

  parsePrescriptionText(text) {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const medications = [];

    /*
    |--------------------------------------------------------------------------
    | Medication pattern
    |
    | Examples:
    |
    | Amoxicillin 500 mg
    | Pantoprazole 40 mg
    | 1. Amoxicillin 500 mg
    |--------------------------------------------------------------------------
    */

    const medRegex =
      /(?:^\d+[.)]\s*)?([A-Za-z0-9\s-]+?)\s+(\d+\s*(?:mg|mcg|g|ml|IU|%))(?:\s+(.*))?$/i;

    let currentMed = null;

    /*
    |--------------------------------------------------------------------------
    | Process OCR lines
    |--------------------------------------------------------------------------
    */

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      /*
      |--------------------------------------------------------------------------
      | Ignore common prescription metadata
      |--------------------------------------------------------------------------
      */

      if (
        /^(APOLLO|HOSPITAL|CLINIC|DR\.|REG|DATE|PATIENT|AGE|GENDER|SIGNATURE|NOTE)/i.test(
          line
        ) ||
        /^Rx:?$/i.test(line)
      ) {
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Detect medication line
      |--------------------------------------------------------------------------
      */

      const medMatch = line.match(medRegex);

      if (
        medMatch &&
        !/^(take|for|duration|instructions|signature|doctor)/i.test(
          line
        )
      ) {
        /*
        |--------------------------------------------------------------------------
        | Save previous medication
        |--------------------------------------------------------------------------
        */

        if (currentMed) {
          medications.push(
            this.finalizeMedication(currentMed)
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Start new medication
        |
        | IMPORTANT:
        | Do not invent dose, frequency, duration, etc.
        |--------------------------------------------------------------------------
        */

        currentMed = {
          name: medMatch[1].trim(),

          strength: medMatch[2].trim(),

          doseAmount: null,

          doseUnit: null,

          frequency: null,

          durationValue: null,

          durationUnit: null,

          instructions: null,

          confidence: 'low',

          needsVerification: true,
        };

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Process lines belonging to current medication
      |--------------------------------------------------------------------------
      */

      if (currentMed) {
        /*
        |--------------------------------------------------------------------------
        | Dose
        |
        | Examples:
        | Take 1 tablet
        | Take 2 capsules
        | Take 5 ml
        |--------------------------------------------------------------------------
        */

        const doseMatch = line.match(
          /take\s+(\d+(?:\.\d+)?)\s*(tablet|tablets|capsule|capsules|drop|drops|puff|puffs|spoon|spoons|ml|mg)?/i
        );

        if (doseMatch) {
          currentMed.doseAmount = Number(
            doseMatch[1]
          );

          currentMed.doseUnit =
            doseMatch[2]
              ? doseMatch[2].toLowerCase()
              : null;
        }

        /*
        |--------------------------------------------------------------------------
        | PRN / SOS / As Needed
        |--------------------------------------------------------------------------
        */

        if (
          /as needed|prn|sos|flexible|when required/i.test(
            line
          )
        ) {
          currentMed.frequency =
            'Flexible / As Needed';

          currentMed.confidence = 'medium';

          currentMed.needsVerification = true;
        }

        /*
        |--------------------------------------------------------------------------
        | Three times daily
        |--------------------------------------------------------------------------
        */

        else if (
          /3\s*times\s*daily|three\s*times\s*daily|tid/i.test(
            line
          )
        ) {
          currentMed.frequency =
            '3 times daily';
        }

        /*
        |--------------------------------------------------------------------------
        | Twice daily
        |--------------------------------------------------------------------------
        */

        else if (
          /2\s*times\s*daily|twice\s*daily|bid/i.test(
            line
          )
        ) {
          currentMed.frequency =
            'twice daily';
        }

        /*
        |--------------------------------------------------------------------------
        | Once daily
        |--------------------------------------------------------------------------
        */

        else if (
          /once\s*daily|1\s*time\s*daily|daily|qd/i.test(
            line
          )
        ) {
          currentMed.frequency =
            'once daily';
        }

        /*
        |--------------------------------------------------------------------------
        | Four times daily
        |--------------------------------------------------------------------------
        */

        else if (
          /4\s*times\s*daily|four\s*times\s*daily|qid/i.test(
            line
          )
        ) {
          currentMed.frequency =
            '4 times daily';
        }

        /*
        |--------------------------------------------------------------------------
        | Duration
        |
        | Examples:
        | For 5 days
        | For 2 weeks
        | Duration: 1 month
        |--------------------------------------------------------------------------
        */

        const durMatch =
          line.match(
            /(?:for|duration:?)\s*(\d+)\s*(days?|weeks?|months?)/i
          ) ||
          line.match(
            /(\d+)\s*(days?|weeks?|months?)/i
          );

        if (
          durMatch &&
          !/times/i.test(line)
        ) {
          currentMed.durationValue =
            parseInt(
              durMatch[1],
              10
            );

          currentMed.durationUnit =
            durMatch[2]
              .toLowerCase()
              .replace(/s$/, '') + 's';
        }

        /*
        |--------------------------------------------------------------------------
        | Instructions
        |--------------------------------------------------------------------------
        */

        const instMatch = line.match(
          /(?:instructions?:?\s*)?(before\s+breakfast|after\s+breakfast|before\s+meals?|after\s+meals?|with\s+food|before\s+bedtime|at\s+bedtime|on\s+empty\s+stomach)/i
        );

        if (instMatch) {
          currentMed.instructions =
            instMatch[1];
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Save final medication
    |--------------------------------------------------------------------------
    */

    if (currentMed) {
      medications.push(
        this.finalizeMedication(currentMed)
      );
    }

    return {
      medications,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Finalize local-parser medication
  |--------------------------------------------------------------------------
  */

  finalizeMedication(medication) {
    const criticalFields = [
      'name',
      'strength',
      'doseAmount',
      'doseUnit',
      'frequency',
      'durationValue',
      'durationUnit',
    ];

    const incomplete =
      criticalFields.some(
        (field) =>
          medication[field] === null ||
          medication[field] === undefined ||
          medication[field] === ''
      );

    /*
    |--------------------------------------------------------------------------
    | Incomplete prescription
    |--------------------------------------------------------------------------
    */

    if (incomplete) {
      medication.confidence = 'low';

      medication.needsVerification = true;
    }

    /*
    |--------------------------------------------------------------------------
    | Complete prescription
    |--------------------------------------------------------------------------
    */

    else {
      medication.confidence = 'high';

      medication.needsVerification = false;
    }

    /*
    |--------------------------------------------------------------------------
    | Never allow missing medication name
    |--------------------------------------------------------------------------
    */

    if (!medication.name) {
      medication.confidence = 'low';

      medication.needsVerification = true;
    }

    return medication;
  }
}

/*
|--------------------------------------------------------------------------
| Export singleton service
|--------------------------------------------------------------------------
*/

export default new AIPrescriptionService();