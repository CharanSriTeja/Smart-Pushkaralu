import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../theme/tokens';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loginWithToken, logout } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      loginWithToken(tokenInput.trim());
      setShowTokenModal(false);
      setTokenInput('');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: tokens.colors.bgWarm,
        color: tokens.colors.textPrimary,
      }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Navbar */}
        <header
          style={{
            height: '60px',
            backgroundColor: tokens.colors.bg,
            borderBottom: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: tokens.colors.textPrimary,
                padding: '4px 6px',
                borderRadius: `${tokens.radii.sm}px`,
              }}
            >
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: tokens.colors.success,
                }}
              />
              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: tokens.colors.textMuted }}>
                System Status:
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: tokens.colors.success }}>
                Operational
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowTokenModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.primary50,
                color: tokens.colors.primary700,
                cursor: 'pointer',
              }}
            >
              🔑 Set JWT Token
            </button>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                color: tokens.colors.textMuted,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            padding: '1.5rem 2rem',
            overflowY: 'auto',
          }}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Token Modal */}
      {showTokenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.colors.bg,
              padding: '1.5rem',
              borderRadius: `${tokens.radii.md}px`,
              width: '420px',
              maxWidth: '90%',
              boxShadow: tokens.shadows.modal,
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Set Admin JWT Token
            </h3>
            <p style={{ fontSize: '0.8125rem', color: tokens.colors.textMuted, marginBottom: '1rem' }}>
              Paste a valid admin bearer token from your server environment or Firebase login.
            </p>
            <form onSubmit={handleApplyToken}>
              <textarea
                rows={4}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.8125rem',
                  fontFamily: 'monospace',
                  marginBottom: '1rem',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: `1px solid ${tokens.colors.border}`,
                    backgroundColor: tokens.colors.bg,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 14px',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: 'none',
                    backgroundColor: tokens.colors.primary700,
                    color: tokens.colors.textInverse,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                  }}
                >
                  Apply Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

