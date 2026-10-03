# Smart Medication Adherence System (MedSync)
> **From Prescription to Treatment Completion** — A production-quality Hackathon MVP for prescription digitizing, human-in-the-loop verification, automated schedule generation, dose reminders, and clinical adherence tracking.

---

## 🌟 Highlights & Key Features

This application implements **only** the 8 required core MVP features with a clean, extensible MERN architecture:

1. **Prescription OCR Service**: Pluggable OCR service abstraction with support for external providers (Google Cloud Vision / OCR.Space) and an offline development/demo engine.
2. **AI Prescription Extraction**: Converts unstructured OCR prescription text into clinical medication entities adhering strictly to 10 medical safety rules (never invents missing data, scores confidence, flags ambiguity).
3. **Prescription Verification**: Human-in-the-loop side-by-side verification screen (original scanned prescription on the left, editable medication parameters on the right). Only verified medications can generate active schedules.
4. **Automatic Medication Schedule**: Calculates daily dose timings (e.g., 08:00 AM, 02:00 PM, 08:00 PM) based on frequency and specific instructions ("after meals", "before breakfast"), and handles PRN / "As Needed" medications without inventing arbitrary hours.
5. **Dose Reminders**: Browser Notification API integration and in-app reminder modal with **Mark as Taken** and **Snooze (15m)** actions.
6. **Taken / Missed Tracking**: Real-time state machine for scheduled doses (`pending`, `taken`, `missed`, `skipped`) with timestamp recording and full audit history.
7. **Adherence Dashboard**: Overall compliance rate card (`Taken / Evaluated × 100`), 7-day dose trend bar chart powered by **Recharts**, medication-wise adherence breakdown, and recent missed doses log.
8. **Medication Information**: Curated, trusted pharmaceutical drug reference dataset clearly distinguishing patient-specific verified instructions from general clinical information.

---

## 🏗️ System Architecture

```text
smart-medication-adherence/
├── client/                     # Frontend (React 19, Vite, Tailwind CSS v4, JSX)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, DoseCard, StatusBadge, ReminderModal, Footer)
│   │   ├── pages/              # 8 Main MVP Pages
│   │   ├── context/            # AuthContext & ReminderContext
│   │   ├── services/           # Central Axios instance with JWT interceptors
│   │   ├── App.jsx             # React Router configuration & protected routes
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Backend (Node.js, Express, MongoDB, Mongoose)
│   ├── config/                 # Database connection (db.js)
│   ├── controllers/            # Thin REST controllers
│   ├── models/                 # User, Prescription, Medication, Dose
│   ├── middleware/             # JWT auth & Multer prescription upload
│   ├── services/               # OCR, AI Extraction, Scheduling, Adherence, Medication Info
│   ├── routes/                 # Express API routes
│   ├── scripts/                # Database seed script (seed.js)
│   ├── uploads/                # Static prescription image storage
│   ├── server.js               # Main application entry point
│   └── package.json
│
├── README.md
└── .env.example
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18+ (tested on v22.14.0)
* **MongoDB**: Local MongoDB server running on port `27017` (or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd server
npm install
node scripts/seed.js    # Seeds demo account with 86.7% realistic adherence data
npm start               # Runs Express backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev             # Runs Vite dev server on http://localhost:3000
```

Open your browser at **`http://localhost:3000`**.

---

## 🔑 Demo Account Credentials

For quick evaluation during hackathon judging:
* **Email:** `demo@example.com`
* **Password:** `Demo@123`
*(Or click the "Auto Fill" button on the login screen)*

---

## ⏱️ 2-Minute Demo Experience Walkthrough

1. **Login**: Click *Auto Fill* on `/login` and sign in as **Rahul Sharma**.
2. **Dashboard**: View Today's schedule, 86.7% adherence progress card, next upcoming dose, and active medications.
3. **Upload Prescription**:
   - Go to `/prescriptions/upload`.
   - Click **"Load Sample Demo Rx"** (loads pre-configured doctor prescription slip).
   - Click **"Extract & Verify Prescription"** and watch the real-time OCR and AI extraction stepper.
4. **Verify**:
   - Side-by-side comparison screen shows original image on left and extracted fields (Amoxicillin 500mg, Pantoprazole 40mg) on right.
   - Click **"Confirm Prescription & Build Schedule"**.
5. **Schedule**:
   - View newly generated daily dose timeline (`08:00 AM`, `02:00 PM`, `08:00 PM`).
   - Click **"Mark as Taken"** on any pending dose.
6. **Adherence Analytics**:
   - Visit `/adherence` to see overall percentage, Recharts 7-day trend, and medication-specific breakdown.
7. **Clinical Medicine Information**:
   - Visit `/medications` and click on **Amoxicillin** to view dosage, storage recommendations, and precautions.

---

## 🛡️ Medical Safety Constraints

* **Human-in-the-Loop**: Raw OCR output never generates schedules automatically. Doses are only created upon patient review and verification (`verified: true`).
* **Zero Speculative Dosing**: If frequency is "As needed" / "PRN" / "SOS", the system presents clear clinical guidance instead of inventing arbitrary dosing hours.
* **No Diagnostic Hallucinations**: General drug information is derived from curated reference datasets, never unconstrained LLM hallucinations.
