// src/Login.jsx
import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const { login, logout, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('demo@saborreal.com');
  const [password, setPassword] = useState('demo123');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setMsg('');
    setLoading(true);
    try {
      await login(email, password);
      setMsg('¡Sesión iniciada!');
    } catch (e) {
      setMsg('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <span>Sesión activa</span>
        <button type="button" onClick={logout}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
        placeholder="email"
        type="email"
        autoComplete="username"
      />
      <input
        value={password}
        onChange={e=>setPassword(e.target.value)}
        placeholder="password"
        type="password"
        autoComplete="current-password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
      {msg && <small style={{marginLeft:8}}>{msg}</small>}
    </form>
  );
}