// src/api/api.js
import { api, authHeader } from "./client";

/** ---- Helpers ---- **/
const mapProduct = (doc = {}) => {
  const precio = Number(doc.price ?? doc.precio ?? 0);
  const activo = typeof doc.activo === "boolean" ? doc.activo : (doc.disponible ?? true);

  return {
    _id: doc.id || doc._id,
    nombre: doc.title ?? doc.nombre ?? "Producto",
    descripcion: doc.descripcion ?? null,
    precio,
    categoria: doc.category ?? doc.categoria ?? null,
    imagenUrl: doc.image ?? doc.imagenUrl ?? null,
    slug: doc.slug ?? null,
    activo,
    disponible: Boolean(activo),
    ...doc,
  };
};

const jsonHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? authHeader(token) : {}),
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
        headers: jsonHeaders(),
        body: JSON.stringify({ email, password }),
      })
    );
  },

  register(payload) {
    return handle(() =>
      api("/api/auth/register", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      })
    );
  },

  me(token) {
    return handle(() => api("/api/auth/me", { headers: { ...authHeader(token) } }));
  },

  updateProfile(token, payload) {
    return handle(() =>
      api("/api/auth/me", {
        method: "PUT",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  changePassword(token, a, b) {
    const body =
      typeof a === "object" && a !== null
        ? { current_password: a.oldPassword, new_password: a.newPassword }
        : { current_password: a, new_password: b };
    return handle(() =>
      api("/api/auth/change-password", {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify(body),
      })
    );
  },

  /* ========== Productos (público/cliente) ========== */
  getProductos(categoria = "") {
    return handle(async () => {
      const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
      const data = await api(`/api/productos${q}`);
      return Array.isArray(data) ? data.map(mapProduct) : [];
    });
  },

  // Endpoints públicos (si los sigues usando):
  upsertProducto(token, payload) {
    const id = payload._id || payload.id;
    if (id) {
      return handle(() =>
        api(`/api/productos/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: jsonHeaders(token),
          body: JSON.stringify(payload),
        })
      );
    }
    return handle(() =>
      api(`/api/productos`, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  deleteProducto(token, id) {
    return handle(() =>
      api(`/api/productos/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...authHeader(token) },
      })
    );
  },

  /* ========== Comentarios ========== */
  getComentarios(productId) {
    return handle(() => api(`/api/comentarios?producto_id=${encodeURIComponent(productId)}`));
  },

  createComentario(token, payload) {
    return handle(() =>
      api("/api/comentarios", {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  /* ========== Orders (cliente) ========== */
  myOrders(token) {
    return handle(() => api("/api/orders", { headers: { ...authHeader(token) } }));
  },

  orderDetail(token, orderId) {
    return handle(() =>
      api(`/api/orders/${encodeURIComponent(orderId)}`, { headers: { ...authHeader(token) } })
    );
  },

  createOrder(token, payload) {
    return handle(() =>
      api("/api/orders", {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  /* ========== ADMIN: Productos ========== */
  adminListProducts(token) {
    return handle(async () => {
      const data = await api("/api/admin/products", { headers: { ...authHeader(token) } });
      return Array.isArray(data) ? data.map(mapProduct) : [];
    });
  },

  adminCreateProduct(token, payload) {
    return handle(() =>
      api("/api/admin/products", {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  adminUpdateProduct(token, id, payload) {
    return handle(() =>
      api(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  adminPatchProduct(token, id, patch) {
    return handle(() =>
      api(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify(patch),
      })
    );
  },

  adminDeleteProduct(token, id) {
    return handle(() =>
      api(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...authHeader(token) },
      })
    );
  },

  // Wrapper de compatibilidad para tu Admin.jsx anterior:
  adminUpsertProduct(token, payload) {
    const { _id, id, ...rest } = payload ?? {};
    const pid = _id || id;
    return pid
      ? this.adminUpdateProduct(token, pid, rest)
      : this.adminCreateProduct(token, rest);
  },

  /* ========== ADMIN: Otros (placeholders) ========== */
  adminListOrders(token) {
    return handle(() => api("/api/orders", { headers: { ...authHeader(token) } }));
  },

  adminUpdateOrderStatus(token, id, status) {
    return handle(() =>
      api(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify({ status }),
      })
    );
  },

  adminListClients(token) {
    return handle(() => api("/api/clients", { headers: { ...authHeader(token) } }));
  },
};

export default apix;
