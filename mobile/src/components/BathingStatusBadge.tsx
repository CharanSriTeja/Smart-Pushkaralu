import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BathingStatus } from '../types/ghats';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  status: BathingStatus;
  size?: 'small' | 'medium';
}

export const BathingStatusBadge: React.FC<Props> = ({ status, size = 'medium' }) => {
  const { t } = useTranslation();
  const { fontFamily, fontFamilyBold } = useLanguage();

  const getStyleConfig = () => {
    switch (status) {
      case 'allowed':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
          icon: '🟢',
          label: t('ghats.bathing.allowed', 'Safe for Holy Bath'),
        };
      case 'restricted':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#B45309',
          icon: '🟡',
          label: t('ghats.bathing.restricted', 'Restricted / High Current'),
        };
      case 'closed':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
          icon: '🔴',
          label: t('ghats.bathing.closed', 'Strictly Closed'),
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          text: '#475569',
          icon: '⚪',
          label: t('ghats.bathing.unknown', 'Status Pending'),
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
      <Text style={[styles.icon, isSmall && styles.iconSmall]}>{config.icon}</Text>
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
  icon: {
    fontSize: 10,
  },
  iconSmall: {
    fontSize: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
});

