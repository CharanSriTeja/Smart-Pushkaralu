import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import { tokens } from '../theme/tokens';

interface DemoAccount {
  id: string;
  role: 'super_admin' | 'editor';
  name: string;
  designation: string;
  email: string;
  phone: string;
  badge: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'super_admin',
    name: 'District Collector (Super Admin)',
    designation: 'Collector & District Magistrate',
    email: 'admin@smartpushkaralu.gov.in',
    phone: '+919999999999',
    badge: 'Full Access (*)',
    description: 'Master operations, emergency broadcast, system settings & audits',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    role: 'editor',
    name: 'Traffic & Transport In-Charge',
    designation: 'Superintendent of Police (Traffic)',
    email: 'traffic@smartpushkaralu.gov.in',
    phone: '+919888888888',
    badge: 'Operations & Routes',
    description: 'Road closures, corridor parking, shuttles & crowd alerts',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    role: 'editor',
    name: 'Media & Public Relations Officer',
    designation: 'Information & PR Commissioner',
    email: 'media@smartpushkaralu.gov.in',
    phone: '+919777777777',
    badge: 'Media & Ghats',
    description: 'Ghat announcements, press releases, live advisories & seva schedules',
  },
];

const FIXED_PASSWORD = 'Pushkaralu@2027';

