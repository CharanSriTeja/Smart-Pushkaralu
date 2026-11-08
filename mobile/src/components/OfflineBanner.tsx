import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, typography } from '../theme/tokens';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { t } = useTranslation();
  const { fontFamilyBold } = useLanguage();

  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[styles.text, { fontFamily: fontFamilyBold }]}
      >
        ⚠️ {t('common.offline_notice', 'Offline Mode: Showing cached information')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.status.warningLight,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.status.warningBorder,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.status.warning, // #92400E
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
