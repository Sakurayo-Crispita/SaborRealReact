// src/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apix } from './api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);          // <-- NUEVO
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('sr_token');
      const u = localStorage.getItem('sr_user');
      const p = localStorage.getItem('sr_profile');       // <-- NUEVO
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
      if (p) setProfile(JSON.parse(p));                   // <-- NUEVO
    } catch {}
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await apix.login(email, password);
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
    // si tu /me retorna perfil, podrías setProfile(me.profile)
  }

  async function register(payload) {
    await apix.register(payload);
    await login(payload.email, payload.password);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setProfile(null);                                     // <-- NUEVO
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    localStorage.removeItem('sr_profile');                // <-- NUEVO
    localStorage.removeItem('sr_cart'); 
    const email = JSON.parse(localStorage.getItem('sr_user') || 'null')?.email;
    const key = `sr_cart_${email ?? 'anon'}`;
    localStorage.removeItem(key);
  }

  // persiste el perfil cuando cambie
  useEffect(() => {
    if (profile) localStorage.setItem('sr_profile', JSON.stringify(profile));
  }, [profile]);

  const value = useMemo(
    () => ({
      token,
      user,
      profile, setProfile,                               // <-- NUEVO
      email: user?.email || null,
      isAuthenticated: Boolean(token),
      authHeader: token ? `Bearer ${token}` : null,
      login, register, logout,
      ready,
    }),
    [token, user, profile, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
