// src/Catalogo.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apix } from './api/api';
import { useAuth } from './AuthContext.jsx';
import ProductoCard from './ProductoCard';

const VALID_CATS = new Set(['', 'pan', 'postre']); // en el seed solo hay estas

export default function Catalogo() {
  const { isAuthenticated } = useAuth();

  const [params, setParams] = useSearchParams();
  const rawCat = params.get('cat') ?? '';
  const categoria = useMemo(
    () => (VALID_CATS.has(rawCat) ? rawCat : ''),
    [rawCat]
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); // 🔍 texto de búsqueda

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apix
      .getProductos(categoria)
      .then((d) => {
        if (alive) setItems(Array.isArray(d) ? d : []);
      })
      .catch((err) => {
        console.error('getProductos error:', err);
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [categoria]);

  function onChangeCategoria(e) {
    const v = e.target.value;
    if (v) setParams({ cat: v });
    else setParams({});
  }

  // 🔍 productos filtrados por nombre (además de la categoría que ya viene del backend)
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((p) =>
      String(p.nombre || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const count = filteredItems.length;

  return (
    <main
      style={{
        maxWidth: 1080,
        margin: '2rem auto',
        padding: '0 1rem',
        fontFamily: 'system-ui',
        color: '#eee',
      }}
    >
      <h1 style={{ margin: '0 0 12px' }}>Sabor Real — Catálogo</h1>

      {!isAuthenticated && (
        <small style={{ color: '#aaa', display: 'block', marginBottom: 12 }}>
          Inicia sesión para poder comentar productos.
        </small>
      )}

      {/* Filtro por categoría + buscador por nombre */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          margin: '1rem 0',
          alignItems: 'center',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>Filtrar por categoría:</span>
          <select value={categoria} onChange={onChangeCategoria}>
            <option value=''>Todas</option>
            <option value='pan'>Pan</option>
            <option value='postre'>Postre</option>
            {/* Cuando tengas productos de bebida, añade 'bebida' al seed y a VALID_CATS */}
          </select>
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por nombre…"
          style={{
            flex: 1,
            minWidth: 220,
            padding: '6px 10px',
            borderRadius: 9999,
            border: '1px solid rgba(0,0,0,.08)',
            color: '#222',
          }}
        />
      </div>

      <small style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
        {loading
          ? 'Cargando…'
          : `${count} producto${count !== 1 ? 's' : ''} encontrado${
              count !== 1 ? 's' : ''
            }`}
      </small>

      {loading ? (
        <p>Cargando…</p>
      ) : count === 0 ? (
        <p>No hay productos que coincidan con la búsqueda.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {filteredItems.map((p) => (
            <ProductoCard key={p._id || p.id || p.nombre} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
