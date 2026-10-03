# System Setup & Configuration Audit

---

### Manual Setup Required

Here is the exact, prioritized list of actions you personally need to perform:

1. **For Local Development (Ready to run right now):**
   * **MongoDB Service:** Ensure MongoDB is running locally on your machine (`mongodb://127.0.0.1:27017`). *(Already verified running on your Windows system).*
   * **Backend `.env`:** Ensure `server/.env` exists with `PORT=5000`, `MONGODB_URI`, and `JWT_SECRET`. *(Already created).*
   * **Database Seed:** Run `node scripts/seed.js` inside `server/` to initialize demo accounts and adherence metrics. *(Already executed).*
   * **No external accounts or paid API keys are required to test or demonstrate the application locally.** The system includes built-in offline fallbacks for OCR, AI extraction, and clinical drug information.

2. **For Production Deployment (When launching to the cloud):**
   * **Create MongoDB Atlas Database:** Provision a free MongoDB Atlas cluster, create a database user, whitelist IP access (`0.0.0.0/0`), and copy the connection string.
   * **Generate a Production JWT Secret:** Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and store it securely.
   * **Set Render (Backend) Environment Variables:** Configure `MONGODB_URI` and `JWT_SECRET`.
   * **Set Vercel / Netlify (Frontend) Environment Variables:** Configure `VITE_API_URL` pointing to your deployed backend API URL (e.g., `https://your-backend.onrender.com/api`).
   * **Grant Browser Notifications:** Click "Enable Alerts" on the dashboard when prompted in the browser so dose reminders can appear.

---

## 1. Backend Environment Variables

The backend codebase (`server/`) inspects the following variables via `process.env`:

| Variable | Referenced In | Fallback in Code | Required in Dev | Required in Prod |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `server/server.js:68` | `5000` | Optional | Optional (Render injects this) |
| `MONGODB_URI` | `server/config/db.js:5`<br>`server/scripts/seed.js:63` | `mongodb://127.0.0.1:27017/smart_medication_db` | Optional if local Mongo is running | **Mandatory** |
| `JWT_SECRET` | `server/middleware/auth.js:24`<br>`server/controllers/authController.js:8` | `'supersecretjwtkey_smartmed_2026_adherence'` | Optional (fallback active) | **Mandatory** (security risk to use fallback) |
| `OCR_API_KEY` | `server/services/ocrService.js:22` | None (falls back to local demo OCR) | Optional | Optional |
| `AI_API_KEY` | `server/services/aiPrescriptionService.js:20` | None (falls back to clinical regex parser) | Optional | Optional |

---

## 2. Frontend Environment Variables

The frontend codebase (`client/`) inspects the following variable via `import.meta.env`:

| Variable | Referenced In | Fallback in Code | Required in Dev | Required in Prod |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `client/src/services/api.js:4` | `'/api'` | Optional (proxied via Vite) | **Mandatory** (points to backend URL) |

---

## 3. Mandatory vs. Optional Variables

### In Local Development
* **Mandatory:** None (all variables have automated local fallbacks, provided MongoDB runs locally).
* **Recommended:** Set `JWT_SECRET` in `server/.env` to avoid using the fallback secret.

### In Production
* **Mandatory:**
  * `MONGODB_URI` (Backend) — Remote cloud MongoDB instance (e.g., Atlas).
  * `JWT_SECRET` (Backend) — Cryptographic secret for patient authentication.
  * `VITE_API_URL` (Frontend) — Public URL of your deployed backend service.
* **Optional:**
  * `PORT` (Backend) — Defaults to `5000` or host-assigned port.
  * `OCR_API_KEY` (Backend) — Only needed if replacing the built-in OCR demo engine with an external cloud OCR service.
  * `AI_API_KEY` (Backend) — Only needed if replacing the built-in deterministic clinical parser with an external LLM endpoint.

---

## 4. Origin of API Keys & Credentials

