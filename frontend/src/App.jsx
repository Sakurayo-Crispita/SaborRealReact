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
import ProfileModal from './ProfileModal.jsx'; // <-- NUEVO

function Header({ onOpenProfile }) {
  const { isAuthenticated, firstName, user, logout } = useAuth();
  const { items, total } = useCart();
  const avatarUrl = user?.avatarUrl || null;
  const initial = (firstName || 'U')[0]?.toUpperCase();

  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">Sabor Real</Link>

      <nav className="site-header__nav">
        <Link to="/">Catálogo</Link>
        <Link to="/checkout">Ticket ({items.length}) — ${total.toFixed(2)}</Link>
        <Link to="/orders">Mis pedidos</Link>
      </nav>

      <div className="site-header__right">
        {isAuthenticated ? (
          <>
            <div className="avatarchip" onClick={onOpenProfile} role="button" tabIndex={0}
                 title="Abrir perfil"
                 onKeyDown={(e)=> (e.key==='Enter'||e.key===' ') && onOpenProfile()}>
              <div className="avatarchip__img">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" />
                  : <span className="avatarchip__ph">{initial}</span>}
              </div>
              <span className="avatarchip__label">Hola, {firstName}</span>
            </div>
            <button className="btn btn-accent" onClick={onOpenProfile}>Mi perfil</button>
            <button className="btn btn-primary" onClick={logout}>Salir</button>
          </>
        ) : (
          <Link to="/login"><button className="btn btn-primary">Entrar</button></Link>
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
        if (alive) setList(Array.isArray(data) ? data : []);
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
            <li key={o._id ?? o.code}>
              <b>{o.code ?? "—"}</b> — {o.status ?? "sin estado"} — ${Number(o.total ?? 0).toFixed(2)} — {
                new Date(o.createdAt ?? o.creadoAt ?? o.fecha ?? Date.now()).toLocaleString()
              }
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function App() {
  const [openProfile, setOpenProfile] = useState(false);  // <-- estado modal

  return (
    <>
      <Header onOpenProfile={() => setOpenProfile(true)} />  {/* pasa prop */}
      <LeftRail /> 
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/historia" element={<Historia />} />
      </Routes>

      {/* Modal */}
      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
    </>
  );
}
