import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onAction,
  style,
}) => {
  const { fontFamilyBold } = useLanguage();

  return (
    <View style={[styles.header, style]}>
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[styles.title, { fontFamily: fontFamilyBold }]}
      >
        {title}
      </Text>
      {actionText && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          style={styles.actionBtn}
        >
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.actionText, { fontFamily: fontFamilyBold }]}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  actionText: {
    fontSize: typography.sizes.caption,
    color: colors.primary700,
    fontWeight: '700',
  },
});

