import React from 'react';
import { tokens } from '../theme/tokens';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  retryLabel = 'Retry',
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
        backgroundColor: tokens.colors.dangerLight,
        border: `1px solid ${tokens.colors.dangerBorder}`,
        borderRadius: `${tokens.radii.md}px`,
        margin: '1rem 0',
      }}
    >
      <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</span>
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: tokens.colors.danger,
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.8125rem',
          color: tokens.colors.textPrimary,
          maxWidth: '400px',
          marginBottom: onRetry ? '1rem' : 0,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            borderRadius: `${tokens.radii.sm}px`,
            border: 'none',
            backgroundColor: tokens.colors.danger,
            color: tokens.colors.textInverse,
            cursor: 'pointer',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};
