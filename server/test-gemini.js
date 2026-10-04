import 'dotenv/config';

console.log(
  'Gemini key loaded:',
  Boolean(process.env.AI_API_KEY)
);

import aiPrescriptionService from './services/aiPrescriptionService.js';

const ocrText = `
CITY MULTISPECIALTY HOSPITAL

Dr. Amit Sharma
Patient: Rahul Kumar

Rx:

1. Amoxicillin 500 mg
Take 1 tablet 3 times daily
For 5 days
Instructions: After meals

2. Pantoprazole 40 mg
Take 1 tablet once daily
For 5 days
Instructions: Before breakfast
`;

try {
  const result =
    await aiPrescriptionService.extractMedications(ocrText);

  console.log(
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error('TEST FAILED:', error);
}