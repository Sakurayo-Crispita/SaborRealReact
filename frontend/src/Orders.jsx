// src/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

export default function Orders() {
  const { token, isAuthenticated } = useAuth();
  const nav = useNavigate();

  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});          // {orderId: bool}
  const [details, setDetails] = useState({});            // {orderId: detailObj}
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState({});// {orderId: bool}
  const [msg, setMsg] = useState("");
  const [printId, setPrintId] = useState(null);          // <- para imprimir sólo una boleta

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
      } catch {
        setMsg("No se pudieron cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated, token, nav]);

  async function toggle(order) {
    const id = order._id ?? order.id ?? order.code;
    const isOpen = !!expanded[id];
    if (isOpen) { setExpanded(p => ({ ...p, [id]: false })); return; }

    // Cargar detalle si no existe
    if (!details[id]) {
      try {
        setLoadingDetail(p => ({ ...p, [id]: true }));
        const d = await apix.orderDetail(token, id);   // requiere apix.orderDetail en api.js
        setDetails(p => ({ ...p, [id]: d }));
      } catch {
        setMsg("No se pudo cargar el detalle del pedido.");
        return;
      } finally {
        setLoadingDetail(p => ({ ...p, [id]: false }));
      }
    }
    setExpanded(p => ({ ...p, [id]: true }));
  }

  function badge(status) {
    const s = String(status || "").toUpperCase();
    const map = { CREATED:"badge--created", PAID:"badge--paid", DELIVERED:"badge--delivered", CANCELLED:"badge--cancelled" };
    return <span className={`status-badge ${map[s] || "badge--created"}`}>{s || "CREATED"}</span>;
  }

  // Imprimir sólo la boleta visible de ese id
  function printOrder(id) {
    // si no está abierta, ábrela y vuelve a intentar
    if (!expanded[id]) {
      setExpanded(p => ({ ...p, [id]: true }));
      setTimeout(() => printOrder(id), 220);
      return;
    }
    setPrintId(id);

    const el = document.getElementById(`receipt-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

    // dar tiempo a que se aplique la clase y el scroll
    setTimeout(() => {
      window.print();
      // limpiar marca tras imprimir
      setTimeout(() => setPrintId(null), 250);
    }, 250);
  }

  return (
    <main id="main" style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Mis pedidos</h2>

      {loading && <p className="hint">Cargando pedidos…</p>}
      {msg && <p className="form-error" role="status">{msg}</p>}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ padding: 16 }}><p>No tienes pedidos.</p></div>
      )}

      <div className="receipt-list">
        {orders.map(o => {
          const id = o._id ?? o.id ?? o.code;
          const open = !!expanded[id];
          const created = new Date(o.createdAt ?? o.creadoAt ?? o.fecha ?? Date.now());
          const d = details[id];

          return (
            <article
              id={`receipt-${id}`}
              key={id}
              className={`receipt card ${printId === id ? "print-target" : ""}`}
            >
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
                              {d.items.map((it, idx) => {
                                const nombre = it.nombre ?? it.producto_nombre ?? it.producto_id ?? "Producto";
                                const qty = Number(it.qty ?? it.cantidad ?? 1);
                                const precio = Number(it.precio ?? it.producto_precio ?? 0);
                                const subt = Number(it.subtotal ?? precio * qty);
                                return (
                                  <tr key={idx}>
                                    <td>{nombre}</td>
                                    <td align="center">{qty}</td>
                                    <td align="right">{PEN.format(precio)}</td>
                                    <td align="right">{PEN.format(subt)}</td>
                                  </tr>
                                );
                              })}
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
                      {(d.delivery || d.entrega) && (
                        <div className="receipt__delivery">
                          <h4>Datos de entrega</h4>
                          <ul>
                            <li><b>Nombre:</b> {(d.delivery?.nombre ?? d.entrega?.nombre) || "—"}</li>
                            <li><b>Teléfono:</b> {(d.delivery?.telefono ?? d.entrega?.telefono) || "—"}</li>
                            <li><b>Dirección:</b> {(d.delivery?.direccion ?? d.entrega?.direccion) || "—"}</li>
                            {(d.delivery?.notas ?? d.entrega?.notas) && (
                              <li><b>Notas:</b> {d.delivery?.notas ?? d.entrega?.notas}</li>
                            )}
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
