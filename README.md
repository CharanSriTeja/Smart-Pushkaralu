# 🌊 Smart Pushkaralu 2027

> **One unified access point for pilgrims visiting Godavari Pushkaralu ghats in Andhra Pradesh and Telangana.**

A full-stack mobile application built for low-end Android phones, weak cellular networks, and high-concurrency pilgrim environments. Supports **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English** with offline-first translation files, Firebase Phone OTP authentication, and token rotation.

---

## 🏗️ Architecture & Tech Stack

```
smart-pushkaralu/
├── backend/               # Node.js + Express + TypeScript (Strict)
│   ├── src/
│   │   ├── config/        # Validated environment variables (Zod)
│   │   ├── db/            # PostgreSQL connection pool (pg) & migration runner
│   │   ├── middleware/    # Auth guards, RBAC, Rate-limiting & Secure logger
│   │   ├── routes/v1/     # /health, /auth/firebase, /auth/refresh, /me
│   │   └── services/      # Firebase Admin SDK & JWT token management
│   └── tests/             # Automated test suite (Vitest + Supertest)
│
└── mobile/                # Expo (React Native) + TypeScript + Expo Router
    ├── src/
    │   ├── app/           # File-based navigation ((auth), (app), root layout)
    │   ├── context/       # AuthContext (OTP & tokens) & LanguageContext
    │   ├── i18n/          # Fixed translation files (en.json, te.json, hi.json)
    │   ├── services/      # Axios/Fetch API client with auto 401 token refresh
    │   └── utils/         # Indian phone validation & 30s resend timer logic
    └── tests/             # Automated mobile test suite (Vitest)
```

- **Frontend**: Expo 54+ (React Native 0.88), TypeScript, Expo Router (file-based routing), React Native Firebase, Expo SecureStore, Expo Localization.
- **Backend**: Node.js v22+, Express 5, TypeScript (strict), `tsx`, PostgreSQL (`pg` connection pool with SSL/Neon support), Zod, JSON Web Tokens.
- **Database**: PostgreSQL (tested and live on Neon Serverless Postgres).

---

## 📋 Prerequisites

