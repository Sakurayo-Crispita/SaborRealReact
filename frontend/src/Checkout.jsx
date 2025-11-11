// src/Checkout.jsx
import { useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useCart } from "./CartContext.jsx";
import { apix } from "./api/api";

const TEL_RGX = /^[\d+\-\s]{6,20}$/;

export default function Checkout() {
  const { token, isAuthenticated } = useAuth();
  const { items, total, clear } = useCart();

  const [form, setForm] = useState({
    delivery_nombre: "",
    delivery_telefono: "",
    delivery_direccion: "",
    notas: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const cartEmpty = items.length === 0;

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((err) => ({ ...err, [e.target.name]: null }));
    setMsg("");
  }

  const canSubmit = useMemo(() => {
    if (submitting || cartEmpty) return false;
    if (!form.delivery_nombre.trim()) return false;
    if (!TEL_RGX.test(form.delivery_telefono.trim())) return false;
    if (form.delivery_direccion.trim().length < 5) return false;
    return true;
  }, [submitting, cartEmpty, form]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const local = {};

    if (!form.delivery_nombre.trim()) local.delivery_nombre = "Ingresa tu nombre.";
    if (!TEL_RGX.test(form.delivery_telefono.trim()))
      local.delivery_telefono = "Teléfono inválido (usa dígitos, +, espacios o guiones).";
    if (form.delivery_direccion.trim().length < 5)
      local.delivery_direccion = "Dirección muy corta.";

    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    if (cartEmpty) {
      setMsg("Tu ticket está vacío.");
      return;
    }
    if (!isAuthenticated) {
      setMsg("Debes iniciar sesión para confirmar el pedido.");
      return;
    }

    const payload = {
      items: items.map((it) => ({
        producto_id: it._id || it.id,
        qty: Number(it.qty) || 1,
      })),
      delivery_nombre: form.delivery_nombre.trim(),
      delivery_telefono: form.delivery_telefono.trim(),
      delivery_direccion: form.delivery_direccion.trim(),
      notas: form.notas?.trim() || "",
    };

    try {
      setSubmitting(true);
      const o = await apix.createOrder(token, payload);
      setDone(o);
      clear();
      setForm({ delivery_nombre: "", delivery_telefono: "", delivery_direccion: "", notas: "" });
      setMsg("✅ ¡Pedido confirmado!");
    } catch (err) {
      setMsg(`❌ No se pudo crear el pedido: ${err?.message || "error de red"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Ticket</h2>

      {items.length ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              <th align="left">Producto</th>
              <th>Qty</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const nombre = it.nombre ?? it.title ?? "Producto";
              const precio = Number(it.precio ?? it.price ?? 0);
              return (
                <tr key={it._id || it.id}>
                  <td>{nombre}</td>
                  <td align="center">{it.qty}</td>
                  <td align="right">${precio.toFixed(2)}</td>
                  <td align="right">${(precio * it.qty).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} align="right">
                <b>Total</b>
              </td>
              <td align="right">
                <b aria-live="polite">${total.toFixed(2)}</b>
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p>Tu ticket está vacío.</p>
      )}

      <h3>Datos de entrega</h3>
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <div className="form__grp">
          <label htmlFor="ck-name">Nombre</label>
          <input
            id="ck-name"
            name="delivery_nombre"
            value={form.delivery_nombre}
            onChange={onChange}
            placeholder="Nombre"
            autoComplete="name"
            required
          />
          {errors.delivery_nombre && <div className="form-error">{errors.delivery_nombre}</div>}
        </div>

        <div className="form__grp">
          <label htmlFor="ck-tel">Teléfono</label>
          <input
            id="ck-tel"
            name="delivery_telefono"
            type="tel"
            inputMode="tel"
            value={form.delivery_telefono}
            onChange={onChange}
            placeholder="+51 999 888 777"
            required
          />
          {errors.delivery_telefono && <div className="form-error">{errors.delivery_telefono}</div>}
        </div>

        <div className="form__grp">
          <label htmlFor="ck-addr">Dirección</label>
          <input
            id="ck-addr"
            name="delivery_direccion"
            value={form.delivery_direccion}
            onChange={onChange}
            placeholder="Dirección"
            autoComplete="street-address"
            required
          />
          {errors.delivery_direccion && <div className="form-error">{errors.delivery_direccion}</div>}
        </div>

        <div className="form__grp">
          <label htmlFor="ck-notes">Notas (opcional)</label>
          <textarea
            id="ck-notes"
            name="notas"
            value={form.notas}
            onChange={onChange}
            placeholder="Notas (opcional)"
            maxLength={200}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting ? "Creando…" : "Confirmar pedido"}
        </button>

        {msg && (
          <div className="pmodal__msg" role="status" aria-live="polite" style={{ marginTop: 8 }}>
            {msg}
          </div>
        )}
      </form>

      {done && (
        <div style={{ marginTop: 16 }} role="region" aria-label="Pedido creado">
          <b>¡Pedido creado!</b>
          <div>Código: {done.code}</div>
          <div>Total: ${Number(done.total).toFixed(2)}</div>
          <div>Estado: {done.status}</div>
          <div>
            Creado: {new Date(done.creadoAt || done.created_at || Date.now()).toLocaleString()}
          </div>
        </div>
      )}
    </main>
  );
}
