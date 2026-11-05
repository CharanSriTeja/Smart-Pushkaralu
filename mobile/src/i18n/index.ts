import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import en from './en.json';
import te from './te.json';
import hi from './hi.json';

export type SupportedLanguage = 'en' | 'te' | 'hi';

export const LANGUAGE_STORAGE_KEY = 'user_preferred_language';

export const resources = {
  en: { translation: en },
  te: { translation: te },
  hi: { translation: hi },
} as const;

export function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const code = locales[0].languageCode?.toLowerCase();
      if (code === 'te') return 'te';
      if (code === 'hi') return 'hi';
    }
  } catch (err) {
    console.warn('[i18n] Failed to get device locale:', err);
  }
  return 'en';
}

export async function getSavedLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'te' || saved === 'hi') {
      return saved as SupportedLanguage;
    }
  } catch (err) {
    console.warn('[i18n] Could not read saved language:', err);
  }
  return detectDeviceLanguage();
}

export async function saveLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
  } catch (err) {
    console.warn('[i18n] Could not persist language:', err);
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default initially before async hydration
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;

