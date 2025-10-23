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

  const id = p._id || p.id;
  const nombre = p.nombre ?? p.title ?? "Producto";
  const precio = Number(p.precio ?? p.price ?? 0);
  const categoria = p.categoria ?? p.category ?? "—";
  const imagenUrl = p.imagenUrl ?? p.image ?? null;

  async function cargarComentarios() {
    try { setComentarios(await apix.getComentarios(id)); } catch {}
  }
  useEffect(() => { cargarComentarios(); }, [id]);

  async function enviarComentario(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await apix.createComentario(token, { producto_id: id, texto, rating: Number(rating) });
    setTexto(''); setRating(5);
    await cargarComentarios();
  }

  return (
    <article style={{ border:'1px solid #2a2a2a', borderRadius:12, padding:16, background:'#151515' }}>
      <div style={{height:140, background:'#222', borderRadius:8, marginBottom:8, display:'grid', placeItems:'center'}}>
        {imagenUrl ? <img src={imagenUrl} alt={nombre} style={{maxHeight:'100%', maxWidth:'100%'}}/> : <span style={{color:'#999'}}>Sin imagen</span>}
      </div>

      <h3 style={{margin:'4px 0'}}>{nombre}</h3>
      <small style={{color:'#aaa'}}>{categoria}</small>
      <p style={{margin:'8px 0', color:'#ddd'}}>{p.descripcion ?? '—'}</p>
      <strong style={{color:'#7CFC8A'}}>${precio.toFixed(2)}</strong>

      <div style={{marginTop:10}}>
        <button onClick={()=>addItem({_id: id, nombre, precio, categoria, imagenUrl}, 1)}>Añadir al ticket</button>
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
