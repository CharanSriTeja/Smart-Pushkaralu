# 🌊 Smart Pushkaralu 2027

> **One unified access point for pilgrims visiting Godavari Pushkaralu ghats in Andhra Pradesh and Telangana.**

A full-stack platform built for low-end Android phones, weak cellular networks, and high-concurrency pilgrim environments. Supports **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English** with offline-first translation files, Firebase Phone OTP authentication, token rotation, and an administrative command portal.

---

## 🏗️ Architecture & Tech Stack

```
smart-pushkaralu/
├── backend/               # Node.js + Express 5 + TypeScript (Strict)
│   ├── src/
│   │   ├── config/        # Validated environment variables (Zod)
│   │   ├── db/            # PostgreSQL connection pool (pg) & migrations (001_initial_auth, 002_platform_support)
│   │   ├── lib/           # Pino logger (redacted), i18n helpers, audit helper, usage helper, FCM push, ICCC stubs
│   │   ├── middleware/    # Auth guards, requireAdmin, can('perm') RBAC, rate-limiting & error handler
│   │   ├── routes/v1/     # /health, /auth, /settings, /admin/audit-logs, /admin/settings, /admin/usage, /devices, /integrations/iccc
│   │   └── services/      # Firebase Admin SDK & JWT token management
│   └── tests/             # 27 automated tests (Vitest + Supertest)
│
├── mobile/                # Expo 54+ (React Native 0.88) + TypeScript + Expo Router
│   ├── src/
│   │   ├── app/           # Expo Router tabs (Home, Ghats, News, Seva, More) + Persistent Floating SOS
│   │   ├── components/    # Button (48dp+), Card, Screen, EmptyState, LanguageSwitcher, OfflineBanner, ErrorBoundary
│   │   ├── context/       # AuthContext (tokens & OTP) & LanguageContext (on-demand font loading)
│   │   ├── hooks/         # useLocalized (fallback flag), useNetworkStatus
│   │   ├── i18n/          # Namespaced strings (common, auth, ghats, sos, issues, news, seva, planner, transport, settings)
│   │   ├── services/      # Push notifications (expo-notifications), Sentry, and API token storage
│   │   ├── storage/       # Offline SQLite / Memory cache with TTL & fetchWithCache
│   │   └── theme/         # High-contrast color palette, 48dp minimum touch targets
│   └── tests/             # 20 automated unit tests (Vitest)
│
└── admin/                 # Admin Command Web Portal (Vite + React 18 + TypeScript)
    ├── src/
    │   ├── components/    # Layout (permission-aware navigation), TranslatableInput (EN/TE/HI), OldNewDiffViewer
    │   ├── context/       # AuthContext with Dev Mock Roles (super_admin, editor, viewer, guest) & JWT token support
    │   ├── pages/         # Dashboard, SOS Command Live, Ghats, News, Seva, Issues, Audit Trail, Settings, API Quota
    │   └── services/      # PushkaraluSocketClient (live WebSocket & mock stream) & API client
    └── tests/             # 8 automated tests (Vitest + Testing Library)
```

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
   Open `backend/.env` and update values:
   ```ini
   PORT=4000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   JWT_SECRET=smart-pushkaralu-super-secret-jwt-key-2027
   ADMIN_PHONES=+919876543210,+919999999999
   CORS_ORIGINS=http://localhost:5173,http://localhost:8081,http://localhost:3000
   ICCC_ENABLED=false
   MONTHLY_API_FREE_QUOTA=10000
   ```

4. **Run Database Migrations**:
   Applies `001_initial_auth.sql` and `002_platform_support.sql` (RBAC tables, audit logs, device tokens, settings):
   ```bash
   npm run migrate
   ```

5. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   Live at `http://localhost:4000`. Test via browser: `http://localhost:4000/v1/health` (checks DB connection).

6. **Run Backend Tests** (27 passing tests):
   ```bash
   npm test
   ```

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
   ```bash
   cp .env.example .env
   ```
   In `mobile/.env`:
   ```ini
   # For Web browser preview:
   EXPO_PUBLIC_API_URL=http://localhost:4000

   # For Android Emulator:
   # EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
   ```

4. **Run Mobile Unit Tests** (20 passing tests):
   ```bash
   npm test
   ```

5. **Run the Mobile App**:
   - **Web Browser Preview**:
     ```bash
     npm run web
     ```
     Opens `http://localhost:8081`.
   - **Android Emulator / Device**:
     ```bash
     npm run android
     ```

---

### Step 4: Admin Web Portal Setup (`admin/`)

1. **Navigate to the admin directory**:
   ```bash
   cd ../admin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   In `admin/.env`:
   ```ini
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   VITE_MOCK_MODE=true
   ```

4. **Run Admin Tests** (8 passing tests):
   ```bash
   npm test
   ```

5. **Start the Admin Web App**:
   ```bash
   npm run dev
   ```
   Opens `http://localhost:5173`.
   - **Role Switcher**: Switch between `Super Admin` (full access), `Editor` (Ghats, News, Seva), `Viewer` (Audit Read), and `Guest`.
   - **Live SOS Command**: Real-time simulated emergency incident stream via Socket.io wrapper.
   - **Audit Trail**: Inspect old vs new JSON diffs for admin actions.
   - **Translatable Fields**: Test side-by-side / tabs translation inputs with Telugu and Hindi support.

---

## 🧪 Automated Test Summary

| Package | Test File | Test Count | Status |
| :--- | :--- | :---: | :---: |
| `backend/` | `tests/auth.test.ts` & `tests/platform.test.ts` | **27** | ✅ All Passed |
| `mobile/` | `tests/mobile.test.ts` | **20** | ✅ All Passed |
| `admin/` | `tests/admin.test.tsx` | **8** | ✅ All Passed |
| **Total** | | **55** | ✅ **100% Passing** |

---

## 🔒 Security Best Practices
- **No Secrets in Git**: `.env` and `firebase-service-account*.json` are added to `.gitignore`.
- **Phone Masking**: All server logs and requests automatically mask phone numbers (`+91 ******3210`).
- **Token Redaction**: JWT tokens and OTP codes are redacted from server console logs.
- **RBAC**: Endpoints protected by `can('permission.name')`. Super Admin permissions verified via database and `ADMIN_PHONES`.
- **Audit Logging**: Every settings modification and administrative action creates an immutable record in `audit_logs`.
