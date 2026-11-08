import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n';
import { colors, radii, spacing, touchTargets, typography } from '../theme/tokens';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export interface LanguageSwitcherProps {
  style?: ViewStyle;
  variant?: 'chips' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  variant = 'chips',
}) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      {LANGUAGE_OPTIONS.map((opt) => {
        const isActive = language === opt.code;

        return (
          <TouchableOpacity
            key={opt.code}
            onPress={() => changeLanguage(opt.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Switch language to ${opt.label}`}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.optionButton,
              variant === 'compact' && styles.compactButton,
              isActive && styles.activeButton,
            ]}
          >
            <Text
              maxFontSizeMultiplier={typography.maxScale}
              style={[
                styles.nativeText,
                isActive && styles.activeNativeText,
              ]}
            >
              {opt.nativeLabel}
            </Text>
            {variant === 'chips' && (
              <Text
                maxFontSizeMultiplier={typography.maxScale}
                style={[
                  styles.subText,
                  isActive && styles.activeSubText,
                ]}
              >
                {opt.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionButton: {
    minHeight: touchTargets.minTouch, // 48dp minimum touch target
    minWidth: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    minWidth: 64,
    paddingHorizontal: spacing.sm,
  },
  activeButton: {
    backgroundColor: colors.primary700,
    borderColor: colors.primary700,
  },
  nativeText: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeNativeText: {
    color: colors.white,
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  activeSubText: {
    color: colors.primary100,
  },
});
