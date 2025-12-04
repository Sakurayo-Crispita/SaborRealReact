// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

/* ================== Utiles ================== */
async function compressImage(file, maxSize = 640, quality = 0.8) {
  const img = await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function toLocalDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === "string" && !/[zZ]|[+\-]\d{2}:?\d{2}$/.test(d)) {
    return new Date(d + "Z");
  }
  return new Date(d);
}

/* ---------- MODAL PRODUCTO ---------- */
function ProductModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState({
    _id: initial?._id ?? null,
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    precio: Number(initial?.precio ?? 0),
    categoria: initial?.categoria ?? "",
    disponible: Boolean(initial?.disponible ?? true),
  });

  const [preview, setPreview] = useState(initial?.imagenUrl || "");
  const [pickedFile, setPickedFile] = useState(null);
  const [removedImg, setRemovedImg] = useState(false); // para saber si se quitó la imagen
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        _id: initial?._id ?? null,
        nombre: initial?.nombre ?? "",
        descripcion: initial?.descripcion ?? "",
        precio: Number(initial?.precio ?? 0),
        categoria: initial?.categoria ?? "",
        disponible: Boolean(initial?.disponible ?? true),
      });
      setPreview(initial?.imagenUrl || "");
      setPickedFile(null);
      setRemovedImg(false);
      setErr("");
    }
  }, [open, initial]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErr("");
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("El archivo debe ser una imagen.");
      return;
    }
    const dataUrl = await compressImage(file, 720, 0.82);
    setPickedFile(file);
    setPreview(dataUrl);
    setRemovedImg(false);
  }

  async function submit(e) {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const precio = Number(form.precio);
    if (!nombre) return setErr("El nombre es obligatorio.");
    if (!Number.isFinite(precio) || precio < 0) return setErr("Precio inválido.");

    // Lógica de imagen: si la quitó, mandamos null; si hay preview, la mandamos
    let imagenUrlField;
    if (removedImg) {
      imagenUrlField = null;
    } else if (preview) {
      imagenUrlField = preview;
    }

    const payload = {
      ...(form._id ? { _id: form._id } : {}),
      nombre,
      descripcion: form.descripcion?.trim() || null,
      precio,
      categoria: form.categoria?.trim() || null,
      disponible: !!form.disponible,
      ...(imagenUrlField !== undefined ? { imagenUrl: imagenUrlField } : {}),
    };

    await onSave(payload);
  }

  if (!open) return null;

  return (
    <div className="pmodal__backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pmodal" onClick={(e) => e.stopPropagation()}>
        <div className="pmodal__header">
          <div className="pmodal__brandPh">SR</div>
          <h3 className="pmodal__title">{isEdit ? "Editar producto" : "Nuevo producto"}</h3>
          <button className="pmodal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="pmodal__body">
          <div className="pmodal__avatarBox" style={{ marginBottom: 12 }}>
            <div className="pmodal__avatar" style={{ width: 96, height: 64, borderRadius: 10 }}>
              {preview ? (
                <img src={preview} alt="Previsualización" />
              ) : (
                <div className="pmodal__avatarPh">🖼️</div>
              )}
            </div>
            <label className="btn btn-outline-secondary btn-sm">
              Subir imagen
              <input type="file" accept="image/*" hidden onChange={onPickFile} />
            </label>
            {preview && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setPreview("");
                  setPickedFile(null);
                  setRemovedImg(true);
                }}
              >
                Quitar
              </button>
            )}
          </div>

          <form onSubmit={submit} className="pmodal__grid" style={{ gap: "12px" }}>
            <div className="form__grp">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={onChange} required />
            </div>

            <div className="form__grp">
              <label>Precio</label>
              <input
                name="precio"
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={onChange}
                required
              />
            </div>

            <div className="form__grp" style={{ gridColumn: "1 / -1" }}>
              <label>Descripción</label>
              <textarea
                name="descripcion"
                rows={3}
                value={form.descripcion}
                onChange={onChange}
                placeholder="Breve descripción del producto"
              />
            </div>

            <div className="form__grp">
              <label>Categoría</label>
              <input
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                placeholder="pan, postre…"
              />
            </div>

            <div className="form__grp" style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
              <input
                id="chk-disp"
                type="checkbox"
                name="disponible"
                checked={form.disponible}
                onChange={onChange}
              />
              <label htmlFor="chk-disp">Disponible</label>
            </div>

            {err && (
              <div className="form-error" style={{ gridColumn: "1 / -1" }}>
                {err}
              </div>
            )}

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary">
                {isEdit ? "Guardar cambios" : "Crear"}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECCIÓN: PRODUCTOS ---------- */