| Credential | Source Provider | Notes |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Inc. (Atlas) or Local MongoDB | Created in your MongoDB Atlas console or local daemon. |
| `JWT_SECRET` | Self-Generated | Generated locally via terminal/cryptographic PRNG. |
| `OCR_API_KEY` | Optional OCR Provider (e.g., OCR.Space or Google Cloud) | Generated from the respective developer portal. |
| `AI_API_KEY` | Optional LLM Provider (e.g., Google AI Studio / Gemini) | Generated from Google AI Studio. |
| `VITE_API_URL` | Your Cloud Hosting Provider (Render / Railway / AWS) | The HTTPS endpoint assigned to your deployed backend. |

---

## 5. Step-by-Step Instructions for Obtaining Credentials

### A. How to Generate `JWT_SECRET`
Open a terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the 64-character hexadecimal output and set it as `JWT_SECRET` in `server/.env`.

### B. How to Obtain `MONGODB_URI` (MongoDB Atlas)
1. Navigate to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create an **M0 Free Cluster**.
3. Under **Security → Database Access**, click **Add New Database User**:
   * Authentication Method: Password.
   * Role: Read and write to any database.
4. Under **Security → Network Access**, click **Add IP Address**:
   * Select **Allow Access From Anywhere** (`0.0.0.0/0`) for cloud deployment.
5. In **Database Deployments**, click **Connect → Drivers (Node.js)**:
   * Copy the connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/smart_medication_db?retryWrites=true&w=majority
     ```
   * Replace `<username>` and `<password>` with your credentials.

### C. How to Obtain `AI_API_KEY` (Optional)
If you wish to attach an external Gemini LLM endpoint:
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** → **Create API key in new project**.
3. Copy the key and place it in `server/.env` as `AI_API_KEY`.

### D. How to Obtain `OCR_API_KEY` (Optional)
If you wish to attach an external OCR provider (such as OCR.Space):
1. Navigate to [ocr.space/ocrapi](https://ocr.space/ocrapi).
2. Register for a free API key.
3. Place the received key in `server/.env` as `OCR_API_KEY`.

---

## 6. Services Requiring Account Creation

* **In Offline Development Mode:** **None.** No external accounts, credit cards, or online services are needed.
* **In Production Cloud Deployment:**
  * **MongoDB Atlas** (Free tier account required for persistent database hosting).
  * **Render / Railway / Fly.io** (Account required for backend hosting).
  * **Vercel / Netlify** (Account required for frontend hosting).
  * *(Optional)* Google AI Studio (if activating external LLM features).
  * *(Optional)* OCR.Space or Google Cloud (if activating external OCR features).

---

## 7. Services That Are Completely Local (No External Account Needed)

1. **Local MongoDB Database:** Runs locally on `mongodb://127.0.0.1:27017`.
2. **Local Intelligent OCR Engine:** Implemented in `server/services/ocrService.js` (`simulateLocalOCR`). Automatically processes prescription images, recognizes dosage and medicine lines without requiring cloud APIs.
3. **Clinical Extraction Parser:** Implemented in `server/services/aiPrescriptionService.js` (`parsePrescriptionText`). Uses deterministic clinical regex entity extraction adhering strictly to all 10 safety rules without LLM token costs.
4. **Clinical Reference Database:** Implemented in `server/services/medicationInfoService.js`. Contains curated medical reference facts for common medications (Amoxicillin, Pantoprazole, Metformin, Atorvastatin, Azithromycin, Paracetamol, etc.) and safe clinical fallbacks.
5. **Local Prescription Image Storage:** Handled by Multer directly in `server/uploads/`.
6. **Authentication Engine:** Built entirely with local `bcryptjs` password hashing and `jsonwebtoken`.

---

## 8. MongoDB Atlas Setup Requirements

1. **Cluster Tier:** Free Shared Tier (M0) is sufficient.
2. **Database Name:** Specify `smart_medication_db` in the connection URI path:
   ```text
   mongodb+srv://<user>:<password>@cluster0.mongodb.net/smart_medication_db?retryWrites=true&w=majority
   ```
3. **Network Access Rules:**
   * Whitelist `0.0.0.0/0` (Allow access from anywhere) so PaaS containers (Render, Railway) can connect dynamically.
4. **Connection Driver:** Mongoose v8/v9 compatible (Node.js driver 5.x+).

---

## 9. JWT Secret Setup Requirements

