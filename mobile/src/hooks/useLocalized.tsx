import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { LocalizedText } from '../types';

export interface LocalizedResult {
  text: string;
  isFallback: boolean;
  activeLanguage: string;
}

/**
 * Hook to extract the appropriate language string from a LocalizedText JSONB field.
 * Flags isFallback=true when falling back to English from Telugu or Hindi.
 */
export function useLocalized(field: LocalizedText | null | undefined): LocalizedResult {
  const { language } = useLanguage();

  if (!field || typeof field !== 'object') {
    return { text: '', isFallback: false, activeLanguage: language };
  }

  if (language === 'te' && field.te && field.te.trim().length > 0) {
    return { text: field.te, isFallback: false, activeLanguage: 'te' };
  }

  if (language === 'hi' && field.hi && field.hi.trim().length > 0) {
    return { text: field.hi, isFallback: false, activeLanguage: 'hi' };
  }

  const enText = field.en || '';
  const isFallback = language !== 'en' && Boolean(enText);

  return {
    text: enText,
    isFallback,
    activeLanguage: language,
  };
}

/**
 * Reusable component that renders localized text and displays
 * a small "Not yet translated" label when falling back to English.
 */
export const LocalizedView: React.FC<{
  field: LocalizedText | null | undefined;
  style?: any;
  showBadge?: boolean;
}> = ({ field, style, showBadge = true }) => {
  const { text, isFallback } = useLocalized(field);

  return (
    <View style={styles.container}>
      <Text style={style}>{text}</Text>
      {isFallback && showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Not yet translated</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFB020',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B76E00',
  },
});

