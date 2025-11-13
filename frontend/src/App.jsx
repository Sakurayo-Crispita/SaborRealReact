// src/App.jsx
import { Link, Route, Routes } from 'react-router-dom';
import { useState } from 'react';

import LeftRail from "./LeftRail";
import Historia from "./Historia";
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import Catalogo from './Catalogo.jsx';
import Login from './Login.jsx';
import Checkout from './Checkout.jsx';
import Orders from './Orders.jsx';
import ProfileModal from './ProfileModal.jsx';
import AccessibilityFab from "./AccessibilityFab.jsx";

// 🔐 Admin
import AdminRoute from "./AdminRoute.jsx";
import Admin from "./Admin.jsx";

function Header({ onOpenProfile }) {
  const { isAuthenticated, isAdmin, firstName, user, logout } = useAuth();
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
        {isAdmin && <Link to="/admin">Admin</Link>}
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

export default function App() {
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <>
      <Header onOpenProfile={() => setOpenProfile(true)} />
      <LeftRail />

      {/* Landmarks: el main tiene id="main" para el skiplink */}
      <div role="none">
        <Routes>
          <Route path="/" element={<main id="main"><Catalogo /></main>} />
          <Route path="/login" element={<main id="main"><Login /></main>} />
          <Route path="/checkout" element={<main id="main"><Checkout /></main>} />
          <Route path="/orders" element={<main id="main"><Orders /></main>} />
          <Route path="/historia" element={<main id="main"><Historia /></main>} />

          {/* 🔐 Ruta protegida Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <main id="main"><Admin /></main>
              </AdminRoute>
            }
          />
        </Routes>
      </div>

      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
      <AccessibilityMenu />
    </>
  );
}
