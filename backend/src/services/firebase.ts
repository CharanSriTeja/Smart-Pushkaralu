import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { env } from '../config/env.js';

let initialized = false;

function parseServiceAccountJson(jsonString: string): any {
  const trimmed = jsonString.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  // Try base64 decoding
  const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

export function initFirebase(): App | null {
  if (initialized || getApps().length > 0) {
    return getApp();
  }

  try {
    // 1. Check for raw or base64 JSON string in environment variable
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = parseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      initialized = true;
      console.log('[Firebase] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON credential.');
      return app;
    }

    // 2. Check for service account JSON file path
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH), 'utf-8')
      );
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      initialized = true;
      console.log('[Firebase] Initialized with service account file.');
      return app;
    }

    // 3. Check for application default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const app = initializeApp({
        credential: applicationDefault(),
      });
      initialized = true;
      console.log('[Firebase] Initialized with application default credentials.');
      return app;
    }

    if (env.NODE_ENV !== 'test') {
      console.warn('[Firebase] No service account specified. Initializing with default app for emulators/local dev.');
      const app = initializeApp();
      initialized = true;
      return app;
    }
  } catch (error: any) {
    console.warn('[Firebase] Initialization notice:', error.message);
  }

  return null;
}

// Function to verify Firebase ID token
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  const app = initFirebase();
  const auth = app ? getAuth(app) : getAuth();
  return auth.verifyIdToken(idToken);
}

export { getAuth };
