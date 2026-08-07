'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  getStoredUser,
  storeUser,
  clearAuth,
  setAccessToken,
  getStoredTokens,
} from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    const tokens = getStoredTokens();
    if (stored && tokens) {
      setUser(stored);
      setAccessToken(tokens.accessToken);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    storeAuth(res.data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register/customer', payload);
    storeAuth(res.data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) await api.post('/auth/logout', {});
    } catch (err) {
      // ignore
    }
    clearAuth();
    setAccessToken(null);
    setUser(null);
    router.push('/');
  }, [user, router]);

  const value = { user, loading, login, register, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUser() {
  return useAuth().user;
}

export function useRoles() {
  const user = useUser();
  const hasRole = (...roles) => !!user && roles.includes(user.role);
  return { user, hasRole };
}