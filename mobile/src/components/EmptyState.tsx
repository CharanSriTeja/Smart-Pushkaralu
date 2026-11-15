import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { Button } from './Button';
import { useLanguage } from '../context/LanguageContext';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { fontFamily, fontFamilyBold } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[styles.title, { fontFamily: fontFamilyBold }]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.description, { fontFamily }]}
        >
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.button}
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
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.bodySm || 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.lineHeights.caption,
    marginBottom: spacing.md,
    maxWidth: 300,
  },
  button: {
    marginTop: spacing.sm,
  },
});
