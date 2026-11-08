import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityProps,
} from 'react-native';
import { colors, spacing, radii, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface ChipProps extends AccessibilityProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  count?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  count,
  style,
  textStyle,
  disabled = false,
  ...accessibilityProps
}) => {
  const { fontFamilyBold, fontFamily } = useLanguage();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
        disabled && styles.disabled,
        style,
      ]}
      {...accessibilityProps}
    >
      {icon}
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.unselectedLabel,
          { fontFamily: selected ? fontFamilyBold : fontFamily },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {typeof count === 'number' && (
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[
            styles.count,
            selected ? styles.selectedCount : styles.unselectedCount,
          ]}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTargets.minTouch, // 48dp accessible touch target
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  unselectedChip: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary700,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: typography.sizes.bodySm || 14,
  },
  unselectedLabel: {
    color: colors.textPrimary,
  },
  selectedLabel: {
    color: colors.primary700,
    fontWeight: '700',
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginLeft: 2,
  },
  unselectedCount: {
    backgroundColor: colors.surfaceWarm,
    color: colors.textMuted,
  },
  selectedCount: {
    backgroundColor: colors.primary700,
    color: colors.white,
  },
});

