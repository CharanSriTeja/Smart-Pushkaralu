import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, radii, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  containerStyle,
  autoFocus = false,
}) => {
  const { fontFamily } = useLanguage();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={typography.maxScale}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={autoFocus}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { fontFamily }]}
      />
      {value ? (
        <TouchableOpacity
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: touchTargets.minTouch, // 48dp
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: touchTargets.minTouch,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  clearText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
});

