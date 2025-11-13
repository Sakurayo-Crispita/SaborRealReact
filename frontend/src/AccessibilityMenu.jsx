import { useEffect, useState } from "react";

const THEMES = [
  { id: "",             label: "Predeterminado" },
  { id: "cb-safe",      label: "Paleta segura (daltonismo)" },
  { id: "high-contrast",label: "Alto contraste" },
  { id: "desaturated",  label: "Desaturado" },
];

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "");

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-outline-secondary"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Accesibilidad
      </button>

      {open && (
        <div role="menu" className="card" style={{ position: "absolute", right: 0, marginTop: 8, padding: 10, minWidth: 260, zIndex: 30 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label className="hint" style={{ fontWeight: 600 }}>Tema de visualización</label>
            <select
              aria-label="Seleccionar tema de accesibilidad"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                onChange={(e) => document.body.classList.toggle("underline-links", e.target.checked)}
              />
              Subrayar enlaces
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                onChange={(e) => document.body.classList.toggle("large-text", e.target.checked)}
              />
              Texto grande
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
