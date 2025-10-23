// src/Login.jsx
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
  function onChange(e){ setForm({...form, [e.target.name]: e.target.value}); }

  async function onSubmit(e) {
    e.preventDefault();
    if (mode === 'login') {
      await login(form.email, form.password);
    } else {
      await register({
        email: form.email,
        password: form.password,
        nombre: form.nombre || 'Cliente',
        telefono: form.telefono || null,
        direccion: form.direccion || null,
      });
    }
  }

  return (
    <main style={{maxWidth:500, margin:'2rem auto', padding:'0 1rem', color:'#eee'}}>
      <h2>{mode === 'login' ? 'Iniciar sesión' : 'Registrar'}</h2>
      {isAuthenticated && <p>Ya estás autenticado.</p>}
      <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
        <input name="email" value={form.email} onChange={onChange} placeholder="email" />
        <input name="password" type="password" value={form.password} onChange={onChange} placeholder="password" />
        {mode === 'register' && (
          <>
            <input name="nombre" value={form.nombre} onChange={onChange} placeholder="nombre" />
            <input name="telefono" value={form.telefono} onChange={onChange} placeholder="teléfono (opcional)" />
            <input name="direccion" value={form.direccion} onChange={onChange} placeholder="dirección (opcional)" />
          </>
        )}
        <button type="submit">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>

      <button style={{marginTop:12}} onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>
        Cambiar a {mode === 'login' ? 'registro' : 'login'}
      </button>
    </main>
  );
}
