import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, isDevAuth } from '../context/AuthContext';
import { MockRole } from '../types';
import { tokens } from '../theme/tokens';

export interface NavItem {
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

export const Sidebar: React.FC = () => {
  const { user, mockRole, setMockRole, hasPermission } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: tokens.colors.bg,
        borderRight: `1px solid ${tokens.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1rem',
          borderBottom: `1px solid ${tokens.colors.border}`,
          backgroundColor: tokens.colors.primary50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>🕉️</span>
          <div>
            <h1
              style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: tokens.colors.primary700,
                lineHeight: 1.2,
              }}
            >
              Smart Pushkaralu
            </h1>
            <p
              style={{
                fontSize: '0.75rem',
                color: tokens.colors.textMuted,
                marginTop: '2px',
                fontWeight: '500',
              }}
            >
              2027 Command Room
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          padding: '0.75rem 0.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.625rem 0.75rem',
              borderRadius: `${tokens.radii.sm}px`,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? tokens.colors.primary700 : tokens.colors.textPrimary,
              backgroundColor: isActive ? tokens.colors.primary50 : 'transparent',
              borderLeft: isActive ? `3px solid ${tokens.colors.primary700}` : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Role Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: `1px solid ${tokens.colors.border}`,
          backgroundColor: tokens.colors.bgWarm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: tokens.colors.primary500,
              color: tokens.colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.875rem',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: tokens.colors.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'Authorized Admin'}
            </p>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: tokens.colors.primary100,
                color: tokens.colors.primary700,
                fontWeight: '600',
              }}
            >
              {user?.role || mockRole || 'Admin'}
            </span>
          </div>
        </div>

        {/* Development Role Switcher */}
        {isDevAuth && (
          <div style={{ marginTop: '6px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                color: tokens.colors.textMuted,
                marginBottom: '2px',
              }}
            >
              Dev Switcher:
            </label>
            <select
              value={mockRole}
              onChange={(e) => setMockRole(e.target.value as MockRole)}
              style={{
                width: '100%',
                padding: '4px 6px',
                fontSize: '0.75rem',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                color: tokens.colors.textPrimary,
              }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="ghat_manager">Ghat Manager</option>
              <option value="police_control">Police Control</option>
              <option value="transport_operator">Transport Op</option>
              <option value="medical_officer">Medical Officer</option>
              <option value="public_relations">Public Relations</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        )}
      </div>
    </aside>
  );
};

