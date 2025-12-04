// src/Checkout.jsx
import { useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useCart } from "./CartContext.jsx";
import { apix } from "./api/api";
import { useNavigate, useLocation } from "react-router-dom";

const TEL_RGX = /^[\d+\-\s]{6,20}$/;

// Permite solo dígitos, espacios, + y -
function sanitizePhone(value) {
  return value.replace(/[^\d+\-\s]/g, "");
}

export default function Checkout() {
  const { token, isAuthenticated } = useAuth();
  const { items, total, clear, inc, dec, setQty, removeItem } = useCart();
  const nav = useNavigate();
  const loc = useLocation();

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

  const PEN = useMemo(
    () => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }),
    []
  );

  const cartEmpty = items.length === 0;
  const showGate = !isAuthenticated; // si no está autenticado, mostramos el gate

  function onChange(e) {
    const { name } = e.target;
    let { value } = e.target;

    // filtra letras en teléfono
    if (name === "delivery_telefono") {
      value = sanitizePhone(value);
    }

    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(err => ({ ...err, [name]: null }));
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
      items: items.map(it => ({
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
      setForm({
        delivery_nombre: "",
        delivery_telefono: "",
        delivery_direccion: "",
        notas: "",
      });
      setMsg("✅ ¡Pedido confirmado!");
    } catch (err) {
      setMsg(`❌ No se pudo crear el pedido: ${err?.message || "error de red"}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Acciones del gate (con mode para que Login abra con la vista correcta)
  const goLogin = () =>
    nav("/login", { state: { from: loc, mode: "login" } });

  const goRegister = () =>
    nav("/login", { state: { from: loc, mode: "register" } });

  return (
    <>
      {/* Contenido con blur cuando showGate=true */}
      <div
        style={{
          filter: showGate ? "blur(2px)" : "none",
          pointerEvents: showGate ? "none" : "auto",
        }}
        aria-hidden={showGate}
      >
        <main style={{ maxWidth: 880, margin: "2rem auto", padding: "0 1rem" }}>
          <h2>Ticket</h2>

          {items.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr>
                  <th align="left">Producto</th>
                  <th>Precio</th>
                  <th style={{ minWidth: 160 }}>Qty</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it._id || it.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {it.imagenUrl && (
                          <img
                            src={it.imagenUrl}
                            alt=""
                            width="44"
                            height="32"
                            style={{
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                            }}
                          />
                        )}
                        <div>{it.nombre ?? it.title ?? "Producto"}</div>
                      </div>
                    </td>

                    <td align="center">
                      {PEN.format(Number(it.precio ?? it.price ?? 0))}
                    </td>

                    <td align="center">
                      <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => dec(it._id || it.id)}
                          aria-label={`Disminuir ${it.nombre}`}
                        >
                          –
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={e => setQty(it._id || it.id, e.target.value)}
                          style={{ width: 64, textAlign: "center" }}
                          aria-label={`Cantidad de ${it.nombre}`}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => inc(it._id || it.id)}
                          aria-label={`Aumentar ${it.nombre}`}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td align="center">
                      {PEN.format(
                        (Number(it.precio ?? it.price ?? 0)) * (Number(it.qty) || 1)
                      )}
                    </td>

                    <td align="right">
                      <button
                        className="btn btn-accent"
                        type="button"
                        onClick={() => removeItem(it._id || it.id)}
                        aria-label={`Eliminar ${it.nombre}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={3} align="right">
                    <b>Total</b>
                  </td>
                  <td align="center">
                    <b aria-live="polite">{PEN.format(total)}</b>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            <p>Tu ticket está vacío.</p>
          )}

          <h3>Datos de entrega</h3>
          <form
            onSubmit={submit}
            noValidate
            style={{ display: "grid", gap: 8, maxWidth: 520 }}
          >
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
                spellCheck={false}
              />
              {errors.delivery_nombre && (
                <div className="form-error">{errors.delivery_nombre}</div>
              )}
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
                pattern="[\d+\-\s]{6,20}"
                required
                aria-invalid={Boolean(errors.delivery_telefono)}
                spellCheck={false}
              />
              {errors.delivery_telefono && (
                <div className="form-error">{errors.delivery_telefono}</div>
              )}
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
                spellCheck={false}
              />
              {errors.delivery_direccion && (
                <div className="form-error">{errors.delivery_direccion}</div>
              )}
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
                spellCheck={false}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
              >
                {submitting ? "Creando…" : "Confirmar pedido"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clear}
                disabled={items.length === 0 || submitting}
                aria-disabled={items.length === 0 || submitting}
              >
                Vaciar ticket
              </button>
            </div>

            {msg && (
              <div
                className="pmodal__msg"
                role="status"
                aria-live="polite"
                style={{ marginTop: 8 }}
              >
                {msg}
              </div>
            )}
          </form>

          {done && (
            <div style={{ marginTop: 16 }} role="region" aria-label="Pedido creado">
              <b>¡Pedido creado!</b>
              <div>Código: {done.code}</div>
              <div>Total: {PEN.format(Number(done.total))}</div>
              <div>Estado: {done.status}</div>
              <div>
                Creado:{" "}
                {new Date(
                  done.creadoAt || done.created_at || Date.now()
                ).toLocaleString("es-PE")}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Gate / Burbuja para iniciar sesión o registrarse */}
      {showGate && (
        <div
          className="pmodal__backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Autenticación requerida"
        >
          <div className="pmodal" style={{ maxWidth: 520 }}>
            <div className="pmodal__header">
              <div className="pmodal__brandPh">SR</div>
              <h3 className="pmodal__title">Inicia sesión para continuar</h3>
            </div>

            <div className="pmodal__body">
              <p className="hint" style={{ marginTop: 0 }}>
                Para confirmar tu pedido necesitamos identificarte. Puedes iniciar sesión
                si ya tienes cuenta o crear una nueva en segundos.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <button className="btn btn-primary" onClick={goLogin} autoFocus>
                  Iniciar sesión
                </button>
                <button className="btn btn-accent" onClick={goRegister}>
                  Registrarme
                </button>
              </div>

              <p className="hint" style={{ marginTop: 10 }}>
                Te devolveremos a tu ticket después de autenticarte.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
