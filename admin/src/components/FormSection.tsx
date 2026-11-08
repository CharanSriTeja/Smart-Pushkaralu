import React from 'react';
import { tokens } from '../theme/tokens';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: tokens.colors.bg,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: `${tokens.radii.md}px`,
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: tokens.shadows.card,
      }}
    >
      <div style={{ marginBottom: '1.25rem', borderBottom: `1px solid ${tokens.colors.borderLight}`, paddingBottom: '0.75rem' }}>
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: '700',
            color: tokens.colors.textPrimary,
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: tokens.colors.textMuted,
              marginTop: '2px',
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

