import React, { useEffect } from 'react';
import { tokens } from '../theme/tokens';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isOpen,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: tokens.colors.success,
          text: tokens.colors.textInverse,
          icon: '✓',
        };
      case 'error':
        return {
          bg: tokens.colors.danger,
          text: tokens.colors.textInverse,
          icon: '⚠️',
        };
      case 'warning':
        return {
          bg: tokens.colors.warning,
          text: tokens.colors.textInverse,
          icon: '!',
        };
      case 'info':
      default:
        return {
          bg: tokens.colors.primary700,
          text: tokens.colors.textInverse,
          icon: 'ℹ️',
        };
    }
  };

  const cfg = getConfig();

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        backgroundColor: cfg.bg,
        color: cfg.text,
        padding: '12px 18px',
        borderRadius: `${tokens.radii.md}px`,
        boxShadow: tokens.shadows.dropdown,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '420px',
        fontSize: '0.875rem',
        fontWeight: '600',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <span>{cfg.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: cfg.text,
          fontSize: '1rem',
          cursor: 'pointer',
          padding: '0 4px',
          fontWeight: '700',
          opacity: 0.8,
        }}
      >
        ✕
      </button>
    </div>
  );
};

