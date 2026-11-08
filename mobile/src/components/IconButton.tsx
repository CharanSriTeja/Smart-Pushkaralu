import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  AccessibilityProps,
} from 'react-native';
import { colors, touchTargets, radii } from '../theme/tokens';

export interface IconButtonProps extends AccessibilityProps {
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel: string;
  variant?: 'default' | 'ghost' | 'primary' | 'danger';
  size?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = touchTargets.minTouch,
  disabled = false,
  loading = false,
  style,
  ...rest
}) => {
  const isInteractive = !disabled && !loading;

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary700 };
      case 'danger':
        return { backgroundColor: colors.danger };
      case 'default':
        return { backgroundColor: colors.primary50, borderWidth: 1, borderColor: colors.border };
      case 'ghost':
      default:
        return { backgroundColor: 'transparent' };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        { width: Math.max(size, touchTargets.minTouch), height: Math.max(size, touchTargets.minTouch) },
        getVariantStyle(),
        !isInteractive && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary700}
        />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minWidth: touchTargets.minTouch,
    minHeight: touchTargets.minTouch,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

