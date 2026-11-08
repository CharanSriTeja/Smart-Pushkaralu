import React from 'react';
import { tokens } from '../theme/tokens';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          backgroundColor: tokens.colors.bg,
          borderRadius: `${tokens.radii.md}px`,
          width: '440px',
          maxWidth: '92%',
          padding: '1.5rem',
          boxShadow: tokens.shadows.modal,
          border: `1px solid ${tokens.colors.border}`,
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: isDangerous ? tokens.colors.danger : tokens.colors.textPrimary,
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: tokens.colors.textMuted,
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              color: tokens.colors.textPrimary,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              borderRadius: `${tokens.radii.sm}px`,
              border: 'none',
              backgroundColor: isDangerous ? tokens.colors.danger : tokens.colors.primary700,
              color: tokens.colors.textInverse,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
