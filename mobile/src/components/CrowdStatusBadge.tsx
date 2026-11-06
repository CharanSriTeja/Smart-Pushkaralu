import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrowdLevel } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  level: CrowdLevel;
  size?: 'small' | 'medium';
}

export const CrowdStatusBadge: React.FC<Props> = ({ level, size = 'medium' }) => {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const getStyleConfig = () => {
    switch (level) {
      case 'low':
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#15803D',
          label: t('ghats.crowd.low', 'Low Crowd (<30%)'),
        };
      case 'medium':
        return {
          bg: '#FEFCE8',
          border: '#FEF08A',
          text: '#A16207',
          label: t('ghats.crowd.medium', 'Moderate Flow (30-60%)'),
        };
      case 'high':
        return {
          bg: '#FFF7ED',
          border: '#FED7AA',
          text: '#C2410C',
          label: t('ghats.crowd.high', 'Heavy Rush (60-85%)'),
        };
      case 'very_high':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#DC2626',
          label: t('ghats.crowd.very_high', 'Peak Rush (>85%)'),
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          text: '#64748B',
          label: t('ghats.crowd.unknown', 'Awaiting Updates'),
        };
    }
  };

  const config = getStyleConfig();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={styles.densityIcon}>👥</Text>
      <Text
        style={[
          styles.text,
          { color: config.text, fontFamily: fontFamilyBold },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  densityIcon: {
    fontSize: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
});

