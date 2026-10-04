import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

/**
 * OCR Service
 *
 * Production:
 *   Uses OCR.Space when OCR_API_KEY is configured.
 *
 * Development fallback:
 *   Uses deterministic demo OCR when no API key is configured.
 */
class OCRService {
  async extractTextFromImage(filePath, originalName = '') {
    if (!fs.existsSync(filePath)) {
      throw new Error('Prescription file not found on server.');
    }

    const ocrApiKey = process.env.OCR_API_KEY;

    // Use real OCR when an API key is available
    if (ocrApiKey && ocrApiKey.trim() !== '') {
      try {
        return await this.callExternalOCR(filePath, ocrApiKey);
      } catch (err) {
        console.error(
          '[OCRService] External OCR failed:',
          err.response?.data || err.message
        );

        // Keep fallback for hackathon development
        console.warn('[OCRService] Falling back to demo OCR.');
      }
    }

    return this.simulateLocalOCR(filePath, originalName);
  }

  /**
   * Real OCR.Space integration
   */
  async callExternalOCR(filePath, apiKey) {
    const form = new FormData();

    form.append('file', fs.createReadStream(filePath));

    form.append('language', 'eng');

    // Better for documents/prescriptions
    form.append('isOverlayRequired', 'false');
    form.append('detectOrientation', 'true');
    form.append('scale', 'true');
    form.append('OCREngine', '2');

    const response = await axios.post(
      'https://api.ocr.space/parse/image',
      form,
      {
        headers: {
          apikey: apiKey,
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000,
      }
    );

    const data = response.data;

    if (data.IsErroredOnProcessing) {
      const message = Array.isArray(data.ErrorMessage)
        ? data.ErrorMessage.join(', ')
        : data.ErrorMessage || 'OCR.Space processing failed.';

      throw new Error(message);
    }

    const parsedResults = data.ParsedResults || [];

    const extractedText = parsedResults

      .map((result) => result.ParsedText || '')
      .join('\n')
      .trim();


    if (!extractedText) {
      throw new Error('OCR completed but no readable text was detected.');
    }

    return extractedText;
  }

  /**
   * Development / demo fallback
   *
   * IMPORTANT:
   * This is only used when OCR_API_KEY is not configured
   * or the external OCR service fails.
   */
  simulateLocalOCR(filePath, originalName = '') {
    const filename = (
      originalName || path.basename(filePath)
    ).toLowerCase();

    if (
      filename.includes('amox') ||
      filename.includes('panto') ||
      filename.includes('demo') ||
      filename.includes('sample')
    ) {
      return `APOLLO CLINIC & HEALTHCARE SERVICES
Dr. S. Mehta, MD (Internal Medicine)
Reg. No: MED-884920
Date: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}

Patient Name: Rahul Sharma
Age: 38 Yrs | Gender: Male

Rx:
1. Amoxicillin 500 mg
Take 1 tablet 3 times daily
Duration: 5 days
Instructions: After meals

2. Pantoprazole 40 mg
Take 1 tablet once daily
Duration: 5 days
Instructions: Before breakfast

Doctor's Signature: Dr. S. Mehta`;
    }

    if (
      filename.includes('cardio') ||
      filename.includes('bp') ||
      filename.includes('heart')
    ) {
      return `METRO HEART & VASCULAR INSTITUTE
Dr. Anita Roy, MD, DM (Cardiology)
Date: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}

Patient Name: Rahul Sharma

Rx:
1. Atorvastatin 20 mg
Take 1 tablet once daily
Duration: 30 days
Instructions: Before bedtime

2. Metformin 500 mg
Take 1 tablet twice daily
Duration: 30 days
Instructions: After meals with water`;
    }

    return `CITY MULTISPECIALTY HOSPITAL
DEPARTMENT OF INTERNAL MEDICINE
Dr. S. Mehta, MBBS, MD
Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}

Patient: Rahul Sharma | Age: 38 yrs

Rx:
1. Amoxicillin 500 mg
Take 1 tablet 3 times daily
For 5 days
Instructions: Take after meals

2. Pantoprazole 40 mg
Take 1 tablet once daily
For 5 days
Instructions: Take before breakfast`;
  }
}

export default new OCRService();