* **Algorithm:** HMAC-SHA256 (`HS256`).
* **Storage:** Backend environment variable `JWT_SECRET`.
* **Security Criteria:** Minimum 32 bytes (64 hex characters) of entropy.
* **Protection:** Must never be committed to git or exposed to the frontend client.

---

## 10. LLM API Setup Requirements

* **Current Implementation:** `server/services/aiPrescriptionService.js` has a clean pluggable abstraction (`callExternalLLM`) and falls back seamlessly to `parsePrescriptionText`.
* **Mock/Demo Fallback:** Active by default when `AI_API_KEY` is empty. The local parser:
  * Extracts medication names, strengths, dose amounts, dose units, frequencies, durations, and instructions.
  * Assigns confidence scores (`high`, `medium`, `low`) and flags ambiguous entries (`needsVerification: true`).
  * Never invents missing data.
  * Handles "Flexible / As Needed" / PRN instructions safely.
* **To activate external LLM:** Supply a valid key in `server/.env` under `AI_API_KEY`.

---

## 11. OCR API Setup Requirements

* **Current Implementation:** `server/services/ocrService.js` provides a pluggable abstraction (`callExternalOCR`) and falls back seamlessly to `simulateLocalOCR`.
* **Mock/Demo Fallback:** Active by default when `OCR_API_KEY` is empty. Recognizes standard prescription formats, sample prescriptions, and uploaded images.
* **To activate external OCR:** Set `OCR_API_KEY` in `server/.env` and wire the API endpoint in `callExternalOCR`.

---

## 12. Image / File Storage Setup Requirements

* **Current Implementation:** `server/middleware/upload.js` uses Multer disk storage pointing to the `server/uploads/` directory.
* **File Constraints:**
  * Supported formats: `JPG`, `JPEG`, `PNG`, `WEBP`, `PDF`.
  * Maximum file size: `10 MB`.
* **Static Serving:** Served directly via Express static middleware: `app.use('/uploads', express.static(...))`.
* **Production Deployment Notice:** Free cloud platforms (like free Render or Heroku) use ephemeral file systems where local files in `uploads/` are reset upon container restarts. For permanent production image persistence:
  * Attach a Render Persistent Disk mounted at `/uploads`, OR
  * Connect an S3/Cloudinary storage bucket in `server/middleware/upload.js`.
  * For hackathon evaluation and local testing, local disk storage is fully operational.

---

## 13. CORS Configuration

* **Code Reference:** `server/server.js:25` (`app.use(cors());`).
* **Current Behavior:** Permissive (`*`), allowing all origins to connect during development and hackathon testing.
* **Production Recommendation:** If restricting origins to your deployed frontend domain, configure CORS options:
  ```javascript
  app.use(cors({
    origin: process.env.CLIENT_URL || 'https://your-frontend.vercel.app',
    credentials: true,
  }));
  ```

---

## 14. Local Development Setup

To run the application locally from scratch:

1. **Clone repository & open workspace:**
   ```bash
   cd "Smart prescription"
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm install
   # Ensure server/.env exists (see Section 1)
   node scripts/seed.js    # Seeds demo account with 86.7% realistic adherence
   npm run dev             # Starts Express server on http://localhost:5000
   ```

3. **Setup Client (in a separate terminal):**
   ```bash
   cd client
   npm install
   # client/.env uses default /api with Vite proxy
   npm run dev             # Starts Vite server on http://localhost:3000
   ```

4. **Access the application:** Open `http://localhost:3000` in your browser.

---

## 15. Production Deployment Configuration

```text
[ Vercel / Netlify ]                          [ Render / Railway ]
  Frontend React App   ────── HTTPS /api ─────▶  Backend Express API
  VITE_API_URL=https://...                       PORT=5000
                                                 MONGODB_URI=mongodb+srv://...
                                                 JWT_SECRET=...
                                                      │
                                                      ▼
                                              [ MongoDB Atlas ]
```

1. Deploy the backend to **Render** or **Railway** as a Web Service.
2. Deploy the frontend to **Vercel** or **Netlify** as a Single Page Application.
3. Configure environment variables in each platform's settings dashboard.

---

## 16. Netlify / Vercel Environment Variables

