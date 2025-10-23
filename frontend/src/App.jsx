// src/App.jsx
import { Link, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apix } from './api/api';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import Catalogo from './Catalogo.jsx'
import Login from './Login.jsx';
import Checkout from './Checkout.jsx';
import ProductoCard from './ProductoCard.jsx';
// ❌ NO importes Catalogo desde archivo si lo defines aquí
// import Catalogo from './Catalogo.jsx';

function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const categoria = params.get('cat') || '';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apix.getProductos(categoria);
        if (alive) setItems(data);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [categoria]);

  return (
    <main style={{ maxWidth: 1080, margin:'2rem auto', padding:'0 1rem', color:'#eee' }}>
      <label style={{ display:'block', margin:'1rem 0' }}>
        Filtrar por categoría:{' '}
        <select
          value={categoria}
          onChange={(e)=> setParams(e.target.value ? { cat: e.target.value } : {})}
        >
          <option value=''>Todas</option>
          <option value='pan'>Pan</option>
          <option value='postre'>Postre</option>
          <option value='bebida'>Bebida</option>
        </select>
      </label>

      {loading ? <p>Cargando…</p> : (
        items.length === 0 ? <p>No hay productos.</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
            {items.map(p => <ProductoCard key={p._id} p={p} />)}
          </div>
        )
      )}
    </main>
  );
}

function Header() {
  const { isAuthenticated, email, logout } = useAuth();
  const { items, total } = useCart();

  return (
    <header style={{display:'flex', gap:16, alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#111', color:'#eee'}}>
      <Link to="/" style={{color:'#fff', textDecoration:'none', fontWeight:700}}>Sabor Real</Link>
      <nav style={{display:'flex', gap:12}}>
        <Link to="/" style={{color:'#ccc'}}>Catálogo</Link>
        <Link to="/checkout" style={{color:'#ccc'}}>Ticket ({items.length}) — ${total.toFixed(2)}</Link>
        <Link to="/orders" style={{color:'#ccc'}}>Mis pedidos</Link>
      </nav>
      <div>
        {isAuthenticated ? (
          <>
            <small style={{marginRight:8}}>Hola, {email}</small>
            <button onClick={logout}>Salir</button>
          </>
        ) : (
          <Link to="/login"><button>Entrar</button></Link>
        )}
      </div>
    </header>
  );
}

function Orders() {
  const { token, isAuthenticated } = useAuth();
  const [list, setList] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isAuthenticated) { nav('/login'); return; }
      try {
        const data = await apix.myOrders(token);
        if (alive) setList(data);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [isAuthenticated, token, nav]);

  return (
    <main style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem', color:'#eee'}}>
      <h2>Mis pedidos</h2>
      {list.length === 0 ? <p>No tienes pedidos.</p> : (
        <ul style={{lineHeight:1.8}}>
          {list.map(o => (
            <li key={o._id}>
              <b>{o.code}</b> — {o.status} — ${o.total.toFixed(2)} — {new Date(o.creadoAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </>
  );
}
