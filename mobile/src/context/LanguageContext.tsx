import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { NotoSansTelugu_400Regular, NotoSansTelugu_700Bold } from '@expo-google-fonts/noto-sans-telugu';
import { NotoSansDevanagari_400Regular, NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari';
import i18n, { SupportedLanguage, getSavedLanguage, saveLanguage } from '../i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLanguageReady: boolean;
  fontFamily: string;
  fontFamilyBold: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: async () => {},
  isLanguageReady: false,
  fontFamily: 'System',
  fontFamilyBold: 'System',
});

// Cache loaded fonts so we only load on demand
const loadedFontMap = new Set<string>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [fontFamily, setFontFamily] = useState<string>('System');
  const [fontFamilyBold, setFontFamilyBold] = useState<string>('System');

  // Load language-specific fonts on demand
  const loadFontForLanguage = async (lang: SupportedLanguage) => {
    try {
      if (lang === 'te') {
        if (!loadedFontMap.has('te')) {
          await Font.loadAsync({
            'NotoSansTelugu-Regular': NotoSansTelugu_400Regular,
            'NotoSansTelugu-Bold': NotoSansTelugu_700Bold,
          });
          loadedFontMap.add('te');
        }
        setFontFamily('NotoSansTelugu-Regular');
        setFontFamilyBold('NotoSansTelugu-Bold');
      } else if (lang === 'hi') {
        if (!loadedFontMap.has('hi')) {
          await Font.loadAsync({
            'NotoSansDevanagari-Regular': NotoSansDevanagari_400Regular,
            'NotoSansDevanagari-Bold': NotoSansDevanagari_700Bold,
          });
          loadedFontMap.add('hi');
        }
        setFontFamily('NotoSansDevanagari-Regular');
        setFontFamilyBold('NotoSansDevanagari-Bold');
      } else {
        // English / default uses system font for fast rendering on budget devices
        setFontFamily('System');
        setFontFamilyBold('System');
      }
    } catch (err) {
      console.warn('[Fonts] Failed to load on-demand font for language:', lang, err);
      // Fallback to system font if font loading fails on low-end device
      setFontFamily('System');
      setFontFamilyBold('System');
    }
  };

  useEffect(() => {
    async function init() {
      const initialLang = await getSavedLanguage();
      setLanguageState(initialLang);
      await i18n.changeLanguage(initialLang);
      await loadFontForLanguage(initialLang);
      setIsLanguageReady(true);
    }
    init();
  }, []);

  const changeLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    await i18n.changeLanguage(newLang);
    await saveLanguage(newLang);
    await loadFontForLanguage(newLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        isLanguageReady,
        fontFamily,
        fontFamilyBold,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

