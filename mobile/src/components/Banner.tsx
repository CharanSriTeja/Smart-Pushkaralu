import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface BannerProps {
  message: string;
  variant?: 'info' | 'warning' | 'urgent';
  title?: string;
  actionTitle?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const Banner: React.FC<BannerProps> = ({
  message,
  variant = 'info',
  title,
  actionTitle,
  onAction,
  onDismiss,
  style,
}) => {
  const { fontFamily, fontFamilyBold } = useLanguage();

  const getVariantStyles = () => {
    switch (variant) {
      case 'urgent':
        return {
          bg: colors.dangerLight,
          border: colors.dangerBorder,
          text: colors.danger,
          icon: '🚨',
        };
      case 'warning':
        return {
          bg: colors.status.warningLight,
          border: colors.status.warningBorder,
          text: colors.status.warning,
          icon: '⚠️',
        };
      case 'info':
      default:
        return {
          bg: colors.primary50,
          border: colors.borderOrange,
          text: colors.primary700,
          icon: 'ℹ️',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        { backgroundColor: vStyles.bg, borderColor: vStyles.border },
        style,
      ]}
    >
      <Text style={styles.icon}>{vStyles.icon}</Text>
      <View style={styles.content}>
        {title ? (
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.title, { color: vStyles.text, fontFamily: fontFamilyBold }]}
          >
            {title}
          </Text>
        ) : null}
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.message, { color: colors.textPrimary, fontFamily }]}
        >
          {message}
        </Text>
        {actionTitle && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            accessibilityRole="button"
            style={styles.actionBtn}
          >
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[styles.actionText, { color: vStyles.text, fontFamily: fontFamilyBold }]}
            >
              {actionTitle} →
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
          style={styles.dismissBtn}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: typography.sizes.bodySm || 14,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: spacing.xs,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: typography.sizes.bodySm || 14,
    fontWeight: '700',
  },
  dismissBtn: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
});

