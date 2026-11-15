import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { Button } from './Button';
import { useLanguage } from '../context/LanguageContext';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryTitle?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load the requested information. Please check your connection and try again.',
  onRetry,
  retryTitle = 'Retry',
  style,
}) => {
  const { fontFamily, fontFamilyBold } = useLanguage();

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[styles.title, { fontFamily: fontFamilyBold }]}
      >
        {title}
      </Text>
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[styles.message, { fontFamily }]}
      >
        {message}
      </Text>
      {onRetry ? (
        <Button
          title={retryTitle}
          onPress={onRetry}
          variant="primary"
          size="sm"
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.lg,
  },
  icon: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.lineHeights.caption,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  retryBtn: {
    minWidth: 140,
  },
});

