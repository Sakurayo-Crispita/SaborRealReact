// src/ProductoCard.jsx
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
    <article style={{ border:'1px solid #2a2a2a', borderRadius:12, padding:16, background:'#151515' }}>
      <div style={{height:140, background:'#222', borderRadius:8, marginBottom:8, display:'grid', placeItems:'center'}}>
        {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{maxHeight:'100%', maxWidth:'100%'}}/> : <span style={{color:'#999'}}>Sin imagen</span>}
      </div>

      <h3 style={{margin:'4px 0'}}>{p.nombre}</h3>
      <small style={{color:'#aaa'}}>{p.categoria ?? 'Sin categoría'}</small>
      <p style={{margin:'8px 0', color:'#ddd'}}>{p.descripcion ?? '—'}</p>
      <strong style={{color:'#7CFC8A'}}>${Number(p.precio).toFixed(2)}</strong>

      <div style={{marginTop:10}}>
        <button onClick={()=>addItem(p, 1)}>Añadir al ticket</button>
      </div>

      <div style={{marginTop:12}}>
        <h4 style={{margin:'8px 0'}}>Comentarios</h4>
        {comentarios.length === 0 ? (
          <small style={{color:'#888'}}>Aún no hay comentarios.</small>
        ) : (
          <ul style={{paddingLeft:16, color:'#ddd'}}>
            {comentarios.map(c => (
              <li key={c._id}><strong>{'★'.repeat(c.rating)}</strong> — {c.texto}</li>
            ))}
          </ul>
        )}
      </div>

      {token ? (
        <form onSubmit={enviarComentario} style={{marginTop:12, display:'grid', gap:8}}>
          <small style={{color:'#aaa'}}>Comentando como <b>{email}</b></small>
          <textarea rows={3} value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribe tu opinión..." />
          <label>
            Puntuación:
            <select value={rating} onChange={e=>setRating(e.target.value)} style={{marginLeft:8}}>
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button type="submit">Publicar</button>
        </form>
      ) : (
        <small style={{color:'#888'}}>Inicia sesión para comentar.</small>
      )}
    </article>
  );
}
