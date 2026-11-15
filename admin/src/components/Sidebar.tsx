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

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { to: '/', label: 'Live Operations & Map', icon: '📊' },
      { to: '/sos', label: 'SOS Control Room', icon: '🚨', permission: 'sos.update' },
      { to: '/issues', label: 'Reports & Issues', icon: '📋', permission: 'issues.update' },
      { to: '/routes/operations', label: 'Routing Operations', icon: '🧭', permission: 'routes.manage' },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/ghats', label: 'Ghats Management', icon: '🌊', permission: 'ghats.write' },
      { to: '/places', label: 'Temples & Hotels', icon: '🏨', permission: 'places.read' },
      { to: '/transport', label: 'Transport & Shuttles', icon: '🚌', permission: 'transport.read' },
      { to: '/seva', label: 'Virtual Seva & Events', icon: '🙏', permission: 'seva.write' },
      { to: '/news', label: 'News & Advisories', icon: '📰', permission: 'news.publish' },
      { to: '/notifications', label: 'Push Notifications', icon: '🔔', permission: 'news.publish' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/routes/closures', label: 'Road Closures', icon: '🚧', permission: 'routes.manage' },
      { to: '/routes/origins', label: 'Route Origins', icon: '📍', permission: 'routes.manage' },
      { to: '/routes/temples', label: 'Corridor Temples', icon: '🛕', permission: 'routes.manage' },
      { to: '/routes/delay-factors', label: 'Delay Factors', icon: '⏱️', permission: 'routes.manage' },
      { to: '/audit-logs', label: 'Audit Log', icon: '🔍', permission: 'audit.read' },
      { to: '/settings', label: 'Master Settings', icon: '⚙️', permission: 'settings.write' },
      { to: '/usage', label: 'System Health & Quota', icon: '📈', permission: 'settings.write' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const { user, mockRole, setMockRole, hasPermission } = useAuth();

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '260px',
        backgroundColor: tokens.colors.bg,
        borderRight: `1px solid ${tokens.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease',
        zIndex: 20,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '1.25rem 0.5rem' : '1.25rem 1rem',
          borderBottom: `1px solid ${tokens.colors.border}`,
          backgroundColor: tokens.colors.primary50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>🕉️</span>
          {!collapsed && (
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
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: tokens.colors.textMuted,
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        )}
      </div>

      {/* Navigation List grouped by Section */}
      <nav
        style={{
          flex: 1,
          padding: '0.75rem 0.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.permission) return true;
            return hasPermission(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {!collapsed && (
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    color: tokens.colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
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
                  <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User / Role Footer */}
      <div
        style={{
          padding: collapsed ? '0.75rem 0.5rem' : '1rem',
          borderTop: `1px solid ${tokens.colors.border}`,
          backgroundColor: tokens.colors.bgWarm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
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
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          {!collapsed && (
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
          )}
        </div>

        {/* Development Role Switcher */}
        {!collapsed && isDevAuth && (
          <div style={{ marginTop: '8px' }}>
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
                cursor: 'pointer',
              }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="control_room_operator">Control Room Operator</option>
              <option value="ghat_incharge">Ghat Incharge</option>
              <option value="traffic_coordinator">Traffic Coordinator</option>
              <option value="viewer">Viewer (Read-Only)</option>
            </select>
          </div>
        )}
      </div>
    </aside>
  );
};
