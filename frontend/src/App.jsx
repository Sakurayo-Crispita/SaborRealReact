// src/App.jsx
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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
      {/* Link de salto accesible */}
      <a className="skiplink" href="#main">Saltar al contenido</a>

      <Link to="/" className="site-header__brand">Sabor Real</Link>

      <nav className="site-header__nav" aria-label="Navegación principal">
        <Link to="/">Catálogo</Link>
        <Link to="/checkout">Ticket ({items.length}) — S/ {total.toFixed(2)}</Link>
        <Link to="/orders">Mis pedidos</Link>
      </nav>

      <div className="site-header__right">
        {isAuthenticated ? (
          <>
            <div
              className="avatarchip"
              onClick={onOpenProfile}
              role="button"
              tabIndex={0}
              title="Abrir perfil"
              onKeyDown={(e)=> (e.key==='Enter'||e.key===' ') && onOpenProfile()}
              aria-label={`Abrir perfil de ${firstName}`}
            >
              <div className="avatarchip__img">
                {avatarUrl
                  ? <img src={avatarUrl} alt={`Avatar de ${firstName}`} />
                  : <span className="avatarchip__ph" aria-hidden="true">{initial}</span>}
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

  // Formateador de moneda local (PEN)
  const PEN = useMemo(
    () => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }),
    []
  );

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
    <section style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem', color:'#2a2a2a'}}>
      <h2>Mis pedidos</h2>
      {list.length === 0 ? <p>No tienes pedidos.</p> : (
        <ul style={{lineHeight:1.8, paddingLeft: '1rem'}}>
          {list.map(o => (
            <li key={o._id ?? o.code}>
              <b>{o.code ?? "—"}</b> — {o.status ?? "sin estado"} — {PEN.format(Number(o.total ?? 0))} — {
                new Date(o.createdAt ?? o.creadoAt ?? o.fecha ?? Date.now()).toLocaleString('es-PE')
              }
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <>
      <Header onOpenProfile={() => setOpenProfile(true)} />
      <LeftRail />

      {/* Landmarks: el main tiene id="main" para el skiplink */}
      <div role="none"> {/* wrapper opcional para layout */}
        <Routes>
          <Route path="/" element={<main id="main"><Catalogo /></main>} />
          <Route path="/login" element={<main id="main"><Login /></main>} />
          <Route path="/checkout" element={<main id="main"><Checkout /></main>} />
          <Route path="/orders" element={<main id="main"><Orders /></main>} />
          <Route path="/historia" element={<main id="main"><Historia /></main>} />
        </Routes>
      </div>

      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
    </>
  );
}