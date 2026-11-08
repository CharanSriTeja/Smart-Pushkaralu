import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, isDevAuth } from '../context/AuthContext';
import { MockRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  permission?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/sos', label: 'SOS Command Live', icon: '🚨', permission: 'sos.update' },
  { to: '/ghats', label: 'Ghats Management', icon: '🌊', permission: 'ghats.write' },
  { to: '/places', label: 'Nearby Places', icon: '🏨', permission: 'places.read' },
  { to: '/routes/origins', label: 'Route Origins', icon: '📍', permission: 'routes.manage' },
  { to: '/routes/closures', label: 'Road Closures', icon: '🚧', permission: 'routes.manage' },
  { to: '/routes/temples', label: 'Pilgrimage Temples', icon: '🛕', permission: 'routes.manage' },
  { to: '/routes/delay-factors', label: 'Delay Multipliers', icon: '⏱️', permission: 'routes.manage' },
  { to: '/routes/operations', label: 'Routing Operations', icon: '🧭', permission: 'routes.manage' },
  { to: '/transport', label: 'Transport & Shuttles', icon: '🚌', permission: 'transport.read' },
  { to: '/news', label: 'News & Advisories', icon: '📰', permission: 'news.publish' },
  { to: '/seva', label: 'Seva & Volunteers', icon: '🙏', permission: 'seva.write' },
  { to: '/issues', label: 'Grievance / Issues', icon: '📋', permission: 'issues.update' },
  { to: '/audit-logs', label: 'Audit Trail', icon: '🔍', permission: 'audit.read' },
  { to: '/settings', label: 'Settings Editor', icon: '⚙️', permission: 'settings.write' },
  { to: '/usage', label: 'API Quota & Usage', icon: '📈', permission: 'settings.write' },
];

export const Layout: React.FC = () => {
  const { user, mockRole, setMockRole, loginWithToken, hasPermission, logout } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const navigate = useNavigate();

  // Filter navigation items by active user permissions
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as MockRole;
    setMockRole(newRole);
    navigate('/');
  };

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      loginWithToken(tokenInput.trim());
      setShowTokenModal(false);
      setTokenInput('');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0F172A', // Slate 900
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1E293B',
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.025em', color: '#FFFFFF' }}>
                Smart Pushkaralu
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 600 }}>
                Administration 2027
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', padding: '0 0.5rem 0.5rem', letterSpacing: '0.05em' }}>
            Modules & Tools
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visibleNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#0F52BA' : 'transparent',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Role Info Box */}
        <div style={{ padding: '1rem', borderTop: '1px solid #1E293B', background: '#090D16' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Signed in as:</div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: user.isSuperAdmin ? '#DC2626' : user.role === 'editor' ? '#2563EB' : '#475569',
                color: '#FFFFFF',
              }}
            >
              {user.role.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              {user.isSuperAdmin ? 'Full Access' : `${user.permissions.length} perms`}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header
          style={{
            height: '60px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isDevAuth ? (
              <>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>[DEV] Role Switcher:</span>
                <select
                  value={mockRole}
                  onChange={handleRoleChange}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                >
                  <option value="super_admin">👑 Super Admin (Full Access)</option>
                  <option value="editor">✍️ Editor (Ghats, News, Seva)</option>
                  <option value="viewer">👁️ Viewer (Audit Read Only)</option>
                  <option value="guest">🔒 Guest (No Access)</option>
                </select>
              </>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: '#0F172A', fontWeight: 700 }}>
                {user.role === 'guest' ? '🔒 Unauthenticated Session' : `👤 ${user.name} (${user.role})`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowTokenModal(true)}
              style={{
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                background: '#FFFFFF',
                cursor: 'pointer',
                color: '#334155',
              }}
            >
              🔑 Real JWT Token
            </button>
            {mockRole !== 'guest' && (
              <button
                onClick={logout}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  background: '#FEF2F2',
                  cursor: 'pointer',
                  color: '#DC2626',
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Real JWT Modal */}
      {showTokenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0F172A' }}>
              Paste Real Admin Bearer JWT
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Paste an authorization access token obtained from backend /v1/auth/verify to make authenticated requests with real user permissions.
            </p>
            <form onSubmit={handleApplyToken}>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box',
                  marginBottom: '1rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0F52BA',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
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

