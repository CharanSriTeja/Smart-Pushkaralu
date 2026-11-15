import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { getApps, initializeApp, getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  signOut,
  getIdToken,
  type ConfirmationResult,
} from '@react-native-firebase/auth';
import {
  apiRequest,
  setInMemoryAccessToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  getCachedUser,
  setCachedUser,
  setLogoutHandler,
} from '../services/api';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  language: string;
  status: string;
  consentVersion: string | null;
  consentAt: string | null;
  isAdmin: boolean;
}

export interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  isNewUser: boolean;
  pendingPhone: string | null;
  confirmation: ConfirmationResult | null;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<{ isNewUser: boolean }>;
  completeRegistration: (name: string, consentVersion: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setPendingPhone: (phone: string | null) => void;
}

const firebaseConfig = {
  apiKey: 'AIzaSyDSJTV9dNXgYCXxkTYxkKeRgqgMraLeEVI',
  appId: '1:5534741753:android:96a7972c062f1eb8211e28',
  projectId: 'gen-lang-client-0031906066',
  storageBucket: 'gen-lang-client-0031906066.firebasestorage.app',
  messagingSenderId: '5534741753',
};

export async function ensureFirebaseApp() {
  if (getApps().length === 0) {
    try {
      await initializeApp(firebaseConfig);
    } catch (err: any) {
      console.warn('[Firebase] App initialization notice:', err?.message);
    }
  }
}

const PENDING_PHONE_KEY = 'sp_pending_phone';

// Module-level fallback state for Fast Refresh resilience
let modulePendingPhone: string | null = null;
let moduleConfirmation: any = null;

function createWebConfirmation(phoneNumber: string) {
  return {
    confirm: async (code: string) => {
      if (code === '000000') {
        const error: any = new Error('Invalid verification code');
        error.code = 'auth/invalid-verification-code';
        throw error;
      }
      if (code === '999999') {
        const error: any = new Error('Verification code expired');
        error.code = 'auth/code-expired';
        throw error;
      }
      return {
        user: {
          uid: 'web-user-' + phoneNumber.replace(/\D/g, ''),
          phoneNumber,
          getIdToken: async () => `test-id-token:${phoneNumber}`,
        },
      };
    },
  };
}

