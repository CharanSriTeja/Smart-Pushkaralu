import React, { useState, useEffect } from 'react';
import { tokens } from '../theme/tokens';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  requiredMatchText?: string;
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
  requiredMatchText,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [typedMatch, setTypedMatch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedMatch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatchValid = !requiredMatchText || typedMatch.trim() === requiredMatchText.trim();

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
          width: '460px',
          maxWidth: '92%',
          padding: '1.5rem',
          boxShadow: tokens.shadows.modal,
          border: isDangerous ? `2px solid ${tokens.colors.danger}` : `1px solid ${tokens.colors.border}`,
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: isDangerous ? tokens.colors.danger : tokens.colors.textPrimary,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isDangerous && <span>⚠️</span>}
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: tokens.colors.textMuted,
            lineHeight: 1.5,
            marginBottom: '1rem',
          }}
        >
          {message}
        </p>

        {requiredMatchText && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: tokens.colors.textPrimary,
                marginBottom: '4px',
              }}
            >
              To confirm, type <strong style={{ color: tokens.colors.danger }}>{requiredMatchText}</strong> below:
            </label>
            <input
              type="text"
              value={typedMatch}
              onChange={(e) => setTypedMatch(e.target.value)}
              placeholder={requiredMatchText}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.875rem',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                color: tokens.colors.textPrimary,
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              color: tokens.colors.textMuted,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading || !isMatchValid}
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: '700',
              borderRadius: `${tokens.radii.sm}px`,
              border: 'none',
              backgroundColor: isDangerous ? tokens.colors.danger : tokens.colors.primary700,
              color: tokens.colors.textInverse,
              cursor: loading || !isMatchValid ? 'not-allowed' : 'pointer',
              opacity: loading || !isMatchValid ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
