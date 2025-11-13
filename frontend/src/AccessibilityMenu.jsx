// src/AccessibilityMenu.jsx
import { useEffect, useState } from "react";

const PRESETS = [
  { id: "normal",        label: "Normal" },
  { id: "high-contrast", label: "Alto contraste" },
  { id: "protanopia",    label: "Protanopia" },
  { id: "deuteranopia",  label: "Deuteranopia" },
  { id: "tritanopia",    label: "Tritanopia" },
];

function applyPreset(id) {
  const root = document.documentElement;
  root.dataset.preset = id;          
  localStorage.setItem("a11y:preset", id);
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("normal");
  useEffect(() => {
    const saved = localStorage.getItem("a11y:preset") || "normal";
    setPreset(saved);
    applyPreset(saved);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onPick(id) {
    setPreset(id);
    applyPreset(id);
    setOpen(false);
  }

  return (
    <>
      <button
        aria-label="Accesibilidad"
        className="a11y-fab"
        onClick={() => setOpen(o => !o)}
        title="Accesibilidad"
      >
        🛠️
      </button>

      {open && (
        <div className="a11y-fixed">
          <div
            className="a11y-card"
            role="menu"
            aria-label="Opciones de accesibilidad"
          >
            <div className="a11y-title">Accesibilidad</div>
            <div className="a11y-list">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`a11y-item ${preset === p.id ? "is-active" : ""}`}
                  onClick={() => onPick(p.id)}
                  aria-pressed={preset === p.id}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="a11y-footer">
              <button className="a11y-close" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
