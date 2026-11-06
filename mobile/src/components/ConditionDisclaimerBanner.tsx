import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  compact?: boolean;
}

export const ConditionDisclaimerBanner: React.FC<Props> = ({ compact = false }) => {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Text style={[styles.icon, compact && styles.compactIcon]}>⚠️</Text>
      <View style={styles.textContainer}>
        {!compact && (
          <Text style={[styles.heading, { fontFamily: fontFamilyBold }]}>
            {t('landing.disclaimer', 'Pushkaralu Safety Advisory')}
          </Text>
        )}
        <Text style={[styles.text, { fontFamily }, compact && styles.compactText]}>
          {t(
            'ghats.disclaimer_banner',
            '⚠️ Disclaimer: River flow, bathing safety, water levels, and crowd densities can change suddenly during Godavari Pushkaralu. Always adhere to instructions from on-duty police and NDRF teams.'
          )}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 10,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  compactContainer: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
  },
  icon: {
    fontSize: 20,
    marginTop: 2,
  },
  compactIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },
  compactText: {
    fontSize: 12,
    lineHeight: 17,
  },
});

