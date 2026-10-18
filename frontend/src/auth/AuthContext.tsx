// React Context for global authentication state, credentials, and role management.
// Supports health-based auth bypass (when auth_enabled is false, acts as admin).

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest } from '@/api/types';
import { api } from '@/api';
import { tokenStorage } from './tokenStorage';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  authEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser<User>());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authEnabled, setAuthEnabled] = useState<boolean>(true);

  // Initialize auth state and check health configuration
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const health = await api.getHealth();
        if (!isMounted) return;

        if (health.auth_enabled === false) {
          setAuthEnabled(false);
          const autoAdmin: User = {
            id: 'usr_admin',
            email: 'admin@system.local',
            role: 'admin',
          };
          setUser(autoAdmin);
          setIsLoading(false);
          return;
        }

        setAuthEnabled(true);
        const token = tokenStorage.getToken();
        if (token) {
          try {
            const me = await api.getMe();
            if (isMounted) {
              setUser(me);
              tokenStorage.setUser(me);
            }
          } catch {
            if (isMounted) {
              tokenStorage.clear();
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Could not verify health or session on load', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        authEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
