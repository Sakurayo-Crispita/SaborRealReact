// src/LeftRail.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function LeftRail() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`lr ${open ? "lr--open" : "lr--closed"}`}
      aria-label="Panel lateral"
    >
      {/* Botón/solapa para abrir/cerrar */}
      <button
        className="lr__toggle"
        aria-label={open ? "Ocultar panel" : "Mostrar panel"}
        title={open ? "Ocultar panel" : "Mostrar panel"}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Flecha cambia de dirección */}
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          {/* si está cerrado, flecha a la derecha (abrir); si abierto, flecha a la izquierda (cerrar) */}
          {open ? (
            <path
              fill="currentColor"
              d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z"
            />
          ) : (
            <path
              fill="currentColor"
              d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13H4a1 1 0 1 1 0-2h9.59L9.3 6.7a1 1 0 1 1 1.4-1.42l6 6a1 1 0 0 1 0 1.42l-6 6a1 1 0 0 1-1.4 0Z"
            />
          )}
        </svg>
      </button>

      {/* Contenido del panel */}
      <div className="lr__panel">
        <div className="lr__section">
          <div className="lr__title">Sabor Real</div>
          <Link to="/historia" className="lr__link">Historia de la panadería</Link>
        </div>

        <div className="lr__section">
          <div className="lr__title">Contacto</div>
          <a className="lr__link" href="tel:+51931412894">+51 931412894</a>
          <a
            className="lr__link"
            href="https://maps.google.com/?q=Cajamarca%2C%20Per%C3%BA"
            target="_blank"
            rel="noreferrer"
          >
            Cajamarca, Perú
          </a>
        </div>
      </div>
    </aside>
  );
}
