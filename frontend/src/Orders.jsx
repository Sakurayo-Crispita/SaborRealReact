// src/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

export default function Orders() {
  const { token, isAuthenticated } = useAuth();
  const nav = useNavigate();

  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});        // {orderId: true|false}
  const [details, setDetails] = useState({});          // {orderId: detailObj}
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState({}); // {orderId: true|false}
  const [msg, setMsg] = useState("");

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isAuthenticated) { nav("/login"); return; }
      try {
        setLoading(true);
        const data = await apix.myOrders(token);
        if (alive) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setMsg("No se pudieron cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated, token, nav]);

  async function toggle(order) {
    const id = order._id;
    const isOpen = !!expanded[id];
    if (isOpen) {
      setExpanded(prev => ({ ...prev, [id]: false }));
      return;
    }
    // abrir: si no tenemos detalle, pedirlo
    if (!details[id]) {
      try {
        setLoadingDetail(prev => ({ ...prev, [id]: true }));
        // GET /api/orders/{id} (tu backend lo tiene)
        const res = await fetch(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        setDetails(prev => ({ ...prev, [id]: d }));
      } catch {
        setMsg("No se pudo cargar el detalle del pedido.");
      } finally {
        setLoadingDetail(prev => ({ ...prev, [id]: false }));
      }
    }
    setExpanded(prev => ({ ...prev, [id]: true }));
  }

  function badge(status) {
    const s = String(status || "").toUpperCase();
    const map = {
      CREATED: "badge--created",
      PAID: "badge--paid",
      DELIVERED: "badge--delivered",
      CANCELLED: "badge--cancelled",
    };
    const cls = map[s] || "badge--created";
    return <span className={`status-badge ${cls}`}>{s}</span>;
  }

  function printOrder(id) {
    // Imprime la página (puedes usar un media print para estilizar la boleta)
    window.print();
  }

  return (
    <main id="main" style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Mis pedidos</h2>

      {loading && <p className="hint">Cargando pedidos…</p>}
      {msg && <p className="form-error" role="status">{msg}</p>}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ padding: 16 }}>
          <p>No tienes pedidos.</p>
        </div>
      )}

      <div className="receipt-list">
        {orders.map(o => {
          const id = o._id ?? o.code;
          const open = !!expanded[id];
          const created = new Date(o.createdAt ?? o.creadoAt ?? Date.now());
          const d = details[id];

          return (
            <article key={id} className="receipt card">
              <header className="receipt__header">
                <div className="receipt__left">
                  <div className="receipt__brand">Sabor Real</div>
                  <div className="receipt__meta">
                    <div><b>Pedido:</b> {o.code ?? "—"}</div>
                    <div><b>Fecha:</b> {created.toLocaleString("es-PE")}</div>
                  </div>
                </div>
                <div className="receipt__right">
                  {badge(o.status)}
                  <div className="receipt__total">
                    Total: <b>{PEN.format(Number(o.total ?? 0))}</b>
                  </div>
                  <div className="receipt__actions">
                    <button className="btn btn-outline-secondary" onClick={() => toggle(o)}>
                      {open ? "Ocultar boleta" : "Ver boleta"}
                    </button>
                    <button className="btn btn-primary" onClick={() => printOrder(id)}>
                      Imprimir
                    </button>
                  </div>
                </div>
              </header>

              {open && (
                <div className="receipt__body" aria-live="polite">
                  {loadingDetail[id] && <p className="hint">Cargando detalle…</p>}

                  {!loadingDetail[id] && d && (
                    <>
                      {/* Ítems */}
                      {Array.isArray(d.items) && d.items.length > 0 ? (
                        <div className="receipt__tableWrap">
                          <table className="receipt__table">
                            <thead>
                              <tr>
                                <th align="left">Producto</th>
                                <th>Qty</th>
                                <th>Precio</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {d.items.map((it, idx) => (
                                <tr key={idx}>
                                  <td>{it.nombre ?? it.producto_id}</td>
                                  <td align="center">{it.qty}</td>
                                  <td align="right">{PEN.format(Number(it.precio ?? 0))}</td>
                                  <td align="right">{PEN.format(Number(it.subtotal ?? (it.precio ?? 0) * it.qty))}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3} align="right"><b>Total</b></td>
                                <td align="right"><b>{PEN.format(Number(d.total ?? o.total ?? 0))}</b></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="hint">No hay detalle de ítems para este pedido.</p>
                      )}

                      {/* Entrega */}
                      {d.delivery && (
                        <div className="receipt__delivery">
                          <h4>Datos de entrega</h4>
                          <ul>
                            <li><b>Nombre:</b> {d.delivery.nombre || "—"}</li>
                            <li><b>Teléfono:</b> {d.delivery.telefono || "—"}</li>
                            <li><b>Dirección:</b> {d.delivery.direccion || "—"}</li>
                            {d.delivery.notas ? <li><b>Notas:</b> {d.delivery.notas}</li> : null}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
