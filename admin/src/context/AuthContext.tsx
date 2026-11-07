import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, MockRole } from '../types';

export const ROLE_PERMISSIONS: Record<MockRole, string[]> = {
  super_admin: [
    '*',
    'ghats.write',
    'news.publish',
    'sos.update',
    'issues.update',
    'seva.write',
    'settings.write',
    'audit.read',
    'places.read',
    'places.write',
    'places.update',
    'places.create',
    'places.delete',
    'places.cache',
    'transport.read',
    'transport.write',
    'transport.delete',
  ],
  editor: [
    'ghats.write',
    'news.publish',
    'seva.write',
    'places.read',
    'places.write',
    'places.update',
    'places.create',
    'places.cache',
    'transport.read',
    'transport.write',
  ],
  viewer: ['audit.read', 'places.read', 'transport.read'],
  guest: [],
};

const MOCK_USERS: Record<MockRole, AdminUser> = {
  super_admin: {
    id: 'admin-super-01',
    phone: '+91 99999 99999',
    name: 'District Collector (Super Admin)',
    role: 'super_admin',
    permissions: ROLE_PERMISSIONS.super_admin,
    isSuperAdmin: true,
  },
  editor: {
    id: 'admin-editor-02',
    phone: '+91 88888 88888',
    name: 'Media & Ghat Officer (Editor)',
    role: 'editor',
    permissions: ROLE_PERMISSIONS.editor,
    isSuperAdmin: false,
  },
  viewer: {
    id: 'admin-viewer-03',
    phone: '+91 77777 77777',
    name: 'Auditor & Observer (Viewer)',
    role: 'viewer',
    permissions: ROLE_PERMISSIONS.viewer,
    isSuperAdmin: false,
  },
  guest: {
    id: 'guest',
    phone: '',
    name: 'Guest / Unauthenticated',
    role: 'guest',
    permissions: [],
    isSuperAdmin: false,
  },
};

interface AuthContextType {
  user: AdminUser;
  mockRole: MockRole;
  token: string | null;
  setMockRole: (role: MockRole) => void;
  loginWithToken: (jwt: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: MOCK_USERS.super_admin,
  mockRole: 'super_admin',
  token: null,
  setMockRole: () => {},
  loginWithToken: () => {},
  logout: () => {},
  hasPermission: () => true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mockRole, setRoleState] = useState<MockRole>(() => {
    const saved = localStorage.getItem('sp_admin_role');
    return (saved as MockRole) || 'super_admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sp_admin_token') || null;
  });

  const [user, setUser] = useState<AdminUser>(() => MOCK_USERS[mockRole]);

  useEffect(() => {
    setUser(MOCK_USERS[mockRole]);
    localStorage.setItem('sp_admin_role', mockRole);
  }, [mockRole]);

  const setMockRole = (role: MockRole) => {
    setRoleState(role);
  };

  const loginWithToken = (jwt: string) => {
    setToken(jwt);
    localStorage.setItem('sp_admin_token', jwt);
    // Parse JWT payload safely if present
    try {
      const parts = jwt.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        setUser({
          id: payload.userId || 'admin-real',
          phone: payload.phone || '+91 99999 99999',
          name: payload.name || 'Verified Admin',
          role: payload.isAdmin ? 'super_admin' : 'viewer',
          permissions: payload.isAdmin ? ROLE_PERMISSIONS.super_admin : ['audit.read'],
          isSuperAdmin: Boolean(payload.isAdmin),
          token: jwt,
        });
      }
    } catch (e) {
      console.warn('Could not decode token, using standard mock role', e);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('sp_admin_token');
    setRoleState('guest');
  };

  const hasPermission = (permission: string): boolean => {
    if (user.role === 'guest') return false;
    if (user.isSuperAdmin || user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mockRole,
        token,
        setMockRole,
        loginWithToken,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

