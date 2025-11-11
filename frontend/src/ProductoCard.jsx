// src/ProductoCard.jsx
import { useEffect, useState, useId } from 'react';
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
  const [busyAdd, setBusyAdd] = useState(false);
  const [busyCmt, setBusyCmt] = useState(false);
  const [msg, setMsg] = useState('');

  // ids accesibles
  const idText = useId();
  const idRating = useId();

  function clampStar(n) {
    const x = Number(n);
    return Number.isFinite(x) ? Math.min(5, Math.max(1, Math.trunc(x))) : 5;
  }

  async function cargarComentarios() {
    try {
      const data = await apix.getComentarios(p._id);
      setComentarios(Array.isArray(data) ? data : []);
    } catch {
      /* opcional: setMsg('No se pudieron cargar los comentarios') */
    }
  }
  useEffect(() => { cargarComentarios(); }, [p._id]);

  async function enviarComentario(e) {
    e.preventDefault();
    setMsg('');

    if (!token) {
      nav('/login', { state: { from: loc }, replace: true });
      return;
    }

    const t = texto.trim();
    if (t.length === 0) {
      setMsg('El comentario no puede estar vacío.');
      return;
    }
    if (t.length > 200) {
      setMsg('Máximo 200 caracteres.');
      return;
    }

    const r = clampStar(rating);
    if (r < 1 || r > 5) {
      setMsg('La puntuación debe estar entre 1 y 5 estrellas.');
      return;
    }

    try {
      setBusyCmt(true);
      await apix.createComentario(token, { producto_id: p._id, texto: t, rating: r });
      setTexto('');
      setRating(5);
      setMsg('💬 Comentario publicado.');
      await cargarComentarios();
    } catch (err) {
      setMsg(`❌ No se pudo publicar: ${err?.message || 'error'}`);
    } finally {
      setBusyCmt(false);
    }
  }

  async function handleAdd() {
    if (!token) {
      // recuerda desde dónde vino para volver después del login
      nav('/login', { state: { from: loc }, replace: true });
      return;
    }
    try {
      setBusyAdd(true);
      addItem(p, 1);
      setMsg('✅ Añadido al ticket.');
    } catch {
      setMsg('❌ No se pudo añadir al ticket.');
    } finally {
      setBusyAdd(false);
    }
  }

  const nombre = p.nombre ?? 'Producto';
  const precio = Number(p.precio ?? 0);

  return (
    <article className="card">
      {/* Imagen */}
      <div className="thumb" aria-label={`Imagen de ${nombre}`}>
        {p.imagenUrl ? (
          <img
            src={p.imagenUrl}
            alt={nombre}
            loading="lazy"
            decoding="async"
            width="800"
            height="500"
          />
        ) : (
          <span className="noimg">Sin imagen</span>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ margin: '6px 0' }}>{nombre}</h3>
          {p.categoria && <span className="badge">{p.categoria}</span>}
        </div>

        <p className="hint" style={{ margin: '6px 0 10px' }}>
          {p.descripcion ?? '—'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="price">${precio.toFixed(2)}</div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={busyAdd} aria-label={`Añadir ${nombre} al ticket`}>
            {busyAdd ? 'Añadiendo…' : 'Añadir al ticket'}
          </button>
        </div>

        {/* Comentarios */}
        <section aria-label="Comentarios" style={{ marginTop: 14 }}>
          <h4 style={{ margin: '8px 0' }}>
            Comentarios {comentarios.length > 0 ? `(${comentarios.length})` : ''}
          </h4>

          {comentarios.length === 0 ? (
            <small className="hint">Aún no hay comentarios.</small>
          ) : (
            <ul style={{ paddingLeft: 18, color: '#ddd', margin: 0 }}>
              {comentarios.map(c => (
                <li key={c._id} style={{ margin: '4px 0' }}>
                  <strong aria-label={`${c.rating} estrellas`}>{'★'.repeat(c.rating)}</strong>
                  {' '}— {c.texto}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Form comentario */}
        {token ? (
          <form onSubmit={enviarComentario} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <small className="hint">
              Comentando como <b>{email}</b>
            </small>

            <div className="form__grp">
              <label htmlFor={idText}>Escribe tu opinión (máx. 200)</label>
              <textarea
                id={idText}
                rows={3}
                maxLength={200}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder="Me gustó porque…"
              />
            </div>

            <div className="form__grp">
              <label htmlFor={idRating}>Puntuación</label>
              <select
                id={idRating}
                value={rating}
                onChange={e => setRating(clampStar(e.target.value))}
              >
                <option value={5}>5 — Excelente</option>
                <option value={4}>4 — Muy bueno</option>
                <option value={3}>3 — Bueno</option>
                <option value={2}>2 — Regular</option>
                <option value={1}>1 — Malo</option>
              </select>
            </div>

            <button className="btn btn-accent" type="submit" disabled={busyCmt}>
              {busyCmt ? 'Publicando…' : 'Publicar'}
            </button>
          </form>
        ) : (
          <small className="hint">Inicia sesión para comentar.</small>
        )}

        {/* Mensajes (accesibles) */}
        {msg && (
          <div className="pmodal__msg" role="status" aria-live="polite" style={{ marginTop: 8 }}>
            {msg}
          </div>
        )}
      </div>
    </article>
  );
}
