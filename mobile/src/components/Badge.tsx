import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange';
  icon?: string | React.ReactNode;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
  textStyle,
}) => {
  const { fontFamilyBold } = useLanguage();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.status.successLight,
          border: colors.status.successBorder,
          text: colors.status.success,
        };
      case 'warning':
        return {
          bg: colors.status.warningLight,
          border: colors.status.warningBorder,
          text: colors.status.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerLight,
          border: colors.dangerBorder,
          text: colors.danger,
        };
      case 'orange':
        return {
          bg: colors.primary50,
          border: colors.borderOrange,
          text: colors.primary700,
        };
      case 'info':
        return {
          bg: colors.primary50,
          border: colors.borderOrange,
          text: colors.primary700,
        };
      case 'neutral':
      default:
        return {
          bg: colors.status.mutedLight,
          border: colors.status.mutedBorder,
          text: colors.status.muted,
        };
    }
  };

  const vStyles = getVariantStyles();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSmall ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: vStyles.bg, borderColor: vStyles.border },
        style,
      ]}
    >
      {typeof icon === 'string' ? (
        <Text style={[styles.iconText, isSmall && styles.iconTextSm]}>{icon}</Text>
      ) : (
        icon
      )}
      <Text
        maxFontSizeMultiplier={typography.maxScale}
        style={[
          styles.label,
          isSmall ? styles.labelSm : styles.labelMd,
          { color: vStyles.text, fontFamily: fontFamilyBold },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export const CrowdBadge: React.FC<{ crowd: 'low' | 'moderate' | 'high' | 'surge' | string; label?: string; size?: 'sm' | 'md' }> = ({
  crowd,
  label,
  size = 'md',
}) => {
  switch (crowd?.toLowerCase()) {
    case 'low':
      return <Badge label={label || 'Low Crowd'} variant="success" icon="🟢" size={size} />;
    case 'moderate':
    case 'medium':
      return <Badge label={label || 'Moderate Crowd'} variant="warning" icon="🟡" size={size} />;
    case 'high':
    case 'surge':
      return <Badge label={label || 'High Crowd'} variant="danger" icon="🔴" size={size} />;
    default:
      return <Badge label={label || 'Unknown Crowd'} variant="neutral" icon="⚪" size={size} />;
  }
};

export const BathingBadge: React.FC<{ status: 'allowed' | 'restricted' | 'closed' | string; label?: string; size?: 'sm' | 'md' }> = ({
  status,
  label,
  size = 'md',
}) => {
  switch (status?.toLowerCase()) {
    case 'allowed':
      return <Badge label={label || 'Safe to Bathe'} variant="success" icon="🟢" size={size} />;
    case 'restricted':
      return <Badge label={label || 'Restricted'} variant="warning" icon="🟡" size={size} />;
    case 'closed':
      return <Badge label={label || 'Strictly Closed'} variant="danger" icon="🔴" size={size} />;
    default:
      return <Badge label={label || 'Pending'} variant="neutral" icon="⚪" size={size} />;
  }
};

export const VerificationBadge: React.FC<{ verified: boolean; label?: string; size?: 'sm' | 'md' }> = ({
  verified,
  label,
  size = 'sm',
}) => {
  if (verified) {
    return <Badge label={label || 'Verified'} variant="success" icon="✓" size={size} />;
  }
  return <Badge label={label || 'Unverified'} variant="neutral" icon="?" size={size} />;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.pill,
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  label: {
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 12,
  },
  labelMd: {
    fontSize: 14,
  },
  iconText: {
    fontSize: 12,
  },
  iconTextSm: {
    fontSize: 10,
  },
});

