// src/ProductoCard.jsx
import { useEffect, useState } from 'react';
import * as api from './api';                  // ← usa funciones sueltas
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';   // ← para agregar al carrito

export default function ProductoCard({ p }) {
  const { token, user } = useAuth();
  const email = user?.email ?? 'usuario';
  const { add } = useCart();

  const [texto, setTexto] = useState('');
  const [rating, setRating] = useState(5);
  const [comentarios, setComentarios] = useState([]);

  async function cargarComentarios() {
    try {
      const list = await api.getComentarios(p._id);
      setComentarios(list ?? []);
    } catch (e) {
      console.error('getComentarios', e);
    }
  }

  useEffect(() => { cargarComentarios(); }, [p._id]);

  async function enviarComentario(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    try {
      await api.crearComentario(token, { producto_id: p._id, texto, rating: Number(rating) });
      setTexto('');
      setRating(5);
      await cargarComentarios();
    } catch (e) {
      alert(e.message || 'No se pudo publicar el comentario');
    }
  }

  return (
    <article style={{ border:'1px solid #2a2a2a', borderRadius:12, padding:16, background:'#151515' }}>
      <div style={{height:140, background:'#222', borderRadius:8, marginBottom:8, display:'grid', placeItems:'center'}}>
        {p.imagenUrl ? (
          <img src={p.imagenUrl} alt={p.nombre} style={{maxHeight:'100%', maxWidth:'100%'}}/>
        ) : (
          <span style={{color:'#999'}}>Sin imagen</span>
        )}
      </div>

      <h3 style={{margin:'4px 0'}}>{p.nombre}</h3>
      <small style={{color:'#aaa'}}>{p.categoria ?? 'Sin categoría'}</small>
      <p style={{margin:'8px 0', color:'#ddd'}}>{p.descripcion ?? '—'}</p>
      <strong style={{color:'#7CFC8A'}}>S/ {Number(p.precio).toFixed(2)}</strong>

      <div style={{marginTop:8}}>
        <button onClick={() => add(p, 1)}>Agregar al carrito</button>
      </div>

      {/* Comentarios */}
      <div style={{marginTop:12}}>
        <h4 style={{margin:'8px 0'}}>Comentarios</h4>
        {comentarios.length === 0 ? (
          <small style={{color:'#888'}}>Aún no hay comentarios.</small>
        ) : (
          <ul style={{paddingLeft:16, color:'#ddd'}}>
            {comentarios.map(c => (
              <li key={c._id}>
                <strong>{'★'.repeat(c.rating)}</strong> — {c.texto}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Caja de comentario solo con sesión */}
      {token ? (
        <form onSubmit={enviarComentario} style={{marginTop:12, display:'grid', gap:8}}>
          <small style={{color:'#aaa'}}>Comentando como <b>{email}</b></small>
          <textarea
            rows={3}
            value={texto}
            onChange={e=>setTexto(e.target.value)}
            placeholder="Escribe tu opinión..."
          />
          <label>
            Puntuación:
            <select
              value={rating}
              onChange={e=>setRating(Number(e.target.value))}
              style={{marginLeft:8}}
            >
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button type="submit">Publicar comentario</button>
        </form>
      ) : (
        <small style={{color:'#888'}}>Inicia sesión para comentar.</small>
      )}
    </article>
  );
}
