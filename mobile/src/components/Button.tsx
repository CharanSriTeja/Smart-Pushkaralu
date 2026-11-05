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
import { theme } from '../theme';
import { useLanguage } from '../context/LanguageContext';

export interface ButtonProps extends AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'default' | 'small' | 'large';
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
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...accessibilityProps
}) => {
  const { fontFamilyBold } = useLanguage();

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = { ...styles.base, ...styles[size] };

    switch (variant) {
      case 'secondary':
        return { ...base, backgroundColor: theme.colors.secondary };
      case 'danger':
        return { ...base, backgroundColor: theme.colors.danger };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { ...base, backgroundColor: theme.colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return { color: theme.colors.primary, fontFamily: fontFamilyBold };
      case 'ghost':
        return { color: theme.colors.primary, fontFamily: fontFamilyBold };
      case 'primary':
      case 'secondary':
      case 'danger':
      default:
        return { color: theme.colors.white, fontFamily: fontFamilyBold };
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
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touchTarget.minHeight, // 48dp minimum touch target
    minWidth: theme.touchTarget.minWidth,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  default: {
    height: 52,
  },
  small: {
    height: 48,
    paddingHorizontal: theme.spacing.sm,
  },
  large: {
    height: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});

