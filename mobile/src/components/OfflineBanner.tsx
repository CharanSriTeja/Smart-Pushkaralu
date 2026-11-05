import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { t } = useTranslation();
  const { fontFamily } = useLanguage();

  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={[styles.text, { fontFamily }]}>
        ⚠️ {t('common.offline_notice')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7', // Amber 100
    borderColor: '#F59E0B',     // Amber 500
    borderBottomWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#92400E', // Amber 800 - high contrast
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: '700',
    textAlign: 'center',
  },
});