function ProductsSection({ token, onMsg }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  async function load() {
    setBusy(true);
    try {
      const data = await apix.adminListProducts(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      onMsg(`❌ No se pudieron cargar productos: ${e.message || "error"}`);
      setItems([]);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  function openCreate() {
    setEditing(null);
    setOpenModal(true);
  }
  function openEdit(p) {
    setEditing(p);
    setOpenModal(true);
  }

  async function saveProduct(payload) {
    try {
      if (payload._id) {
        await apix.adminUpdateProduct(token, payload._id, payload);
      } else {
        await apix.adminCreateProduct(token, payload);
      }
      setOpenModal(false);
      await load();
      onMsg("✅ Producto guardado.");
    } catch (e) {
      onMsg(`❌ No se pudo guardar: ${e.message || "error"}`);
    }
  }

  async function del(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await apix.adminDeleteProduct(token, p._id);
      await load();
      onMsg("🗑️ Producto eliminado.");
    } catch (e) {
      onMsg(`❌ No se pudo eliminar: ${e.message || "error"}`);
    }
  }

  async function toggleDisponible(p) {
    try {
      await apix.adminPatchProduct(token, p._id, { disponible: !p.disponible });
      setItems((lst) =>
        lst.map((x) => (x._id === p._id ? { ...x, disponible: !p.disponible } : x))
      );
    } catch (e) {
      onMsg(`❌ No se pudo actualizar disponibilidad: ${e.message || "error"}`);
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>Productos</strong>
          <button className="btn btn-primary" onClick={openCreate}>
            + Nuevo producto
          </button>
        </div>

        <div className="receipt__tableWrap" style={{ marginTop: 8 }}>
          <table className="receipt__table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Nombre</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Disponible</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {busy && (
                <tr>
                  <td colSpan={5}>
                    <span className="hint">Cargando…</span>
                  </td>
                </tr>
              )}
              {!busy && items.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <span className="hint">Sin productos</span>
                  </td>
                </tr>
              )}

              {!busy &&
                items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {p.imagenUrl ? (
                          <img
                            src={p.imagenUrl}
                            alt=""
                            width="36"
                            height="24"
                            style={{
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                            }}
                          />
                        ) : null}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{p.nombre}</span>
                          {p.descripcion && (
                            <small
                              className="hint"
                              title={p.descripcion}
                              style={{
                                maxWidth: 360,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {p.descripcion}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td align="center">{PEN.format(Number(p.precio ?? 0))}</td>
                    <td align="center">{p.categoria || "—"}</td>
                    <td align="center">
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!p.disponible}
                          onChange={() => toggleDisponible(p)}
                        />
                        <span className="hint">{p.disponible ? "Sí" : "No"}</span>
                      </label>
                    </td>
                    <td align="right" style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => openEdit(p)}
                        style={{ marginRight: 8 }}
                      >
                        Editar
                      </button>
                      <button className="btn btn-accent" onClick={() => del(p)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initial={editing}
        onSave={saveProduct}
      />
    </>
  );
}

/* ---------- MODAL DETALLE DE PEDIDO ---------- */
function OrderDetailModal({ open, onClose, order }) {
  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );
  if (!open || !order) return null;

  const d = order.delivery || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="pmodal__backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pmodal" onClick={(e) => e.stopPropagation()}>
        <div className="pmodal__header">
          <div className="pmodal__brandPh">SR</div>
          <h3 className="pmodal__title">Detalle del pedido</h3>
          <button className="pmodal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="pmodal__body" style={{ display: "grid", gap: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <strong>Entrega</strong>
            <div className="hint" style={{ marginTop: 6 }}>
              <div>
                <b>Nombre:</b> {d.nombre || "—"}
              </div>
              <div>
                <b>Teléfono:</b> {d.telefono || "—"}
              </div>
              <div>
                <b>Dirección:</b> {d.direccion || "—"}
              </div>
              {d.notas && (
                <div>
                  <b>Notas:</b> {d.notas}
                </div>
              )}
            </div>
          </div>

          <div className="receipt__tableWrap">
            <table className="receipt__table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th align="left">Producto</th>
                  <th>Precio</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <span className="hint">Sin ítems</span>
                    </td>
                  </tr>
                )}
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {it.imagenUrl && (
                          <img
                            src={it.imagenUrl}
                            alt=""
                            width="36"
                            height="24"
                            style={{
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                            }}
                          />
                        )}
                        {it.nombre || it.producto_id}
                      </div>
                    </td>
                    <td align="center">{PEN.format(Number(it.precio || 0))}</td>
                    <td align="center">{it.qty}</td>
                    <td align="center">
                      {PEN.format(
                        Number(it.subtotal || Number(it.precio || 0) * Number(it.qty || 0))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "right" }}>
            <strong>Total: {PEN.format(Number(order.total || 0))}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECCIÓN: PEDIDOS AGRUPADOS POR USUARIO ---------- */
function OrdersSectionGrouped({ token, onMsg }) {
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [openGroup, setOpenGroup] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [searchCode, setSearchCode] = useState("");

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  const DT_LIMA = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "America/Lima",
      }),
    []
  );

  const STATUS_OPTIONS = [
    { value: "CREATED", label: "Creado" },
    { value: "PAID", label: "Pagado" },
    { value: "DELIVERED", label: "Entregado" },
    { value: "CANCELLED", label: "Cancelado" },
  ];

  const normStatus = (o) => o.status || o.estado || "CREATED";

  async function load() {
    setBusy(true);
    try {
      const data = await apix.adminListOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      onMsg(`❌ No se pudieron cargar pedidos: ${e.message || "error"}`);
      setOrders([]);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  // Resumen: total de pedidos y monto SOLO de los que NO están cancelados
  const summary = useMemo(() => {
    let totalActive = 0;
    for (const o of orders) {
      if (normStatus(o) !== "CANCELLED") {
        totalActive += Number(o.total || 0);
      }
    }
    return {
      count: orders.length,
      totalActive,
    };
  }, [orders]);

  // Agrupar pedidos (aplicando filtro por código si hay búsqueda)
  const groups = useMemo(() => {
    const term = searchCode.trim().toLowerCase();

    const src =
      term === ""
        ? orders
        : orders.filter((o) =>
            String(o.code || o._id || "")
              .toLowerCase()
              .includes(term)
          );

    const map = new Map();
    for (const o of src) {
      const d = o.delivery || {};
      const name = (d.nombre || "").trim();
      const phone = (d.telefono || "").trim();
      const key = `${name}|${phone}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }

    return Array.from(map.entries()).map(([key, arr]) => {
      const [nombre, telefono] = key.split("|");

      // Total del grupo solo con pedidos NO cancelados
      const total = arr.reduce((s, x) => {
        return normStatus(x) === "CANCELLED" ? s : s + Number(x.total || 0);
      }, 0);

      // Ordenar pedidos por fecha desc
      arr.sort(
        (a, b) =>
          toLocalDate(b.creadoAt ?? b.createdAt)?.getTime() -
          toLocalDate(a.creadoAt ?? a.createdAt)?.getTime()
      );

      return { key, nombre, telefono, items: arr, total };
    });
  }, [orders, searchCode]);

  async function changeStatus(order, next) {
    const id = order._id;
    const prev = normStatus(order);
    if (next === prev) return;

    setSavingId(id);
    // actualiza en memoria para que summary y groups se recalculen
    setOrders((lst) =>
      lst.map((o) => (o._id === id ? { ...o, status: next, estado: next } : o))
    );

    try {
      await apix.adminUpdateOrderStatus(token, id, next);
      onMsg("✅ Estado actualizado.");
    } catch (e) {
      // revertir si falla
      setOrders((lst) =>
        lst.map((o) => (o._id === id ? { ...o, status: prev, estado: prev } : o))
      );
      onMsg(`❌ No se pudo actualizar estado: ${e.message || "error"}`);
    } finally {
      setSavingId(null);
    }
  }

  function toggleGroup(k) {
    setOpenGroup((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  async function openDetail(o) {
    try {
      const full = await apix.adminOrderDetail(token, o._id);
      setDetailOrder(full);
      setDetailOpen(true);
    } catch (e) {
      onMsg(`❌ No se pudo cargar detalle: ${e.message || "error"}`);
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <strong>Pedidos</strong>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Buscar por código…"
              style={{
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid var(--border)",
                minWidth: 220,
              }}
            />
            <span className="hint">
              {summary.count} pedido(s) • Total: {PEN.format(summary.totalActive)}
            </span>
            <button className="btn btn-outline-secondary" onClick={load} disabled={busy}>
              Recargar
            </button>
          </div>
        </div>

        {busy && (
          <p className="hint" style={{ marginTop: 8 }}>
            Cargando…
          </p>
        )}
        {!busy && groups.length === 0 && (
          <p className="hint" style={{ marginTop: 8 }}>
            Sin pedidos
          </p>
        )}

        {!busy &&
          groups.map((g) => (
            <div key={g.key} className="card" style={{ marginTop: 12, padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleGroup(g.key)}
              >
                <div>
                  {(() => {
                    const title =
                      (g.nombre && g.nombre.trim()) ||
                      (g.telefono && g.telefono.trim()) ||
                      "Órdenes";
                    return (
                      <>
                        <strong>{title}</strong>
                        {g.telefono && title !== g.telefono && (
                          <span className="hint"> • {g.telefono}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="hint">{g.items.length} pedido(s)</span>
                  <span className="hint">Total: {PEN.format(g.total)}</span>
                  <span aria-hidden>▾</span>
                </div>
              </div>

              {openGroup[g.key] && (
                <div className="receipt__tableWrap" style={{ marginTop: 10 }}>
                  <table
                    className="receipt__table"
                    style={{ width: "100%", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr>
                        <th align="left">Código</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((o) => {
                        const created = toLocalDate(
                          o.creadoAt ?? o.createdAt ?? Date.now()
                        );
                        const st = normStatus(o);
                        return (
                          <tr key={o._id}>
                            <td>{o.code || o._id}</td>
                            <td align="center">
                              {PEN.format(Number(o.total || 0))}
                            </td>
                            <td align="center" style={{ minWidth: 180 }}>
                              <select
                                value={st}
                                onChange={(e) =>
                                  changeStatus(o, e.target.value)
                                }
                                disabled={savingId === o._id}
                                style={{ padding: "6px 8px", borderRadius: 8 }}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td align="center">
                              {created ? DT_LIMA.format(created) : "—"}
                            </td>
                            <td align="right">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => openDetail(o)}
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>

      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={detailOrder}
      />
    </>
  );
}

/* ---------- ADMIN ROOT ---------- */
export default function Admin() {
  const { token, isAuthenticated, user } = useAuth();
  const nav = useNavigate();

  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("productos");

  useEffect(() => {
    if (!isAuthenticated) {
      nav("/login");
      return;
    }
    if (user?.rol !== "admin") {
      nav("/");
      return;
    }
  }, [isAuthenticated, user?.rol, nav]);

  function onMsg(m) {
    setMsg(m);
    if (m) setTimeout(() => setMsg(""), 3500);
  }

  return (
    <main id="main" style={{ maxWidth: 980, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Panel de administración</h2>
      {msg && (
        <p className="pmodal__msg" role="status">
          {msg}
        </p>
      )}

      <div className="tabs" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className={`btn ${
            tab === "productos" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setTab("productos")}
        >
          Productos
        </button>
        <button
          className={`btn ${
            tab === "pedidos" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setTab("pedidos")}
        >
          Pedidos
        </button>
      </div>

      {tab === "productos" && <ProductsSection token={token} onMsg={onMsg} />}
      {tab === "pedidos" && <OrdersSectionGrouped token={token} onMsg={onMsg} />}
    </main>
  );
}
