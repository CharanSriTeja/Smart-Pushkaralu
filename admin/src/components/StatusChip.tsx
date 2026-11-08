import React from 'react';
import { tokens } from '../theme/tokens';

export interface StatusChipProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange';
  icon?: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: tokens.colors.successLight,
          border: tokens.colors.successBorder,
          text: tokens.colors.success,
        };
      case 'warning':
        return {
          bg: tokens.colors.warningLight,
          border: tokens.colors.warningBorder,
          text: tokens.colors.warning,
        };
      case 'danger':
        return {
          bg: tokens.colors.dangerLight,
          border: tokens.colors.dangerBorder,
          text: tokens.colors.danger,
        };
      case 'orange':
      case 'info':
        return {
          bg: tokens.colors.primary50,
          border: tokens.colors.borderOrange,
          text: tokens.colors.primary700,
        };
      case 'neutral':
      default:
        return {
          bg: tokens.colors.mutedLight,
          border: tokens.colors.mutedBorder,
          text: tokens.colors.muted,
        };
    }
  };

  const c = getColors();
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? '0.6875rem' : '0.75rem',
        fontWeight: '700',
        borderRadius: `${tokens.radii.pill}px`,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        lineHeight: 1.2,
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
