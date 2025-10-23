// src/api/api.js
import { api, authHeader } from './client';

// Colección de llamadas al backend
export const apix = {
  // --- Auth ---
  login(email, password) {
    return api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  register(payload) {
    return api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  me(token) {
    return api('/api/auth/me', {
      headers: { ...authHeader(token) },
    });
  },

  // --- Productos ---
  getProductos(categoria = '') {
    const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    return api(`/api/productos${q}`);
  },

  // --- Comentarios ---
  getComentarios(productId) {
    return api(`/api/comentarios?producto_id=${productId}`);
  },

  createComentario(token, payload) {
    return api('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(payload),
    });
  },

  // --- Pedidos (ticket) ---
  myOrders(token) {
    return api('/api/orders', {
      headers: { ...authHeader(token) },
    });
  },

  createOrder(token, payload) {
    return api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(payload),
    });
  },
};

export default apix; // opcional
