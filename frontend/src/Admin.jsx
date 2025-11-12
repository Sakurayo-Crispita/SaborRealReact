// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

function Tabs({ current, onChange }) {
  const tabs = [
    ["productos", "Productos"],
    ["pedidos", "Pedidos"],
    ["clientes", "Clientes"],
  ];
  return (
    <div className="admin-tabs">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          className={`admin-tab ${current === key ? "is-active" : ""}`}
          onClick={() => onChange(key)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState("productos");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // estados por pestaña
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  async function loadProductos() {
    setLoading(true); setMsg("");
    try {
      const list = await apix.adminListProducts(token);
      setProductos(Array.isArray(list) ? list : []);
    } catch (e) {
      setMsg("No se pudieron cargar productos.");
    } finally { setLoading(false); }
  }
  async function loadPedidos() {
    setLoading(true); setMsg("");
    try {
      const list = await apix.adminListOrders(token);
      setPedidos(Array.isArray(list) ? list : []);
    } catch (e) {
      setMsg("No se pudieron cargar pedidos.");
    } finally { setLoading(false); }
  }
  async function loadClientes() {
    setLoading(true); setMsg("");
    try {
      const list = await apix.adminListClients(token);
      setClientes(Array.isArray(list) ? list : []);
    } catch (e) {
      setMsg("No se pudieron cargar clientes.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === "productos") loadProductos();
    if (tab === "pedidos")   loadPedidos();
    if (tab === "clientes")  loadClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  // === Acciones mínimas ===
  async function onToggleDisponible(p) {
    try {
      await apix.adminUpsertProduct(token, { _id: p._id, disponible: !p.disponible });
      await loadProductos();
    } catch { setMsg("No se pudo actualizar el producto."); }
  }
  async function onDeleteProduct(p) {
    if (!confirm(`Eliminar "${p.nombre}"?`)) return;
    try {
      await apix.adminDeleteProduct(token, p._id);
      await loadProductos();
    } catch { setMsg("No se pudo eliminar el producto."); }
  }
  async function onOrderStatus(o, next) {
    try {
      await apix.adminUpdateOrderStatus(token, o._id, next);
      await loadPedidos();
    } catch { setMsg("No se pudo actualizar el estado."); }
  }

  return (
    <main id="main" style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Panel de administración</h2>

      <Tabs current={tab} onChange={setTab} />
      {msg && <p className="form-error" role="status">{msg}</p>}
      {loading && <p className="hint">Cargando…</p>}

      {/* === Productos === */}
      {tab === "productos" && !loading && (
        <div className="card" style={{ padding: 12 }}>
          <div className="admin-actions">
            <button className="btn btn-primary" onClick={() => onToggleDisponible({ _id: null })} disabled>
              + Nuevo producto (WIP)
            </button>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Disponible</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td>{PEN.format(Number(p.precio || 0))}</td>
                    <td>{p.categoria || "—"}</td>
                    <td>
                      <button className="btn btn-outline-secondary" onClick={() => onToggleDisponible(p)}>
                        {p.disponible ? "Sí" : "No"}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-accent" disabled>Editar</button>{" "}
                      <button className="btn btn-primary" onClick={() => onDeleteProduct(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr><td colSpan={5}><small className="hint">Sin productos</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Pedidos === */}
      {tab === "pedidos" && !loading && (
        <div className="card" style={{ padding: 12 }}>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(o => {
                  const created = new Date(o.createdAt ?? o.creadoAt ?? Date.now());
                  const estado = String(o.status || "").toUpperCase();
                  return (
                    <tr key={o._id ?? o.code}>
                      <td>{o.code ?? "—"}</td>
                      <td>{created.toLocaleString("es-PE")}</td>
                      <td>{PEN.format(Number(o.total || 0))}</td>
                      <td>{estado}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn btn-outline-secondary" onClick={() => onOrderStatus(o, "PAID")}>Marcar pagado</button>{" "}
                        <button className="btn btn-outline-secondary" onClick={() => onOrderStatus(o, "DELIVERED")}>Entregado</button>{" "}
                        <button className="btn btn-primary" onClick={() => onOrderStatus(o, "CANCELLED")}>Cancelar</button>
                      </td>
                    </tr>
                  );
                })}
                {pedidos.length === 0 && (
                  <tr><td colSpan={5}><small className="hint">Sin pedidos</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Clientes === */}
      {tab === "clientes" && !loading && (
        <div className="card" style={{ padding: 12 }}>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c._id}>
                    <td>{c.nombre || "—"}</td>
                    <td>{c.email}</td>
                    <td>{c.rol || c.role || "customer"}</td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr><td colSpan={3}><small className="hint">Sin clientes</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
