// src/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apix } from './api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('sr_token');
      const u = localStorage.getItem('sr_user');
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {}
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await apix.login(email, password); // { access_token, token_type }
    const rawToken = data.access_token;
    setToken(rawToken);
    localStorage.setItem('sr_token', rawToken);

    try {
      const me = await apix.me(rawToken);
      setUser(me);
      localStorage.setItem('sr_user', JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem('sr_user');
    }
  }

  async function register(payload) {
    await apix.register(payload);
    // Luego puedes hacer login automático si quieres:
    await login(payload.email, payload.password);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
  }

  const value = useMemo(
    () => ({
      token,
      user,                       // { _id, email, nombre, rol, ... }
      email: user?.email || null, // comodidad
      isAuthenticated: Boolean(token),
      authHeader: token ? `Bearer ${token}` : null,
      login, register, logout,
      ready,
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
