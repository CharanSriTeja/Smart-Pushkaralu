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
    'seva.manage',
    'seva.publish',
    'settings.write',
    'audit.read',
    'places.read',
    'places.write',
    'places.update',
    'places.create',
    'places.delete',
    'places.cache',
    'routes.manage',
    'transport.read',
    'transport.write',
    'transport.delete',
  ],
  editor: [
    'ghats.write',
    'news.publish',
    'issues.update',
    'seva.write',
    'seva.manage',
    'seva.publish',
    'places.read',
    'places.write',
    'places.update',
    'places.create',
    'places.cache',
    'routes.manage',
    'transport.read',
    'transport.write',
  ],
  viewer: ['audit.read', 'places.read', 'transport.read'],
  guest: [],
};

const GUEST_USER: AdminUser = {
  id: '',
  phone: '',
  name: 'Guest / Unauthenticated',
  role: 'guest',
  permissions: [],
  isSuperAdmin: false,
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
  user: GUEST_USER,
  mockRole: 'guest',
  token: null,
  setMockRole: () => {},
  loginWithToken: () => {},
  logout: () => {},
  hasPermission: () => false,
});

export const isDevAuth = false;

function decodeAdminJwt(jwt: string): AdminUser | null {
  try {
    const parts = jwt.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const isAdmin = Boolean(payload.isAdmin);
      return {
        id: payload.userId || 'admin',
        phone: payload.phone || '',
        name: payload.name || (isAdmin ? 'Admin User' : 'Viewer'),
        role: isAdmin ? 'super_admin' : 'viewer',
        permissions: isAdmin ? ROLE_PERMISSIONS.super_admin : ['audit.read'],
        isSuperAdmin: isAdmin,
        token: jwt,
      };
    }
  } catch {
    // invalid token
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sp_admin_token') || localStorage.getItem('pushkaralu_admin_token') || null;
  });

  const [user, setUser] = useState<AdminUser>(() => {
    const initialToken = localStorage.getItem('sp_admin_token') || localStorage.getItem('pushkaralu_admin_token');
    if (initialToken) {
      const decoded = decodeAdminJwt(initialToken);
      if (decoded) return decoded;
    }
    return GUEST_USER;
  });

  useEffect(() => {
    if (token) {
      const decoded = decodeAdminJwt(token);
      if (decoded) {
        setUser(decoded);
        return;
      }
    }
    setUser(GUEST_USER);
  }, [token]);

  const setMockRole = (_role: MockRole) => {
    console.warn('Mock role switcher is disabled in production.');
  };

  const loginWithToken = (jwt: string) => {
    setToken(jwt);
    localStorage.setItem('sp_admin_token', jwt);
    localStorage.setItem('pushkaralu_admin_token', jwt);
    const decoded = decodeAdminJwt(jwt);
    if (decoded) {
      setUser(decoded);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('sp_admin_token');
    localStorage.removeItem('pushkaralu_admin_token');
    setUser(GUEST_USER);
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
        mockRole: (user.role as MockRole) || 'guest',
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

