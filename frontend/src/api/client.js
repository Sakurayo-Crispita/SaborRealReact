// src/api/client.js
const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Cliente genérico SIN headers extra en GET.
// Solo añade Content-Type si hay body (POST/PUT/PATCH/DELETE con JSON).
export async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});

  // Si hay cuerpo y no es FormData -> JSON
  if (opts.body && !(opts.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `${res.status} Error`);
  }

  return res.status === 204 ? null : res.json();
}
