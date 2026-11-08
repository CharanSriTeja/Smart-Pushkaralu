import React from 'react';
import { tokens } from '../theme/tokens';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no records to display at this time.',
  icon = '📋',
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</span>
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: tokens.colors.textPrimary,
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.8125rem',
          color: tokens.colors.textMuted,
          maxWidth: '360px',
          marginBottom: actionLabel ? '1rem' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 16px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            borderRadius: `${tokens.radii.sm}px`,
            border: 'none',
            backgroundColor: tokens.colors.primary700,
            color: tokens.colors.textInverse,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
