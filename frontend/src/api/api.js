// src/api/api.js
import { api, authHeader } from "./client";

/** ---- Helpers ---- **/
const mapProduct = (doc = {}) => ({
  _id: doc.id || doc._id,
  nombre: doc.title ?? doc.nombre ?? "Producto",
  precio: Number(doc.price ?? doc.precio ?? 0),
  categoria: doc.category ?? doc.categoria ?? null,
  imagenUrl: doc.image ?? doc.imagenUrl ?? null,
  slug: doc.slug ?? null,
  ...doc,
});

const handle = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    const msg = typeof e?.message === "string" && e.message ? e.message : "Error de red";
    throw new Error(msg);
  }
};

export const apix = {
  /* ========== Auth reales ========== */
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

  /** ACTUALIZAR PERFIL (corregido) */
  updateProfile(token, payload) {
    // payload: { nombre?, telefono?, direccion?, genero?, fecha_nacimiento? }
    return handle(() =>
      api("/api/auth/me", {
        method: "PUT",
        headers: { ...authHeader(token) },
        body: JSON.stringify(payload),
      })
    );
  },

  /** CAMBIAR PASSWORD (corregido) */
  changePassword(token, a, b) {
    const body = (typeof a === "object" && a !== null)
      ? { current_password: a.oldPassword, new_password: a.newPassword }
      : { current_password: a, new_password: b };

    return handle(() =>
      api("/api/auth/change-password", {
        method: "PATCH",
        headers: { ...authHeader(token) },
        body: JSON.stringify(body),
      })
    );
  },

  /* ========== Productos ========== */
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

  createComentario(token, payload) {
    return handle(() =>
      api("/api/comentarios", {
        method: "POST",
        headers: { ...authHeader(token) },
        body: JSON.stringify(payload),
      })
    );
  },

  /* ========== Orders ========== */
  myOrders(token) {
    return handle(() =>
      api("/api/orders", {
        headers: { ...authHeader(token) },
      })
    );
  },

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
