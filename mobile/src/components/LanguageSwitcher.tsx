import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n';
import { theme } from '../theme';

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
              style={[
                styles.nativeText,
                isActive && styles.activeNativeText,
              ]}
            >
              {opt.nativeLabel}
            </Text>
            {variant === 'chips' && (
              <Text
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
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  optionButton: {
    minHeight: theme.touchTarget.minHeight, // 48dp minimum touch target
    minWidth: 80,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    minWidth: 64,
    paddingHorizontal: theme.spacing.sm,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  nativeText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  activeNativeText: {
    color: theme.colors.white,
  },
  subText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activeSubText: {
    color: '#DCEBFC',
  },
});

