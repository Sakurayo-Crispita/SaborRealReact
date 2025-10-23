// src/api/api.js
import { api, authHeader } from "./client";

/** ---- Helpers ---- **/
const mapProduct = (doc = {}) => ({
  _id: doc.id || doc._id,                     // admite "id" o "_id"
  nombre: doc.title ?? doc.nombre ?? "Producto",
  precio: Number(doc.price ?? doc.precio ?? 0),
  categoria: doc.category ?? doc.categoria ?? null,
  imagenUrl: doc.image ?? doc.imagenUrl ?? null,
  slug: doc.slug ?? null,
  ...doc, // conserva campos adicionales del backend
});

const handle = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    // Normaliza el error con mensaje legible
    const msg = typeof e?.message === "string" && e.message ? e.message : "Error de red";
    throw new Error(msg);
  }
};

/** ---- API pública ---- **/
export const apix = {
  /* ========== Auth (real) ========== */
  login(email, password) {
    return handle(() =>
      api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
    );
  },

  register(payload) {
    return handle(() =>
      api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  me(token) {
    return handle(() =>
      api("/api/auth/me", {
        headers: { ...authHeader(token) },
      })
    );
  },

  /* ========== Productos ========== */
  // backend espera ?categoria=... (no "category")
  getProductos(categoria = "") {
    return handle(async () => {
      const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
      const data = await api(`/api/productos${q}`);
      return Array.isArray(data) ? data.map(mapProduct) : [];
    });
  },

  /* ========== Comentarios ========== */
  getComentarios(productId) {
    return handle(() =>
      api(`/api/comentarios?producto_id=${encodeURIComponent(productId)}`)
    );
  },

  createComentario(token, payload /* { producto_id, texto, rating } */) {
    return handle(() =>
      api("/api/comentarios", {
        method: "POST",
        headers: { ...authHeader(token) },
        body: JSON.stringify(payload),
      })
    );
  },

  /* ========== Orders (requiere login) ========== */
  myOrders(token) {
    return handle(() =>
      api("/api/orders", {
        headers: { ...authHeader(token) },
      })
    );
  },

  // payload: { items:[{producto_id, qty}], delivery_nombre, delivery_telefono, delivery_direccion, notas? }
  createOrder(token, payload) {
    return handle(() =>
      api("/api/orders", {
        method: "POST",
        headers: { ...authHeader(token) },
        body: JSON.stringify(payload),
      })
    );
  },
};

export default apix;
