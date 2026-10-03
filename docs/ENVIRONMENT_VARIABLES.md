# Environment Variables Reference

This document lists all environment variables referenced by the Smart Medication Adherence System across the backend and frontend codebases.

---

## Complete Variables Table

| Variable | Location | Required | Purpose | Example |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `server/.env` | **No** (Optional, defaults to `5000`) | Network port on which the Express HTTP server listens. | `5000` |
| `MONGODB_URI` | `server/.env` | **Yes** in production / **Optional** in dev (defaults to local `mongodb://127.0.0.1:27017/smart_medication_db`) | Connection URI for the MongoDB instance (local or MongoDB Atlas cluster). | `mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/smart_medication_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | `server/.env` | **Yes** in production / **Optional** in dev (has hardcoded development fallback) | Secret key used by `jsonwebtoken` to sign and verify patient authentication tokens. | `e4d7a8c9b2f1056e7d8c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e` |
| `OCR_API_KEY` | `server/.env` | **No** (Optional) | API credential for an external cloud OCR provider (e.g., OCR.Space, Google Cloud Vision). When unset or empty, the built-in demo/development OCR engine handles image processing. | `K87654321088957` |
| `AI_API_KEY` | `server/.env` | **No** (Optional) | API credential for an external LLM endpoint (e.g., Gemini API). When unset or empty, the built-in deterministic clinical regex parser extracts structured medication parameters. | `AIzaSyD-ExampleKey1234567890abcdef` |
| `VITE_API_URL` | `client/.env` | **Yes** in production / **Optional** in dev (defaults to `/api` via Vite reverse proxy) | Base URL prefix for backend REST API requests initiated by Axios from the browser. | `https://smart-medication-api.onrender.com/api` (prod) or `/api` (dev) |

---

## Detailed Variable Specifications

### 1. `PORT`
* **File:** `server/.env`
* **Code Reference:** `server/server.js:68` (`const PORT = process.env.PORT || 5000;`)
* **Behavior:** Defines the listening port. Platform providers (e.g., Render, Heroku) inject this dynamically.
* **Security:** Non-sensitive. Backend-only.

### 2. `MONGODB_URI`
* **File:** `server/.env`
* **Code References:**
  * `server/config/db.js:5` (`process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_medication_db'`)
  * `server/scripts/seed.js:63` (`process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_medication_db'`)
* **Behavior:** Mongoose connection string. Must include authentication credentials and database name when connecting to MongoDB Atlas.
* **Security:** **Highly Sensitive.** Must remain strictly backend-only. Never expose to frontend or git commits.

### 3. `JWT_SECRET`
* **File:** `server/.env`
* **Code References:**
  * `server/middleware/auth.js:24` (`process.env.JWT_SECRET || 'supersecretjwtkey_smartmed_2026_adherence'`)
  * `server/controllers/authController.js:8` (`process.env.JWT_SECRET || 'supersecretjwtkey_smartmed_2026_adherence'`)
* **Behavior:** Used to sign HMAC-SHA256 tokens during patient login and registration, and verify them on protected routes.
* **Security:** **Highly Sensitive.** Must remain strictly backend-only. In production, use a high-entropy 256-bit string generated via `openssl rand -hex 32`.

### 4. `OCR_API_KEY`
* **File:** `server/.env`
* **Code Reference:** `server/services/ocrService.js:22` (`const ocrApiKey = process.env.OCR_API_KEY;`)
* **Behavior:** If configured with a non-empty string, invokes `callExternalOCR()`. If empty or undefined, routes automatically to `simulateLocalOCR()` for offline demonstration.
* **Security:** Sensitive API credential. Backend-only.

### 5. `AI_API_KEY`
* **File:** `server/.env`
* **Code Reference:** `server/services/aiPrescriptionService.js:20` (`const aiApiKey = process.env.AI_API_KEY;`)
* **Behavior:** If configured with a non-empty string, invokes `callExternalLLM()`. If empty or undefined, routes automatically to `parsePrescriptionText()` for clinical entity extraction.
* **Security:** Sensitive API credential. Backend-only.

### 6. `VITE_API_URL`
* **File:** `client/.env`
* **Code Reference:** `client/src/services/api.js:4` (`baseURL: import.meta.env.VITE_API_URL || '/api'`)
* **Behavior:** Tells Axios where to route HTTP requests. In local development, the Vite dev server (`client/vite.config.js`) proxies `/api` calls to `http://localhost:5000`. In production, this points to your deployed backend URL.
* **Security:** Public by design. Embedded in the client-side JavaScript bundle. Must only contain public API endpoints (no keys or secrets).
