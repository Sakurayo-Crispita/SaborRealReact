// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

/* Util: comprimir imagen a dataURL JPEG */
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
  return canvas.toDataURL("image/jpeg", quality); // ~100–200 KB
}

function ProductModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState({
    _id: initial?._id ?? null,
    nombre: initial?.nombre ?? "",
    precio: Number(initial?.precio ?? 0),
    categoria: initial?.categoria ?? "",
    disponible: Boolean(initial?.disponible ?? true),
    descripcion: initial?.descripcion ?? "",
  });

  const [preview, setPreview] = useState(initial?.imagenUrl || ""); // dataURL o URL existente
  const [pickedFile, setPickedFile] = useState(null);               // File seleccionado
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        _id: initial?._id ?? null,
        nombre: initial?.nombre ?? "",
        precio: Number(initial?.precio ?? 0),
        categoria: initial?.categoria ?? "",
        disponible: Boolean(initial?.disponible ?? true),
        descripcion: initial?.descripcion ?? "",
      });
      setPreview(initial?.imagenUrl || "");
      setPickedFile(null);
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
    // Comprimir a dataURL
    const dataUrl = await compressImage(file, 720, 0.82);
    setPickedFile(file);
    setPreview(dataUrl);
  }

  async function submit(e) {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const precio = Number(form.precio);
    if (!nombre) return setErr("El nombre es obligatorio.");
    if (!Number.isFinite(precio) || precio < 0) return setErr("Precio inválido.");

    const payload = {
      ...(form._id ? { _id: form._id } : {}),
      nombre,
      precio,
      categoria: form.categoria?.trim() || null,
      disponible: !!form.disponible,
      descripcion: form.descripcion?.trim() || null,
      // Si el admin eligió un archivo, mandamos la versión comprimida (dataURL)
      ...(preview && preview.startsWith("data:image/") ? { imagenUrl: preview } : {}),
      // Si no eligió archivo pero existía una imagen previa URL, mantenla:
      ...(!pickedFile && preview && !preview.startsWith("data:image/") ? { imagenUrl: preview } : {}),
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
          {/* Previa */}
          <div className="pmodal__avatarBox" style={{ marginBottom: 12 }}>
            <div className="pmodal__avatar" style={{ width: 96, height: 64, borderRadius: 10 }}>
              {preview ? <img src={preview} alt="Previsualización" /> : <div className="pmodal__avatarPh">🖼️</div>}
            </div>
            <label className="btn btn-outline-secondary btn-sm">
              Subir imagen
              <input type="file" accept="image/*" hidden onChange={onPickFile} />
            </label>
            {preview && (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setPreview(""); setPickedFile(null); }}>
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

            <div className="form__grp">
              <label>Categoría</label>
              <input
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                placeholder="pan, postre, bebida…"
              />
            </div>
            <div className="form__grp" style={{ gridColumn: "1 / -1" }}>
            <label>Descripción</label>
            <textarea
            name="descripcion"
            rows={3}
            value={form.descripcion}
            onChange={onChange}
            placeholder="Descripción breve del producto"
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
  const [editing, setEditing] = useState(null);

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
      const data = await apix.adminListProducts(token).catch(() => apix.getProductos());
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMsg("No se pudieron cargar productos.");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  function openCreate() { setEditing(null); setOpenModal(true); }
  function openEdit(p)  { setEditing(p);   setOpenModal(true); }

// dentro de Admin.jsx

async function saveProduct(payload) {
  try {
    setMsg("");

    // separa _id
    const { _id, ...rest } = payload ?? {};

    if (_id) {
      // EDITAR
      await apix.adminUpdateProduct(token, _id, rest);
    } else {
      // CREAR
      await apix.adminCreateProduct(token, rest);
    }

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
        await apix.adminPatchProduct(token, p._id, { disponible: !p.disponible });
        setItems(lst => lst.map(x => x._id === p._id ? { ...x, disponible: !p.disponible } : x));
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
              {busy && <tr><td colSpan={5}><span className="hint">Cargando…</span></td></tr>}
              {!busy && items.length === 0 && <tr><td colSpan={5}><span className="hint">Sin productos</span></td></tr>}

              {!busy && items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {p.imagenUrl ? (
                        <img src={p.imagenUrl} alt="" width="36" height="24"
                             style={{ objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                      ) : null}
                      {p.nombre}
                    </div>
                  </td>
                  <td align="center">{PEN.format(Number(p.precio ?? 0))}</td>
                  <td align="center">{p.categoria || "—"}</td>
                  <td align="center">
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!p.disponible} onChange={() => toggleDisponible(p)} />
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

      <ProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initial={editing}
        onSave={saveProduct}
      />
    </main>
  );
}
