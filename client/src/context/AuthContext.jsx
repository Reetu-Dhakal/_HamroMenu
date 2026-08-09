import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authStorage } from '../lib/apiClient';
import { request } from '../lib/apiClient';

const AuthContext = createContext(null);

export const ROLE_HOME = {
  admin: '/admin',
  staff: '/staff',
  kitchen: '/kitchen',
  customer: '/order-history',
};

function roleHome(role) {
  return ROLE_HOME[role] || '/';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [booting, setBooting] = useState(true);

  const applySession = useCallback((payload) => {
    authStorage.setSession(payload);
    setUser(payload.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const payload = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      applySession(payload);
      return payload.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (data) => {
      const payload = await request('/api/auth/register/customer', { method: 'POST', body: data });
      applySession(payload);
      return payload.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = authStorage.getRefresh();
      if (refreshToken) await request('/api/auth/logout', { method: 'POST', body: { refreshToken }, silent: true });
    } catch (_) {
      /* token already dead — ignore */
    }
    authStorage.clear();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await request('/api/auth/me');
      authStorage.setUser(me);
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('hm:auth-expired', onExpired);
    return () => window.removeEventListener('hm:auth-expired', onExpired);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (authStorage.getAccess() && user) {
        try {
          const me = await request('/api/auth/me');
          if (alive) {
            authStorage.setUser(me);
            setUser(me);
          }
        } catch {
          if (alive) setUser(null);
        }
      }
      if (alive) setBooting(false);
    })();
    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, refreshProfile, home: user ? roleHome(user.role) : '/', role: user?.role || null }),
    [user, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;