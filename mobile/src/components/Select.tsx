import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';
import { BottomSheet } from './BottomSheet';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface SelectProps<T = string> {
  label?: string;
  options: SelectOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  error?: string;
  disabled?: boolean;
}

export function Select<T = string>({
  label,
  options,
  value,
  onSelect,
  placeholder = 'Select an option',
  containerStyle,
  error,
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const { fontFamily, fontFamilyBold } = useLanguage();

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: T) => {
    onSelect(val);
    setIsOpen(false);
  };

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

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="combobox"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: isOpen, disabled }}
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
          disabled ? styles.disabled : null,
        ]}
      >
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[
            styles.triggerText,
            !selectedOption ? styles.placeholderText : null,
            { fontFamily },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {error ? (
        <Text maxFontSizeMultiplier={typography.maxScale} style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || placeholder}
      >
        <ScrollView style={styles.optionsList}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => handleSelect(opt.value)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.optionRow,
                  isSelected ? styles.selectedOptionRow : null,
                ]}
              >
                {opt.icon ? <View style={styles.optionIcon}>{opt.icon}</View> : null}
                <View style={styles.optionTextContainer}>
                  <Text
                    maxFontSizeMultiplier={typography.maxScale}
                    style={[
                      styles.optionLabel,
                      isSelected ? styles.selectedOptionLabel : null,
                      { fontFamily: isSelected ? fontFamilyBold : fontFamily },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.subtitle ? (
                    <Text
                      maxFontSizeMultiplier={typography.maxScale}
                      style={styles.optionSubtitle}
                    >
                      {opt.subtitle}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

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
  trigger: {
    minHeight: touchTargets.minTouch, // 48dp minimum
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  optionsList: {
    maxHeight: 360,
  },
  optionRow: {
    minHeight: touchTargets.minTouch, // 48dp
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginVertical: 2,
  },
  selectedOptionRow: {
    backgroundColor: colors.primary50,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  selectedOptionLabel: {
    color: colors.primary700,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary700,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});