export const LoginPage: React.FC = () => {
  const { user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(FIXED_PASSWORD);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomJwt, setShowCustomJwt] = useState(false);
  const [customJwt, setCustomJwt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = (location.state as any)?.from?.pathname || '/';

  // If already logged in, redirect away from /login
  useEffect(() => {
    if (user.role !== 'guest') {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const selectDemoAccount = (index: number) => {
    const acc = DEMO_ACCOUNTS[index];
    setSelectedAccountIndex(index);
    setUsername(acc.email);
    setPassword(FIXED_PASSWORD);
    setError(null);
  };

  const generateDemoJwt = (account: DemoAccount): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: account.id,
      phone: account.phone,
      name: account.name,
      isAdmin: true,
      role: account.role,
      permissions: ROLE_PERMISSIONS[account.role] || [],
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
    };

    const b64Header = btoa(JSON.stringify(header));
    const b64Payload = btoa(JSON.stringify(payload));
    return `${b64Header}.${b64Payload}.demo_signature`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      if (!trimmedUser || !trimmedPass) {
        setError('Please enter both username and password.');
        setIsLoading(false);
        return;
      }

      // Check fixed demo credentials
      if (trimmedPass !== FIXED_PASSWORD) {
        setError(`Invalid credentials. Use the fixed demo password: ${FIXED_PASSWORD}`);
        setIsLoading(false);
        return;
      }

      const matchedAccount = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === trimmedUser || a.phone === trimmedUser
      );

      const targetAccount: DemoAccount = matchedAccount || {
        id: '00000000-0000-0000-0000-000000000001',
        role: 'super_admin',
        name: trimmedUser.includes('@') ? trimmedUser.split('@')[0] : 'Admin User',
        designation: 'Pushkaralu Administrator',
        email: trimmedUser,
        phone: '+919999999999',
        badge: 'Full Access',
        description: 'Authenticated admin account',
      };

      const jwt = generateDemoJwt(targetAccount);
      loginWithToken(jwt);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomJwtLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customJwt.trim()) {
      setError('Please paste a valid JWT string.');
      return;
    }
    try {
      loginWithToken(customJwt.trim());
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError('Invalid JWT format: ' + (err?.message || 'parse error'));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.colors.bgWarm,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: '520px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem', lineHeight: 1 }}>🕉️</div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            color: tokens.colors.primary700,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em',
          }}
        >
          Smart Pushkaralu 2027
        </h1>
        <p
          style={{
            fontSize: '0.9375rem',
            fontWeight: '600',
            color: tokens.colors.textPrimary,
            margin: '0 0 0.25rem 0',
          }}
        >
          Integrated Command & Control Center (ICCC)
        </p>
        <p
          style={{
            fontSize: '0.8125rem',
            color: tokens.colors.textMuted,
            margin: 0,
          }}
        >
          Administrative operations, crowd monitoring, and emergency dispatch console
        </p>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: tokens.colors.bg,
          borderRadius: `${tokens.radii.lg}px`,
          border: `1px solid ${tokens.colors.border}`,
          boxShadow: tokens.shadows.modal,
          overflow: 'hidden',
        }}
      >
        {/* Banner with fixed credential callout */}
        <div
          style={{
            backgroundColor: tokens.colors.primary50,
            borderBottom: `1px solid ${tokens.colors.borderOrange}`,
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: tokens.colors.primary700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🔐 Fixed Demo Credentials
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                backgroundColor: tokens.colors.successLight,
                color: tokens.colors.success,
                border: `1px solid ${tokens.colors.successBorder}`,
                padding: '2px 8px',
                borderRadius: `${tokens.radii.pill}px`,
                fontWeight: '700',
              }}
            >
              Demo Ready
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: tokens.colors.textMuted,
              margin: '0.375rem 0 0 0',
              lineHeight: 1.4,
            }}
          >
            Select a role below to auto-fill credentials, or sign in directly with password: <code style={{ color: tokens.colors.primary700, fontWeight: '700' }}>{FIXED_PASSWORD}</code>
          </p>
        </div>

        {/* Demo Account Selector Pills */}
        <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: tokens.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            Quick Select Role
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map((account, idx) => {
              const isSelected = selectedAccountIndex === idx && !showCustomJwt;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => selectDemoAccount(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: isSelected
                      ? `2px solid ${tokens.colors.primary700}`
                      : `1px solid ${tokens.colors.border}`,
                    backgroundColor: isSelected ? tokens.colors.primary50 : tokens.colors.bg,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        color: isSelected ? tokens.colors.primary700 : tokens.colors.textPrimary,
                      }}
                    >
                      {account.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: tokens.colors.textMuted,
                        marginTop: '2px',
                      }}
                    >
                      {account.email} • {account.designation}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: `${tokens.radii.pill}px`,
                      backgroundColor: isSelected ? tokens.colors.primary700 : tokens.colors.mutedLight,
                      color: isSelected ? tokens.colors.textInverse : tokens.colors.textMuted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {account.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: '1rem 1.25rem 0 1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: tokens.colors.dangerLight,
              border: `1px solid ${tokens.colors.dangerBorder}`,
              borderRadius: `${tokens.radii.sm}px`,
              color: tokens.colors.danger,
              fontSize: '0.8125rem',
              fontWeight: '600',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Form */}
        {!showCustomJwt ? (
          <form onSubmit={handleLogin} style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: tokens.colors.textPrimary,
                  marginBottom: '0.375rem',
                }}
              >
                Username / Email / Mobile
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.875rem',
                  color: tokens.colors.textPrimary,
                  backgroundColor: tokens.colors.bg,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label
                  htmlFor="password"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: tokens.colors.textPrimary,
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    color: tokens.colors.primary700,
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.875rem',
                  color: tokens.colors.textPrimary,
                  backgroundColor: tokens.colors.bg,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: tokens.colors.primary700,
                color: tokens.colors.textInverse,
                border: 'none',
                borderRadius: `${tokens.radii.sm}px`,
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: tokens.shadows.card,
                transition: 'background-color 0.15s ease',
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCustomJwtLogin} style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="customJwt"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: tokens.colors.textPrimary,
                  marginBottom: '0.375rem',
                }}
              >
                Bearer JWT Token
              </label>
              <textarea
                id="customJwt"
                rows={4}
                value={customJwt}
                onChange={(e) => setCustomJwt(e.target.value)}
                placeholder="Paste raw JWT here (eyJhbGciOiJIUzI1Ni...)"
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: tokens.colors.textPrimary,
                  backgroundColor: tokens.colors.bg,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: tokens.colors.primary700,
                color: tokens.colors.textInverse,
                border: 'none',
                borderRadius: `${tokens.radii.sm}px`,
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: tokens.shadows.card,
              }}
            >
              Apply JWT & Enter
            </button>
          </form>
        )}

        {/* Footer Toggle for Advanced JWT Mode */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: tokens.colors.borderLight,
            borderTop: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowCustomJwt(!showCustomJwt);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.colors.textMuted,
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {showCustomJwt ? '← Switch to Fixed Credentials Form' : '⚙️ Advanced: Sign In with Custom Bearer Token'}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, margin: 0 }}>
          Government of Andhra Pradesh • Godavari Maha Pushkaralu 2027
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