Before running the app, ensure your machine has:
1. **Node.js**: v20.x or v22.x LTS (`node -v`)
2. **npm**: v10.x+ (`npm -v`)
3. **PostgreSQL Database**: Either a local PostgreSQL instance or a free cloud database on [Neon.tech](https://neon.tech).
4. *(Optional for Android native dev)*: Android Studio with Android SDK and an emulator, or an EAS account.

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone <repo-url>
cd smart-pushkaralu
```

---

### Step 2: Backend Setup (`backend/`)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and update the values:
   ```ini
   PORT=4000
   NODE_ENV=development

   # PostgreSQL / Neon Connection String
   # NOTE: If using Neon, do NOT include channel_binding=require
   DATABASE_URL=postgresql://neondb_owner:<your-password>@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

   # JWT signing key (minimum 16 characters)
   JWT_SECRET=smart-pushkaralu-super-secret-jwt-key-2027

   # Optional for production: Path to Firebase Admin service account key JSON
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

   # Comma-separated list of admin phone numbers
   ADMIN_PHONES=+919876543210,+919999999999
   ```

4. **Run Database Migrations**:
   Applies `users`, `refresh_tokens`, and `admins` tables to your database:
   ```bash
   npm run migrate
   ```
   *Expected output*: `[Migrations] Applied 001_initial_auth.sql successfully.`

5. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   The backend will be live at `http://localhost:4000`. You can verify by opening `http://localhost:4000/v1/health` in your browser.

6. **Run Backend Tests** (in a separate terminal):
   ```bash
   npm test
   ```
   *Runs 10 automated tests covering Firebase token verification, refresh token rotation, expired token rejection, admin allowlist, and account deletion.*

---

### Step 3: Mobile App Setup (`mobile/`)

1. **Navigate to the mobile directory**:
   ```bash
   cd ../mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   In `mobile/.env`:
   ```ini
   # For Web browser preview (Chrome / Edge):
   EXPO_PUBLIC_API_URL=http://localhost:4000

   # For Android Emulator:
   # EXPO_PUBLIC_API_URL=http://10.0.2.2:4000

   # For Physical Android Phone (connected to the same Wi-Fi):
   # EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
   ```
   *(Note: The app also has smart auto-detection: it automatically picks `localhost:4000` on Web and `10.0.2.2:4000` on Android emulator).*

4. **Run Mobile Unit Tests**:
   ```bash
   npm test
   ```
   *Runs 12 automated unit tests covering Indian mobile phone number validation, 30s OTP cooldown timer math, and i18n translation fallback.*

5. **Run the App**:

   #### Option A: Instant Web Preview (Fastest for testing UI and API)
   ```bash
   npm run web
   ```
   or:
   ```bash
   npx expo start --web
   ```
   Opens `http://localhost:8081` in your browser.

   #### Option B: Android Development Build (For Real Native Firebase SMS)
   Because `@react-native-firebase/auth` uses Google Play Services native C++ and Java bridges, native phone verification requires a development build rather than basic Expo Go:
   ```bash
   # Run directly on a connected Android phone or emulator:
   npx expo run:android

   # Or build an Android APK via EAS:
   eas build --profile development --platform android
   ```

---

## 📱 Testing the Login Flow

### 1. Landing Screen
- Choose your preferred language: **తెలుగు (Telugu)**, **हिन्दी (Hindi)**, or **English**. Notice the UI changes instantly without network delay.
- Tap **Continue with mobile number** to log in, or tap **Continue as guest** to browse ghat advisories without an account.

### 2. Mobile Phone Number Screen
- Default prefix is `+91`.
- Enter any valid 10-digit Indian mobile number (e.g., `9876543210`).
- Tap **Send OTP** / **OTP పంపండి**.

### 3. OTP Verification Screen
- **Standard Verification Code**: Enter **`123456`**.
  - Automatically verifies as soon as the 6th digit is typed.
  - Automatically exchanges tokens with the backend, stores the 15-minute access token in memory, and persists the 30-day refresh token in `SecureStore`.
- **Test Error Cases**:
  - Enter `000000` to test the localized **"Incorrect code"** message.
  - Enter `999999` to test the localized **"Expired code"** message.
  - Wait for the 30-second cooldown timer before requesting **Resend OTP**.

### 4. Pilgrim Registration Screen (New Users)
- Shown only for first-time phone numbers.
- Enter your optional pilgrim name (e.g., `Ramesh Sharma`).
- Check the advisory consent checkbox and tap **Privacy Policy** to view the modal terms.
- Tap **Complete Registration** to navigate to the Home dashboard.

### 5. Home Screen
- Displays the authenticated pilgrim details: Name, masked phone number, language preference, and active consent version.
- If your phone is in `ADMIN_PHONES`, a red **ADMIN** coordinator badge will be shown.
- Tap **Log Out** to revoke the refresh token and return to the landing screen.
- Tap **Delete Account** to permanently remove your user record and tokens.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | HTTP server port | `4000` |
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection pool URL (Neon or local) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Yes | Secret used for signing 15-min access tokens (min 16 chars) | `your-32-char-secret-key-here` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | No | Path to Firebase service account JSON key | `./firebase-service-account.json` |
| `ADMIN_PHONES` | No | Comma-separated E.164 phone numbers with admin access | `+919876543210,+919999999999` |

### Mobile (`mobile/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | No | Backend API base URL (defaults to auto-detection) | `http://localhost:4000` (Web) / `http://10.0.2.2:4000` (Android) |

---

## 🛠️ Common Troubleshooting

### 1. Neon Database Connection Terminated
- **Cause**: Neon connection strings copied from the dashboard sometimes contain `&channel_binding=require`. Node.js `pg` driver does not support SCRAM channel binding.
- **Solution**: The backend `src/db/index.ts` automatically sanitizes this, but ensure your `DATABASE_URL` does not include `channel_binding=require`.

### 2. "Network request failed" on Mobile Web
- **Cause**: On web browsers, the frontend cannot connect to `10.0.2.2` (which only exists inside an Android emulator).
- **Solution**: Ensure your backend is running (`npm run dev` in `backend/`) and that `EXPO_PUBLIC_API_URL=http://localhost:4000` is used for Web testing.

### 3. Firebase Test Numbers for Android Device / EAS
To test real SMS verification on an Android device without consuming SMS credits:
1. Open [Firebase Console](https://console.firebase.google.com/) -> Select project `gen-lang-client-0031906066`.
2. Go to **Authentication** -> **Sign-in method** -> **Phone**.
3. Under **Phone numbers for testing**, add:
   - Phone: `+91 99999 99999`
   - Verification Code: `123456`

---

## 🔒 Security Best Practices
- **No Secrets in Git**: `.env` and `firebase-service-account*.json` are added to `.gitignore`.
- **Phone Masking**: All server logs and requests automatically mask phone numbers (`+91 ******3210`).
- **Token Redaction**: JWT tokens and OTP codes are redacted from server console logs.
- **Token Rotation**: Refresh tokens are stored only as SHA-256 hashes and revoked on each use.

