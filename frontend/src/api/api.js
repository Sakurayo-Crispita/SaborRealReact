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
      api("/api/auth/me", { headers: { ...authHeader(token) } })
    );
  },

  /** ACTUALIZAR PERFIL */
  updateProfile(token, payload) {
    return handle(() =>
      api("/api/auth/me", {
        method: "PUT",
        headers: { ...authHeader(token) },
        body: JSON.stringify(payload),
      })
    );
  },

  /** CAMBIAR PASSWORD */
  changePassword(token, a, b) {
    const body =
      typeof a === "object" && a !== null
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

  // Crear o actualizar producto (si tu backend soporta PUT /api/productos/:id)
  upsertProducto(token, payload) {
    const id = payload._id || payload.id;
    if (id) {
      return handle(() =>
        api(`/api/productos/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { ...authHeader(token) },
          body: JSON.stringify(payload),
        })
      );
    }
    return handle(() =>
      api(`/api/productos`, {
        method: "POST",
        headers: { ...authHeader(token) },
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

  /* ========== Orders (cliente) ========== */
  myOrders(token) {
    return handle(() =>
      api("/api/orders", { headers: { ...authHeader(token) } })
    );
  },

  /** Detalle por id */
  orderDetail(token, orderId) {
    return handle(() =>
      api(`/api/orders/${encodeURIComponent(orderId)}`, {
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

// ===== ADMIN =====
adminListProducts(token) {
  return handle(async () => {
    try {
      const data = await api("/api/productos?all=1", { headers: { ...authHeader(token) } });
      return Array.isArray(data) ? data.map(mapProduct) : [];
    } catch {
      const data = await api("/api/productos", { headers: { ...authHeader(token) } });
      return Array.isArray(data) ? data.map(mapProduct) : [];
    }
  });
},

adminUpsertProduct(token, payload) {
  return handle(async () => {
    const { _id, ...rest } = payload ?? {};
    // Si hay _id intentamos PUT /admin/products/:id
    if (_id) {
      try {
        return await api(`/api/admin/products/${encodeURIComponent(_id)}`, {
          method: "PUT",
          headers: { ...authHeader(token) },
          body: JSON.stringify(rest),
        });
      } catch (e) {
        // Fallback: algunos backends aceptan POST con _id para editar
        return await api("/api/admin/products", {
          method: "POST",
          headers: { ...authHeader(token) },
          body: JSON.stringify(payload),
        });
      }
    }
    // Crear
    return await api("/api/admin/products", {
      method: "POST",
      headers: { ...authHeader(token) },
      body: JSON.stringify(rest),
    });
  });
},

adminDeleteProduct(token, id) {
  return handle(() =>
    api(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...authHeader(token) },
    })
  );
},

  // Si tu backend tiene un endpoint para listar TODOS los pedidos (admin),
  // cámbialo aquí. De momento reutilizamos /api/orders.
  adminListOrders(token) {
    return handle(() =>
      api("/api/orders", { headers: { ...authHeader(token) } })
    );
  },

  // Si tu backend soporta actualizar estado: PATCH /api/orders/:id
  adminUpdateOrderStatus(token, id, status) {
    return handle(() =>
      api(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { ...authHeader(token) },
        body: JSON.stringify({ status }),
      })
    );
  },

  // Placeholder: cambia esta ruta cuando tengas soporte en backend
  adminListClients(token) {
    // ⚠️ Cambia a tu endpoint real cuando exista, para evitar 404.
    return handle(() =>
      api("/api/clients", { headers: { ...authHeader(token) } })
    );
  },
};

export default apix;
