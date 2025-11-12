// src/Admin.jsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

export default function Admin() {
  const { token, isAdmin } = useAuth();
  const [tab, setTab] = useState("productos"); // por ahora solo “productos”
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setMsg("");
      setLoading(true);
      try {
        if (tab === "productos") {
          const data = await apix.getProductos(""); // ✅ /api/productos
          setRows(Array.isArray(data) ? data : []);
        }
        // Si luego agregas pedidos/usuarios, aquí cargas con apix.myOrders(...) o tu endpoint real.
      } catch (e) {
        setMsg("No se pudieron cargar productos.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, isAdmin, token]);

  if (!isAdmin) {
    return (
      <main id="main" style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
        <h2 className="page-title">Panel de administración</h2>
        <p className="form-error">No tienes permisos de administrador.</p>
      </main>
    );
  }

  return (
    <main id="main" style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Panel de administración</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className={`btn ${tab === "productos" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setTab("productos")}
        >
          Productos
        </button>
        {/* Más pestañas cuando tengas endpoints reales:
        <button className="btn btn-outline-secondary" onClick={() => setTab("pedidos")}>Pedidos</button>
        <button className="btn btn-outline-secondary" onClick={() => setTab("usuarios")}>Usuarios</button>
        */}
      </div>

      {msg && <p className="form-error">{msg}</p>}
      {loading && <p className="hint">Cargando…</p>}

      {tab === "productos" && (
        <section className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b>Productos</b>
            <button className="btn btn-outline-secondary" disabled title="Próximamente">
              + Nuevo producto (WIP)
            </button>
          </div>

          <div className="receipt__tableWrap">
            <table className="receipt__table">
              <thead>
                <tr>
                  <th align="left">Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4}><small className="hint">Sin productos</small></td></tr>
                ) : rows.map(p => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td align="right">{PEN.format(Number(p.precio || 0))}</td>
                    <td align="center">{p.categoria || "—"}</td>
                    <td align="center">{p.disponible === false ? "No" : "Sí"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
