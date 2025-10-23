// src/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem('sr_token');
        if (saved) {
          setToken(saved);
          // validar token y traer user
          const me = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${saved}` },
          });
          if (me.ok) {
            setUser(await me.json());
          } else {
            // token inválido/expirado
            localStorage.removeItem('sr_token');
          }
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.detail || 'Credenciales inválidas';
      throw new Error(msg);
    }

    const { access_token } = await res.json();
    setToken(access_token);
    localStorage.setItem('sr_token', access_token);

    // pedir /me con el token nuevo
    const me = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (me.ok) {
      setUser(await me.json());
      localStorage.setItem('sr_user', JSON.stringify(await me.clone().json()));
    } else {
      setUser(null);
      localStorage.removeItem('sr_user');
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
  }

  // helper para fetch con auth y manejo 401
  async function fetchWithAuth(path, init = {}) {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    if (res.status === 401) {
      // token expirado → limpiar sesión
      logout();
    }
    return res;
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      authHeader: token ? `Bearer ${token}` : null,
      login,
      logout,
      fetchWithAuth,
      ready,
      BASE_URL,
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
