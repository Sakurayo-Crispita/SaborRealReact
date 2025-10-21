// src/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Cambia si tu backend corre en otro host/puerto
const BASE_URL = 'http://127.0.0.1:8000';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null); 
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Cargar sesión guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sr_token');
      const savedUser = localStorage.getItem('sr_user');
      if (saved) setToken(saved);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {}
    setReady(true);
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

    // Backend devuelve: { access_token, token_type: "bearer" }
    const data = await res.json();
    const rawToken = data.access_token;

    setToken(rawToken);
    localStorage.setItem('sr_token', rawToken);

    // Si en tu backend el JWT incluye email/id y decides guardarlo:
    // (totalmente opcional; puedes omitir user)
    const u = data.user || null;
    setUser(u);
    if (u) localStorage.setItem('sr_user', JSON.stringify(u));
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
      user,
      isAuthenticated: Boolean(token),
      // Úsalo así: headers: { Authorization: authHeader }
      authHeader: token ? `Bearer ${token}` : null,
      login,
      logout,
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