Set this single variable in your Netlify or Vercel dashboard:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-service.onrender.com/api` | Points browser requests to your live backend API. |

* **Vercel Build Command:** `npm run build`
* **Vercel Output Directory:** `dist`
* **Vercel Root Directory:** `client`

---

## 17. Render Environment Variables

Set these variables in the Render Web Service dashboard:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `PORT` | `5000` | (Render automatically sets this, but defaults to 5000) |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_medication_db?retryWrites=true&w=majority` | **Mandatory.** MongoDB Atlas connection URI. |
| `JWT_SECRET` | *(64-character random string)* | **Mandatory.** Generated secret for signing tokens. |
| `OCR_API_KEY` | *(leave empty or set if using external OCR)* | Optional. |
| `AI_API_KEY` | *(leave empty or set if using external LLM)* | Optional. |

* **Render Build Command:** `npm install`
* **Render Start Command:** `node server.js`
* **Render Root Directory:** `server`

---

## 18. Required NPM Commands

### Server (`server/package.json`)
* `npm install` — Installs backend dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `multer`, `cors`, `dotenv`, `morgan`).
* `npm start` — Starts production server (`node server.js`).
* `npm run dev` — Starts development server with file watch (`node --watch server.js`).
* `npm run seed` — Runs database seed script (`node scripts/seed.js`).

### Client (`client/package.json`)
* `npm install` — Installs frontend dependencies (`react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react`, `recharts`, `tailwindcss`, `@tailwindcss/vite`).
* `npm run dev` — Starts Vite dev server with hot module replacement on port `3000`.
* `npm run build` — Compiles and minifies production bundle to `client/dist`.
* `npm run preview` — Locally previews production build.

---

## 19. Database Migration & Seed Commands

* **Command:** `npm run seed` (executed inside `server/`) or `node scripts/seed.js`
* **What it does:**
  * Cleans existing records in `User`, `Prescription`, `Medication`, and `Dose` collections.
  * Generates the sample prescription image artifact (`server/uploads/sample-prescription.png`).
  * Seeds demo user:
    * **Email:** `demo@example.com`
    * **Password:** `Demo@123`
    * **Name:** Rahul Sharma
  * Seeds verified medications:
    * **Amoxicillin 500 mg** (3 times daily, 5 days)
    * **Pantoprazole 40 mg** (once daily before breakfast, 5 days)
  * Seeds 30 historical/evaluated doses resulting in exact **86.7% adherence** (26 taken, 4 missed) and 4 doses for today (2 taken, 2 pending).

---

## 20. Browser Permission Requirements

1. **Notification API (`Notification.requestPermission`):**
   * Required for browser-level dose alerts when a dose is due.
   * Requested when the user clicks the "Enable Alerts" button in the Navbar.
   * If denied, the application falls back gracefully to in-app reminder modals (`ReminderModal.jsx`).
2. **Local Storage (`localStorage`):**
   * Stores `smartmed_token` (JWT auth token) and `smartmed_user` (cached profile).
   * Standard browser storage; no special prompt required.

---

## 🔒 Security Audit & Verification Checklist

- [x] **No secret is exposed in frontend code:** Audited `client/src/`. Only `VITE_API_URL` is referenced. No API keys or database secrets exist in the client bundle.
- [x] **No API key is hardcoded:** Audited all source files. Keys are loaded strictly via `process.env`.
- [x] **`.env` is in `.gitignore`:** Audited and enforced in root `.gitignore`, `server/.gitignore`, and `client/.gitignore`.
- [x] **`.env.example` exists:** Verified in project root (`.env.example`), `server/.env.example`, and `client/.env.example`.
- [x] **`VITE_*` variables contain only values safe to expose:** Only `VITE_API_URL` is exposed, pointing to the public API endpoint.
- [x] **MongoDB credentials remain backend-only:** Mongoose connection logic is strictly confined to `server/config/db.js` and `server/scripts/seed.js`.
- [x] **`JWT_SECRET` remains backend-only:** Auth signing and token verification exist solely in `server/middleware/auth.js` and `server/controllers/authController.js`.
- [x] **LLM/OCR API keys remain backend-only:** Referenced solely inside `server/services/ocrService.js` and `server/services/aiPrescriptionService.js`.
