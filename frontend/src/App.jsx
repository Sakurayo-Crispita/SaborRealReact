// src/App.jsx
import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext.jsx'; // ✅ SOLO useAuth (no importes AuthProvider aquí)
import Login from './Login';
import ProductoCard from './ProductoCard';

function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getProductos(categoria)
      .then(d => { if (alive) setItems(d); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [categoria]);

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
        <select value={categoria} onChange={(e)=>setCategoria(e.target.value)}>
          <option value=''>Todas</option>
          <option value='pan'>Pan</option>
          <option value='postre'>Postre</option>
          <option value='bebida'>Bebida</option>
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
          {items.map(p => <ProductoCard key={p._id} p={p} />)}
        </div>
      )}
    </main>
  );
}

export default function App() {
  return <Catalogo />;
}
