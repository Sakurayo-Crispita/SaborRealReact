// src/ProductoCard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apix } from './api/api';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';

export default function ProductoCard({ p }) {
  const { token, email } = useAuth();
  const { addItem } = useCart();
  const nav = useNavigate();
  const loc = useLocation();

  const [texto, setTexto] = useState('');
  const [rating, setRating] = useState(5);
  const [comentarios, setComentarios] = useState([]);

  async function cargarComentarios() {
    try {
      const data = await apix.getComentarios(p._id);
      setComentarios(data);
    } catch {}
  }
  useEffect(() => { cargarComentarios(); }, [p._id]);

  async function enviarComentario(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await apix.createComentario(token, { producto_id: p._id, texto, rating: Number(rating) });
    setTexto('');
    setRating(5);
    await cargarComentarios();
  }

  function handleAdd() {
    if (!token) {
      // Si no está logueado, manda a /login y recuerda desde dónde vino
      nav('/login', { state: { from: loc }, replace: true });
      return;
    }
    addItem(p, 1);
  }

  return (
    <article className="card">
      {/* IMAGEN */}
      <div className="thumb">
        {p.imagenUrl ? (
          <img
            src={p.imagenUrl}
            alt={p.nombre}
            loading="lazy"
            width="800"
            height="500"
          />
        ) : (
          <span className="noimg">Sin imagen</span>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ margin: '6px 0' }}>{p.nombre}</h3>
          {p.categoria && <span className="badge">{p.categoria}</span>}
        </div>

        <p style={{ margin: '6px 0 10px', color: '#cfd5e2' }}>{p.descripcion ?? '—'}</p>
        <div className="price">${Number(p.precio).toFixed(2)}</div>

        <div style={{ marginTop: 10 }}>
          <button onClick={handleAdd}>Añadir al ticket</button>
        </div>

        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: '8px 0' }}>Comentarios</h4>
          {comentarios.length === 0 ? (
            <small className="hint">Aún no hay comentarios.</small>
          ) : (
            <ul style={{ paddingLeft: 18, color: '#ddd', margin: 0 }}>
              {comentarios.map(c => (
                <li key={c._id} style={{ margin: '4px 0' }}>
                  <strong>{'★'.repeat(c.rating)}</strong> — {c.texto}
                </li>
              ))}
            </ul>
          )}
        </div>

        {token ? (
          <form onSubmit={enviarComentario} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <small className="hint">
              Comentando como <b>{email}</b>
            </small>
            <textarea
              rows={3}
              required
              maxLength={200}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escribe tu opinión (máx. 200 caracteres)…"
            />
            <label>
              Puntuación:{' '}
              <select value={rating} onChange={e => setRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Publicar</button>
          </form>
        ) : (
          <small className="hint">Inicia sesión para comentar.</small>
        )}
      </div>
    </article>
  );
}
