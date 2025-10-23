import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: 'demo@saborreal.com',
    password: 'demo123',
    nombre: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function onChange(e){ setForm({...form, [e.target.name]: e.target.value}); }

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
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{maxWidth:520, margin:'2rem auto', padding:'0 1rem'}}>
      <h2 style={{marginBottom:12}}>{mode === 'login' ? 'Iniciar sesión' : 'Registrar'}</h2>
      {isAuthenticated && <p className="hint">Ya estás autenticado.</p>}

      <form onSubmit={onSubmit} className="card" style={{padding:16, display:'grid', gap:10}}>
        {error && <div className="form-error">{error}</div>}

        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"                /* ✅ solo correos válidos */
            required
            value={form.email}
            onChange={onChange}
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}              /* ✅ mínimo recomendado */
            value={form.password}
            onChange={onChange}
            placeholder="••••••"
          />
          <small className="hint">Mínimo 6 caracteres.</small>
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label>Nombre</label>
              <input
                name="nombre"
                required                   /* ✅ obligatorio */
                value={form.nombre}
                onChange={onChange}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label>Teléfono</label>
              <input
                name="telefono"
                type="tel"                 /* ✅ teclado numérico móvil */
                inputMode="numeric"
                pattern="[0-9+\- ]{6,}"   /* ✅ dígitos, +, -, espacio; mínimo 6 */
                value={form.telefono}
                onChange={onChange}
                placeholder="+51 999 999 999"
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
              />
            </div>
          </>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Procesando…' : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
        </button>
      </form>

      <button style={{marginTop:12}} onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>
        Cambiar a {mode === 'login' ? 'registro' : 'login'}
      </button>
    </main>
  );
}
