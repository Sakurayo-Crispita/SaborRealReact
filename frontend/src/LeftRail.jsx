import { Link } from "react-router-dom";

export default function LeftRail() {
  return (
    <aside
      className="left-rail"
      aria-label="Navegación lateral e información de contacto"
    >
      {/* Flecha a Historia */}
      <Link
        to="/historia"
        className="lr-btn"
        aria-label="Ir a Historia de la panadería"
        title="Historia de la panadería"
      >
        {/* SVG flecha */}
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z"/>
        </svg>
      </Link>

      {/* Bloque de contacto */}
      <div className="lr-card">
        <div className="lr-title">Contacto</div>
        <a className="lr-link" href="tel:+51931412894" title="Llamar">
          +51 931412894
        </a>
        <a
          className="lr-link"
          href="https://maps.google.com/?q=Cajamarca%2C%20Per%C3%BA"
          target="_blank"
          rel="noreferrer"
          title="Ver en mapa"
        >
          Cajamarca, Perú
        </a>
      </div>
    </aside>
  );
}
