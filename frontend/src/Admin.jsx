// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

function ProductModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState({
    _id: initial?._id ?? null,
    nombre: initial?.nombre ?? "",
    precio: initial?.precio ?? 0,
    categoria: initial?.categoria ?? "",
    imagenUrl: initial?.imagenUrl ?? "",
    disponible: Boolean(initial?.disponible ?? true),
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        _id: initial?._id ?? null,
        nombre: initial?.nombre ?? "",
        precio: Number(initial?.precio ?? 0),
        categoria: initial?.categoria ?? "",
        imagenUrl: initial?.imagenUrl ?? "",
        disponible: Boolean(initial?.disponible ?? true),
      });
      setErr("");
    }
  }, [open, initial]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const precio = Number(form.precio);
    if (!nombre) return setErr("El nombre es obligatorio.");
    if (!Number.isFinite(precio) || precio < 0) return setErr("Precio inválido.");

    // Campos permitidos
    const payload = {
      ...(form._id ? { _id: form._id } : {}),
      nombre,
      precio,
      categoria: form.categoria?.trim() || null,
      imagenUrl: form.imagenUrl?.trim() || null,
      disponible: !!form.disponible,
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
          <button className="pmodal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="pmodal__body">
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

            <div className="form__grp">
              <label>Categoría</label>
              <input
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                placeholder="pan, postre, bebida…"
              />
            </div>

            <div className="form__grp">
              <label>Imagen (URL)</label>
              <input
                name="imagenUrl"
                value={form.imagenUrl}
                onChange={onChange}
                placeholder="https://…"
                spellCheck={false}
              />
            </div>

            <div className="form__grp" style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
              <input id="chk-disp" type="checkbox" name="disponible" checked={form.disponible} onChange={onChange} />
              <label htmlFor="chk-disp">Disponible</label>
            </div>

            {err && <div className="form-error" style={{ gridColumn: "1 / -1" }}>{err}</div>}

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary">{isEdit ? "Guardar cambios" : "Crear"}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { token, isAuthenticated, user } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null); // producto en edición

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  useEffect(() => {
    if (!isAuthenticated) { nav("/login"); return; }
    if (user?.rol !== "admin") { nav("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.rol]);

  async function load() {
    setBusy(true); setMsg("");
    try {
      // Preferir listado admin (muestra todo). Si tu backend no soporta ?all=1, apix.getProductos() será suficiente.
      const data = await apix.adminListProducts(token).catch(() => apix.getProductos());
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMsg("No se pudieron cargar productos.");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

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
      setMsg("");
      await apix.adminUpsertProduct(token, payload);
      setOpenModal(false);
      await load();
      setMsg("✅ Producto guardado.");
    } catch (e) {
      setMsg(`❌ No se pudo guardar: ${e.message || "error"}`);
    }
  }

  async function del(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await apix.adminDeleteProduct(token, p._id);
      await load();
      setMsg("🗑️ Producto eliminado.");
    } catch (e) {
      setMsg(`❌ No se pudo eliminar: ${e.message || "error"}`);
    }
  }

  async function toggleDisponible(p) {
    try {
      await apix.adminUpsertProduct(token, { _id: p._id, disponible: !p.disponible });
      setItems((lst) => lst.map((x) => (x._id === p._id ? { ...x, disponible: !p.disponible } : x)));
    } catch (e) {
      setMsg(`❌ No se pudo actualizar disponibilidad: ${e.message || "error"}`);
    }
  }

  return (
    <main id="main" style={{ maxWidth: 980, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 className="page-title">Panel de administración</h2>

      {msg && <p className="pmodal__msg" role="status">{msg}</p>}

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong>Productos</strong>
          <button className="btn btn-primary" onClick={openCreate}>+ Nuevo producto</button>
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
                <tr><td colSpan={5}><span className="hint">Cargando…</span></td></tr>
              )}

              {!busy && items.length === 0 && (
                <tr><td colSpan={5}><span className="hint">Sin productos</span></td></tr>
              )}

              {!busy && items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {p.imagenUrl ? (
                        <img src={p.imagenUrl} alt="" width="36" height="24" style={{ objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                      ) : null}
                      {p.nombre}
                    </div>
                  </td>
                  <td align="center">{PEN.format(Number(p.precio ?? 0))}</td>
                  <td align="center">{p.categoria || "—"}</td>
                  <td align="center">
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!p.disponible}
                        onChange={() => toggleDisponible(p)}
                      />
                      <span className="hint">{p.disponible ? "Sí" : "No"}</span>
                    </label>
                  </td>
                  <td align="right" style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-outline-secondary" onClick={() => openEdit(p)} style={{ marginRight: 8 }}>
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

      {/* Modal crear/editar */}
      <ProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initial={editing}
        onSave={saveProduct}
      />
    </main>
  );
}
