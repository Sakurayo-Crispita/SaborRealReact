import { useEffect, useState } from 'react';
import { apix } from './api/api';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';

export default function ProductoCard({ p }) {
  const { token, email } = useAuth();
  const { addItem } = useCart();
  const [texto, setTexto] = useState('');
  const [rating, setRating] = useState(5);
  const [comentarios, setComentarios] = useState([]);

  async function cargarComentarios() {
    try { setComentarios(await apix.getComentarios(p._id)); } catch {}
  }
  useEffect(() => { cargarComentarios(); }, [p._id]);

  async function enviarComentario(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await apix.createComentario(token, { producto_id: p._id, texto, rating: Number(rating) });
    setTexto(''); setRating(5);
    await cargarComentarios();
  }

  return (
    <article className="card">
      <div className="img">
        {p.imagenUrl
          ? <img src={p.imagenUrl} alt={p.nombre} style={{maxHeight:'100%', maxWidth:'100%', objectFit:'cover'}}/>
          : <span style={{color:'#999'}}>Sin imagen</span>}
      </div>

      <div style={{padding:'14px'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
          <h3 style={{margin:'6px 0'}}>{p.nombre}</h3>
          {p.categoria && <span className="badge">{p.categoria}</span>}
        </div>

        <p style={{margin:'6px 0 10px', color:'#cfd5e2'}}>{p.descripcion ?? '—'}</p>
        <div className="price">${Number(p.precio).toFixed(2)}</div>

        <div style={{marginTop:10}}>
          <button onClick={()=>addItem(p, 1)}>Añadir al ticket</button>
        </div>

        <div style={{marginTop:14}}>
          <h4 style={{margin:'8px 0'}}>Comentarios</h4>
          {comentarios.length === 0 ? (
            <small className="hint">Aún no hay comentarios.</small>
          ) : (
            <ul style={{paddingLeft:18, color:'#ddd', margin:0}}>
              {comentarios.map(c => (
                <li key={c._id} style={{margin:'4px 0'}}>
                  <strong>{'★'.repeat(c.rating)}</strong> — {c.texto}
                </li>
              ))}
            </ul>
          )}
        </div>

        {token ? (
          <form onSubmit={enviarComentario} style={{marginTop:12, display:'grid', gap:8}}>
            <small className="hint">Comentando como <b>{email}</b></small>
            <textarea
              rows={3}
              required
              maxLength={200}
              value={texto}
              onChange={e=>setTexto(e.target.value)}
              placeholder="Escribe tu opinión (máx. 200 caracteres)…"
            />
            <label>
              Puntuación:{' '}
              <select value={rating} onChange={e=>setRating(e.target.value)}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
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
