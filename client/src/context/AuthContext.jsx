import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler, tokenStore } from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    authApi.me().then((d) => setUser(d.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const authenticate = useCallback(async (request) => {
    const { user: u, token } = await request();
    tokenStore.set(token);
    setUser(u);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (creds) => authenticate(() => authApi.login(creds)),
      register: (data) => authenticate(() => authApi.register(data)),
      logout,
    }),
    [user, loading, authenticate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
