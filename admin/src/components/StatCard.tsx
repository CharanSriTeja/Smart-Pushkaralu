import React from 'react';
import { tokens } from '../theme/tokens';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  subtext?: string;
  variant?: 'default' | 'orange' | 'danger' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtext,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return {
          borderTop: `4px solid ${tokens.colors.primary700}`,
          iconBg: tokens.colors.primary50,
          iconColor: tokens.colors.primary700,
        };
      case 'danger':
        return {
          borderTop: `4px solid ${tokens.colors.danger}`,
          iconBg: tokens.colors.dangerLight,
          iconColor: tokens.colors.danger,
        };
      case 'success':
        return {
          borderTop: `4px solid ${tokens.colors.success}`,
          iconBg: tokens.colors.successLight,
          iconColor: tokens.colors.success,
        };
      case 'default':
      default:
        return {
          borderTop: `4px solid ${tokens.colors.borderOrange}`,
          iconBg: tokens.colors.primary50,
          iconColor: tokens.colors.primary700,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div
      style={{
        backgroundColor: tokens.colors.bg,
        border: `1px solid ${tokens.colors.border}`,
        borderTop: v.borderTop,
        borderRadius: `${tokens.radii.md}px`,
        padding: '1.25rem',
        boxShadow: tokens.shadows.card,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '0.8125rem',
            color: tokens.colors.textMuted,
            fontWeight: '600',
            marginBottom: '4px',
          }}
        >
          {title}
        </p>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            color: tokens.colors.textPrimary,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </h2>
        {subtext && (
          <p
            style={{
              fontSize: '0.75rem',
              color: tokens.colors.textMuted,
              marginTop: '4px',
            }}
          >
            {subtext}
          </p>
        )}
      </div>
      {icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: `${tokens.radii.sm}px`,
            backgroundColor: v.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

