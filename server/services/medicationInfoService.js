/**
 * Curated Clinical Medication Information Service
 * Provides trusted, verified drug reference data without LLM hallucination.
 */

const MEDICATION_DATABASE = {
  amoxicillin: {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic (Penicillin class)',
    description:
      'Amoxicillin is a broad-spectrum penicillin antibiotic used to treat a wide variety of bacterial infections. It works by stopping the growth of bacteria.',
    commonUses: [
      'Ear, nose, and throat infections',
      'Lower respiratory tract infections (bronchitis, pneumonia)',
      'Skin and skin structure infections',
      'Urinary tract infections (UTIs)',
    ],
    storage: 'Store at room temperature between 20°C to 25°C (68°F to 77°F) away from moisture, heat, and direct light.',
    warnings: [
      'Complete the entire prescribed course even if symptoms disappear after a few days.',
      'Do not use if you have an allergy to penicillin or cephalosporin antibiotics.',
      'May reduce the effectiveness of oral birth control pills; discuss with your doctor.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
  pantoprazole: {
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    category: 'Proton Pump Inhibitor (PPI)',
    description:
      'Pantoprazole decreases the amount of acid produced in the stomach. It is commonly prescribed to protect the stomach lining and heal acid-related damage.',
    commonUses: [
      'Gastroesophageal reflux disease (GERD)',
      'Healing of erosive esophagitis',
      'Stomach and duodenal ulcer prevention',
      'Gastric acid reduction alongside antibiotic treatments',
    ],
    storage: 'Store below 30°C (86°F) in a dry place. Keep blister strips tightly closed.',
    warnings: [
      'Usually taken 30 to 60 minutes before breakfast with a full glass of water.',
      'Swallow tablets whole; do not split, crush, or chew delayed-release tablets.',
      'Notify your doctor if you experience persistent stomach pain, severe diarrhea, or bone pain.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
  metformin: {
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Biguanide Antidiabetic',
    description:
      'Metformin helps control blood sugar levels by reducing glucose production in the liver and improving insulin sensitivity in muscles.',
    commonUses: [
      'Type 2 diabetes mellitus management',
      'Prediabetes management in high-risk individuals',
      'Insulin resistance support',
    ],
    storage: 'Store between 15°C and 30°C (59°F and 86°F) protected from moisture and light.',
    warnings: [
      'Take with meals to reduce common gastrointestinal side effects such as nausea or upset stomach.',
      'Avoid excessive alcohol consumption while taking Metformin.',
      'Report symptoms of severe fatigue, muscle aches, or trouble breathing immediately.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
  atorvastatin: {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'HMG-CoA Reductase Inhibitor (Statin)',
    description:
      'Atorvastatin lowers levels of bad cholesterol (LDL) and triglycerides in the blood, while raising good cholesterol (HDL).',
    commonUses: [
      'Hypercholesterolemia (elevated cholesterol)',
      'Prevention of cardiovascular disease, heart attacks, and strokes',
    ],
    storage: 'Store at 20°C to 25°C (68°F to 77°F). Protect from moisture.',
    warnings: [
      'Can be taken with or without food, typically in the evening or at bedtime.',
      'Avoid consuming large quantities of grapefruit juice while on this medication.',
      'Contact your healthcare provider if you notice unexplained muscle pain, tenderness, or weakness.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
  azithromycin: {
    name: 'Azithromycin',
    genericName: 'Azithromycin Dihydrate',
    category: 'Macrolide Antibiotic',
    description:
      'Azithromycin is used to treat mild-to-moderate bacterial infections in various parts of the body.',
    commonUses: [
      'Respiratory tract infections',
      'Sinusitis and pharyngitis',
      'Skin infections',
    ],
    storage: 'Store at room temperature away from excessive heat and direct sunlight.',
    warnings: [
      'Finish the entire prescribed course even if you feel better.',
      'Take with or without food; take with food if stomach upset occurs.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
  paracetamol: {
    name: 'Paracetamol / Acetaminophen',
    genericName: 'Acetaminophen / Paracetamol',
    category: 'Analgesic & Antipyretic',
    description:
      'Paracetamol is a common medication used to relieve mild-to-moderate pain and reduce fever.',
    commonUses: [
      'Headache, toothache, muscle aches',
      'Fever reduction during viral illnesses',
      'Mild arthritis discomfort',
    ],
    storage: 'Store at room temperature in a dry place.',
    warnings: [
      'Do not exceed the maximum recommended daily limit (typically 3,000 mg – 4,000 mg for adults).',
      'Check other cold/flu medications to avoid accidental overdose.',
    ],
    disclaimer:
      'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
  },
};

class MedicationInfoService {
  /**
   * Find trusted reference information by medicine name
   * @param {string} medicineName
   */
  getMedicationInfo(medicineName) {
    if (!medicineName) return this.getDefaultInfo('Unknown Medication');

    const cleanName = medicineName.toLowerCase().trim();

    for (const [key, data] of Object.entries(MEDICATION_DATABASE)) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return data;
      }
    }

    return this.getDefaultInfo(medicineName);
  }

  /**
   * Standard clinical fallback profile for medicines not yet in local dataset
   */
  getDefaultInfo(name) {
    return {
      name: name,
      genericName: name,
      category: 'Prescription Medication',
      description: `${name} has been prescribed for your treatment. Refer to your physician or verified prescription for specific dosing instructions.`,
      commonUses: [
        'Treatment as prescribed by your registered healthcare provider.',
        'Follow verified schedule and directions provided.',
      ],
      storage: 'Store in a cool, dry place away from direct sunlight and keep out of reach of children.',
      warnings: [
        'Take strictly according to your confirmed prescription instructions.',
        'Do not share prescription medications with others.',
        'If you experience adverse reactions, consult your physician immediately.',
      ],
      disclaimer:
        'If you have questions about your medication, dosage, side effects, or missed doses, contact your doctor or pharmacist.',
    };
  }
}

export default new MedicationInfoService();
