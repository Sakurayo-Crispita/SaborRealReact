import { useState } from "react";

export default function LeftRail() {
  const [open, setOpen] = useState(false);

  return (
    <aside className={`lr ${open ? "lr--open" : "lr--closed"}`} aria-label="Burbuja lateral">
      {/* flecha (único elemento visible cuando está cerrado) */}
      <button
        className="lr__toggle"
        aria-label={open ? "Ocultar información" : "Mostrar información"}
        title={open ? "Ocultar" : "Mostrar"}
        onClick={() => setOpen(v => !v)}
      >
        {/* cerrado: ▶ ; abierto: ◀ */}
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            // flecha a la izquierda (cerrar)
            <path fill="currentColor" d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z"/>
          ) : (
            // flecha a la derecha (abrir)
            <path fill="currentColor" d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13H4a1 1 0 1 1 0-2h9.59L9.3 6.7a1 1 0 1 1 1.4-1.42l6 6a1 1 0 0 1 0 1.42l-6 6a1 1 0 0 1-1.4 0Z"/>
          )}
        </svg>
      </button>

      {/* burbuja flotante (solo visible cuando open=true) */}
      <div className="lr__bubble" role="dialog" aria-modal="false">
        <div className="lr__title">Historia de Sabor Real</div>
        <p className="lr__text">
          (Aquí un resumen breve de la historia de la panadería: origen, años,
          recetas familiares, hitos… Puedes ampliar cuando tengas más material.)
        </p>

        <hr className="lr__divider" />

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
    </aside>
  );
}
