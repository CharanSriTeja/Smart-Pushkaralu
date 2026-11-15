import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing, touchTargets, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightAccessory,
  showChevron = false,
  onPress,
  style,
  disabled = false,
}) => {
  const { fontFamily, fontFamilyBold } = useLanguage();

  const content = (
    <>
      {leftIcon ? <View style={styles.leftIconSlot}>{leftIcon}</View> : null}
      <View style={styles.textContainer}>
        <Text
          maxFontSizeMultiplier={typography.maxScale}
          style={[styles.title, { fontFamily: fontFamilyBold }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={typography.maxScale}
            style={[styles.subtitle, { fontFamily }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ? <View style={styles.rightSlot}>{rightAccessory}</View> : null}
      {showChevron ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        style={[
          styles.container,
          disabled ? styles.disabled : null,
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    minHeight: touchTargets.minTouch, // 48dp minimum
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  disabled: {
    opacity: 0.5,
  },
  leftIconSlot: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightSlot: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});

