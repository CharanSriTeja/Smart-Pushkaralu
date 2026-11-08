import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityProps,
} from 'react-native';
import { colors, spacing, radii, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface ButtonProps extends AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'default' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...accessibilityProps
}) => {
  const { fontFamilyBold } = useLanguage();

  const normalizedSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : size === 'default' ? 'md' : size;

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = { ...styles.base, ...styles[normalizedSize] };

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.primary50,
          borderWidth: 1.5,
          borderColor: colors.primary700,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.danger,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          ...base,
          backgroundColor: colors.primary700,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
      case 'ghost':
        return { color: colors.primary700, fontFamily: fontFamilyBold };
      case 'outline':
        return { color: colors.textPrimary, fontFamily: fontFamilyBold };
      case 'danger':
      case 'primary':
      default:
        return { color: colors.white, fontFamily: fontFamilyBold };
    }
  };

  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        getContainerStyle(),
        !isInteractive && styles.disabled,
        style,
      ]}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary700 : colors.white}
        />
      ) : (
        <>
          {icon}
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.text, getTextStyle(), textStyle]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargets.minTouch,
    minWidth: touchTargets.minTouch,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sm: {
    minHeight: touchTargets.minTouch,
    paddingHorizontal: spacing.md,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: touchTargets.primaryAction, // 56dp
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
