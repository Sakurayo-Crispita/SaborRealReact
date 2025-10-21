const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export const api = {
  async getProductos(categoria = '') {
    const url = new URL(`${BASE}/api/productos`);
    if (categoria) url.searchParams.set('categoria', categoria);
    const r = await fetch(url);
    if (!r.ok) throw new Error('Error listando productos');
    return r.json();
  },

  async login(email, password) {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error('Credenciales inválidas');
    return r.json(); // { access_token, token_type }
  },

  async createComentario(token, { producto_id, texto, rating }) {
    const r = await fetch(`${BASE}/api/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ producto_id, texto, rating })
    });
    if (!r.ok) throw new Error('No se pudo crear el comentario');
    return r.json();
  },

  async getComentarios(producto_id) {
    const url = new URL(`${BASE}/api/comentarios`);
    url.searchParams.set('producto_id', producto_id);
    const r = await fetch(url);
    if (!r.ok) throw new Error('Error listando comentarios');
    return r.json();
  }
};
