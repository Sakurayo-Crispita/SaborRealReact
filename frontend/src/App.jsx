// src/App.jsx
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apix } from './api/api';
import LeftRail from "./LeftRail";
import Historia from "./Historia";
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import Catalogo from './Catalogo.jsx';
import Login from './Login.jsx';
import Checkout from './Checkout.jsx';

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
              <b>{o.code}</b> — {o.status} — ${Number(o.total).toFixed(2)} — {new Date(o.creadoAt).toLocaleString()}
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
      <LeftRail /> 
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/historia" element={<Historia />} />
      </Routes>
    </>
  );
}
