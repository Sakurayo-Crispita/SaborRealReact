// src/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apix } from './api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);   // /me
  const [ready, setReady] = useState(false);

  // Cargar token y user desde localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem('sr_token');
      const u = localStorage.getItem('sr_user');
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {}
    setReady(true);
  }, []);

  // Si hay token, refresca /me
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) { setUser(null); return; }
      try {
        const me = await apix.me(token);
        if (!alive) return;
        setUser(me);
        localStorage.setItem('sr_user', JSON.stringify(me));
      } catch {
        if (!alive) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem('sr_token');
        localStorage.removeItem('sr_user');
      }
    })();
    return () => { alive = false; };
  }, [token]);

  // ========= LOGIN =========
  async function login(email, password) {
    try {
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
    } catch (err) {
      // Normalizar mensaje de error
      let detail =
        err?.response?.data?.detail ?? // axios-style
        err?.detail ??
        err?.message ??
        'No se pudo iniciar sesión.';

      // Si viene un JSON como string: {"detail":"..."}
      if (typeof detail === 'string' && detail.startsWith('{"detail"')) {
        try {
          const parsed = JSON.parse(detail);
          if (parsed.detail) detail = parsed.detail;
        } catch {
          // ignore parse error
        }
      }

      if (typeof detail === 'string') {
        // Personalizar caso de credenciales inválidas
        if (detail.toLowerCase().includes('credenciales inválidas') ||
            detail.toLowerCase().includes('invalid credentials')) {
          detail = 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        }
      }

      // Asegurarse de no dejar basura en localStorage
      setToken(null);
      setUser(null);
      localStorage.removeItem('sr_token');
      localStorage.removeItem('sr_user');

      throw new Error(
        typeof detail === 'string'
          ? detail
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.'
      );
    }
  }

  // ========= REGISTER =========
  async function register(payload) {
    try {
      await apix.register(payload);
      await login(payload.email, payload.password);
    } catch (err) {
      let detail =
        err?.response?.data?.detail ??
        err?.detail ??
        err?.message ??
        'No se pudo registrar el usuario.';

      if (typeof detail === 'string' && detail.startsWith('{"detail"')) {
        try {
          const parsed = JSON.parse(detail);
          if (parsed.detail) detail = parsed.detail;
        } catch {}
      }

      // Ejemplo: si el backend dice que el correo ya existe
      if (typeof detail === 'string' &&
          (detail.toLowerCase().includes('ya existe') ||
           detail.toLowerCase().includes('already exists'))) {
        detail = 'Ya existe una cuenta con este correo.';
      }

      throw new Error(
        typeof detail === 'string'
          ? detail
          : 'No se pudo registrar el usuario.'
      );
    }
  }

  function logout() {
    const email = JSON.parse(localStorage.getItem('sr_user') || 'null')?.email;
    const key = `sr_cart_${email ?? 'anon'}`;
    setToken(null);
    setUser(null);
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    localStorage.removeItem('sr_cart');
    localStorage.removeItem(key);
  }

  // Guardar perfil (PUT /api/auth/me) y sincronizar header
  async function saveProfile(patch) {
    if (!token) return null;
    const updated = await apix.updateProfile(token, patch);
    setUser(updated);
    localStorage.setItem('sr_user', JSON.stringify(updated));
    return updated;
  }

  // Compat: alias “profile”/“setProfile”
  function setProfile(next) {
    setUser(next);
    localStorage.setItem('sr_user', JSON.stringify(next));
  }

  const firstName =
    (user?.nombre || '')
      .trim()
      .split(/\s+/)[0] || (user?.email ? user.email.split('@')[0] : null);

  // ===== Roles =====
  const isAdmin = (user?.rol === 'admin') || (user?.role === 'admin');
  const hasRole = (...roles) => {
    const current = user?.rol || user?.role || 'customer';
    return roles
      .map(String)
      .some(r => String(r).toLowerCase() === String(current).toLowerCase());
  };

  const value = useMemo(
    () => ({
      token,
      user,
      email: user?.email || null,
      isAuthenticated: Boolean(token),
      isAdmin,
      hasRole,
      authHeader: token ? `Bearer ${token}` : null,
      login,
      register,
      logout,
      // perfil
      profile: user,
      setProfile,
      saveProfile,
      firstName,
      ready,
    }),
    [token, user, firstName, isAdmin, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
