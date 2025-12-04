// src/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

function sanitizePhone(value) {
  // deja solo dígitos, espacios, + y -
  return value.replace(/[^\d+\-\s]/g, '');
}

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  // si llegaste desde una ruta protegida, vuelve allí; si no, ve a "/"
  const from = loc.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      nav('/', { replace: true });
    }
  }, [isAuthenticated, nav]);

  function onChange(e) {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'telefono') {
      value = sanitizePhone(value);
    }

    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) throw new Error('Completa email y contraseña');
        await login(form.email, form.password);
      } else {
        if (!form.email || !form.password || !form.nombre) {
          throw new Error('Email, contraseña y nombre son obligatorios');
        }
        await register({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          telefono: form.telefono || null,
          direccion: form.direccion || null,
        });
      }
      // redirige al destino original (si lo hubo) o al catálogo
      nav(from, { replace: true });
    } catch (err) {
      let msg = err?.message || 'Ocurrió un error';

      // Si el backend envía algo como {"detail":"..."}
      if (msg.startsWith('{"detail"')) {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.detail) msg = parsed.detail;
        } catch {
          // ignore JSON parse error
        }
      }

      // Personalizar mensaje de credenciales
      if (msg.includes('Credenciales inválidas')) {
        msg = 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
      }

      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ marginBottom: 12 }}>
        {mode === 'login' ? 'Iniciar sesión' : 'Registrar'}
      </h2>
      {isAuthenticated && <p className="hint">Ya estás autenticado.</p>}

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: 16, display: 'grid', gap: 10 }}
      >
        {error && <div className="form-error">{error}</div>}

        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
            placeholder="tu@correo.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={onChange}
            placeholder="••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <small className="hint">Mínimo 6 caracteres.</small>
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label>Nombre</label>
              <input
                name="nombre"
                required
                value={form.nombre}
                onChange={onChange}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>

            <div>
              <label>Teléfono</label>
              <input
                name="telefono"
                type="tel"
                inputMode="numeric"
                pattern="[0-9+\- ]{6,}"   // validación extra del navegador
                value={form.telefono}
                onChange={onChange}
                placeholder="+51 999 999 999"
                autoComplete="tel"
              />
              <small className="hint">Solo números, espacios, + o -</small>
            </div>

            <div>
              <label>Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                placeholder="Calle 123"
                autoComplete="street-address"
              />
            </div>
          </>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button
        style={{ marginTop: 12 }}
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        Cambiar a {mode === 'login' ? 'registro' : 'login'}
      </button>

      <p className="hint" style={{ marginTop: 12 }}>
        <Link to="/">Ir al catálogo</Link>
      </p>
    </main>
  );
}
