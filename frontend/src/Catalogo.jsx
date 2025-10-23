// src/Catalogo.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apix } from './api/api';
import { useAuth } from './AuthContext.jsx';
import Login from './Login';
import ProductoCard from './ProductoCard';

const VALID_CATS = new Set(['', 'pan', 'postre']); // en seed no hay "bebida"

export default function Catalogo() {
  const { isAuthenticated } = useAuth();

  // --- URL <-> estado ---
  const [params, setParams] = useSearchParams();
  const rawCat = params.get('cat') ?? '';
  const categoria = useMemo(
    () => (VALID_CATS.has(rawCat) ? rawCat : ''), // normaliza
    [rawCat]
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apix.getProductos(categoria)
      .then(d => { if (alive) setItems(Array.isArray(d) ? d : []); })
      .catch(err => { console.error('getProductos error:', err); if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [categoria]);

  function onChangeCategoria(e) {
    const v = e.target.value;
    if (v) setParams({ cat: v });
    else setParams({});
  }

  return (
    <main style={{ maxWidth: 1080, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui', color:'#eee' }}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap'}}>
        <h1 style={{margin:0}}>Sabor Real — Catálogo</h1>
        <Login />
      </header>

      {!isAuthenticated && (
        <small style={{color:'#aaa'}}>Inicia sesión para poder comentar productos.</small>
      )}

      <label style={{ display:'block', margin:'1rem 0' }}>
        Filtrar por categoría:{' '}
        <select value={categoria} onChange={onChangeCategoria}>
          <option value=''>Todas</option>
          <option value='pan'>Pan</option>
          <option value='postre'>Postre</option>
          {/* 'bebida' no está en el seed; agrégalo cuando tengas datos */}
        </select>
      </label>

      <small style={{color:'#aaa', display:'block', marginBottom:8}}>
        {loading ? 'Cargando…' : `${items.length} producto${items.length!==1?'s':''} encontrado${items.length!==1?'s':''}`}
      </small>

      {loading ? (
        <p>Cargando…</p>
      ) : items.length === 0 ? (
        <p>No hay productos para esta categoría.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
          {items.map(p => (
            <ProductoCard key={p._id || p.id || p.nombre} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
