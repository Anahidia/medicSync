'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, ROLE_PERMISSIONS } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  permissions: (typeof ROLE_PERMISSIONS)['ADMIN'];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultPermissions = ROLE_PERMISSIONS.ADMIN;

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  permissions: defaultPermissions,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  switchRole: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Credenciales inválidas' };
    } catch {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchSession();
  };

  const currentRole = user?.role || null;
  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : defaultPermissions;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        permissions,
        loading,
        login,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
