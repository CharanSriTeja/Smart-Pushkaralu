import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, radii, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  onClear?: () => void;
  showClear?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  value,
  onClear,
  showClear = false,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { fontFamily } = useLanguage();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.label, error ? styles.labelError : null]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}

        <TextInput
          value={value}
          maxFontSizeMultiplier={typography.maxScale}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { fontFamily },
            inputStyle,
          ]}
          {...rest}
        />

        {showClear && value && value.length > 0 ? (
          <TouchableOpacity
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}

        {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text maxFontSizeMultiplier={typography.maxScale} style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text maxFontSizeMultiplier={typography.maxScale} style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.danger,
  },
  inputContainer: {
    minHeight: touchTargets.minTouch, // 48dp minimum
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary700,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    minHeight: touchTargets.minTouch,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  iconSlot: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