// Fallback implementation so useAuth() never throws during Fast Refresh or hot reload
export const defaultAuthContext: AuthContextType = {
  status: 'guest',
  user: null,
  isNewUser: false,
  pendingPhone: null,
  confirmation: null,
  setPendingPhone: (phone: string | null) => {
    modulePendingPhone = phone;
  },
  sendOtp: async (phoneNumber: string) => {
    modulePendingPhone = phoneNumber;
    if (Platform.OS === 'web') {
      moduleConfirmation = createWebConfirmation(phoneNumber);
      return;
    }
    await ensureFirebaseApp();
    const authInstance = getAuth();
    moduleConfirmation = await signInWithPhoneNumber(authInstance, phoneNumber);
  },
  verifyOtp: async (code: string) => {
    let confirmation = moduleConfirmation;
    if (!confirmation && Platform.OS === 'web') {
      const phone = modulePendingPhone || '+919876543210';
      confirmation = createWebConfirmation(phone);
    }
    if (!confirmation) {
      const err: any = new Error('No active verification session. Please request OTP again.');
      err.code = 'auth/session-expired';
      throw err;
    }
    const userCredential = await confirmation.confirm(code);
    const idToken = await getIdToken(userCredential.user);
    const authData = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: UserProfile;
      isNewUser: boolean;
    }>('/v1/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    });
    setInMemoryAccessToken(authData.accessToken);
    await setStoredRefreshToken(authData.refreshToken);
    await setCachedUser(authData.user);
    return { isNewUser: authData.isNewUser };
  },
  completeRegistration: async (name: string, consentVersion: string) => {
    await apiRequest('/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: name.trim() || undefined, consentVersion }),
    });
  },
  continueAsGuest: () => {},
  logout: async () => {
    setInMemoryAccessToken(null);
    await setStoredRefreshToken(null);
    await setCachedUser(null);
  },
  deleteAccount: async () => {
    await apiRequest('/v1/me', { method: 'DELETE' }).catch(() => {});
  },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [pendingPhone, setPendingPhoneState] = useState<string | null>(modulePendingPhone);
  const [confirmation, setConfirmationState] = useState<ConfirmationResult | null>(moduleConfirmation);

  const setPendingPhone = (phone: string | null) => {
    modulePendingPhone = phone;
    setPendingPhoneState(phone);
    if (phone) {
      storage.setItem(PENDING_PHONE_KEY, phone).catch(() => {});
    } else {
      storage.deleteItem(PENDING_PHONE_KEY).catch(() => {});
    }
  };

  const setConfirmation = (conf: any) => {
    moduleConfirmation = conf;
    setConfirmationState(conf);
  };

  const handleLogoutCleanup = useCallback(async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (refreshToken) {
        await apiRequest('/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuth: true,
        }).catch(() => {});
      }
    } catch {}

    try {
      if (Platform.OS !== 'web' && getApps().length > 0) {
        const authInstance = getAuth();
        await signOut(authInstance);
      }
    } catch {}

    setInMemoryAccessToken(null);
    await setStoredRefreshToken(null);
    await setCachedUser(null);
    setUser(null);
    setIsNewUser(false);
    setConfirmation(null);
    setPendingPhone(null);
    setStatus('guest');
  }, []);

  // Register logout handler for 401 token refresh failures
  useEffect(() => {
    setLogoutHandler(() => {
      handleLogoutCleanup();
    });
  }, [handleLogoutCleanup]);

  // Attempt auto-login on startup & ensure Firebase initialization
  useEffect(() => {
    async function restoreSession() {
      await ensureFirebaseApp();

      // Restore pending phone if saved
      try {
        const savedPhone = await storage.getItem(PENDING_PHONE_KEY);
        if (savedPhone && !pendingPhone) {
          setPendingPhone(savedPhone);
          if (Platform.OS === 'web' && !confirmation) {
            setConfirmation(createWebConfirmation(savedPhone));
          }
        }
      } catch {}

      try {
        const storedRefreshToken = await getStoredRefreshToken();
        if (!storedRefreshToken) {
          setStatus('guest');
          return;
        }

        // Try to obtain fresh access token
        const refreshRes = await apiRequest<{ accessToken: string; refreshToken?: string }>(
          '/v1/auth/refresh',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
            skipAuth: true,
          }
        );

        if (refreshRes.accessToken) {
          setInMemoryAccessToken(refreshRes.accessToken);
          if (refreshRes.refreshToken) {
            await setStoredRefreshToken(refreshRes.refreshToken);
          }

          // Fetch fresh user profile
          const userRes = await apiRequest<{ user: UserProfile }>('/v1/me');
          setUser(userRes.user);
          await setCachedUser(userRes.user);
          setStatus('authenticated');
          return;
        }
      } catch (err) {
        console.warn('[Auth] Session restoration notice:', err);
      }

      // If refresh failed, check if we have offline cached user
      const cached = await getCachedUser();
      if (cached) {
        setUser(cached);
      }
      setStatus('guest');
    }

    restoreSession();
  }, []);

  const sendOtp = async (phoneNumber: string) => {
    setPendingPhone(phoneNumber);

    if (Platform.OS === 'web') {
      console.log(
        `[Web Dev] Simulating OTP send for ${phoneNumber}.\n` +
          `• Enter '123456' to successfully verify.\n` +
          `• Enter '000000' to test wrong code error.\n` +
          `• Enter '999999' to test expired code error.`
      );
      const webConfirmation = createWebConfirmation(phoneNumber);
      setConfirmation(webConfirmation);
      return;
    }

    // Native Android / iOS
    await ensureFirebaseApp();
    const authInstance = getAuth();
    const confirmResult = await signInWithPhoneNumber(authInstance, phoneNumber);
    setConfirmation(confirmResult);
  };

  const verifyOtp = async (code: string): Promise<{ isNewUser: boolean }> => {
    let activeConfirmation = confirmation || moduleConfirmation;

    // Auto-recover session on Web if page was refreshed
    if (!activeConfirmation && Platform.OS === 'web') {
      const phone = pendingPhone || modulePendingPhone || '+919876543210';
      activeConfirmation = createWebConfirmation(phone);
      setConfirmation(activeConfirmation);
    }

    if (!activeConfirmation) {
      const err: any = new Error('No active verification session. Please request OTP again.');
      err.code = 'auth/session-expired';
      throw err;
    }

    const userCredential = await activeConfirmation.confirm(code);
    if (!userCredential || !userCredential.user) {
      throw new Error('Failed to verify OTP with Firebase.');
    }

    const idToken = await getIdToken(userCredential.user);

    // Exchange Firebase ID token with our backend
    const authData = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: UserProfile;
      isNewUser: boolean;
    }>('/v1/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    });

    setInMemoryAccessToken(authData.accessToken);
    await setStoredRefreshToken(authData.refreshToken);
    await setCachedUser(authData.user);
    setUser(authData.user);
    setIsNewUser(authData.isNewUser);

    if (!authData.isNewUser) {
      setStatus('authenticated');
    }

    return { isNewUser: authData.isNewUser };
  };

  const completeRegistration = async (name: string, consentVersion: string) => {
    const updated = await apiRequest<{ user: UserProfile }>('/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name: name.trim() || undefined,
        consentVersion,
      }),
    });

    setUser(updated.user);
    await setCachedUser(updated.user);
    setIsNewUser(false);
    setStatus('authenticated');
  };

  const continueAsGuest = () => {
    setStatus('guest');
  };

  const logout = async () => {
    await handleLogoutCleanup();
  };

  const deleteAccount = async () => {
    try {
      await apiRequest('/v1/me', { method: 'DELETE' });
    } finally {
      await handleLogoutCleanup();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isNewUser,
        pendingPhone,
        confirmation,
        sendOtp,
        verifyOtp,
        completeRegistration,
        continueAsGuest,
        logout,
        deleteAccount,
        setPendingPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context || typeof context.sendOtp !== 'function') {
    return defaultAuthContext;
  }
  return context;
};
