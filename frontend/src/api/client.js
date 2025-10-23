// src/api/client.js
const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function ensureSessionId() {
  let sid = localStorage.getItem("sr_sid");
  if (!sid) {
    sid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem("sr_sid", sid);
  }
  return sid;
}

// Header Authorization para cuando lo necesites (stubs abajo)
export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Cliente genérico que SIEMPRE manda X-Session-Id
export async function api(path, opts = {}) {
  const sid = ensureSessionId();
  const headers = new Headers(opts.headers || {});
  if (!(opts.body instanceof FormData)) {
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  }
  headers.set("X-Session-Id", sid);

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `${res.status} Error`);
  }
  // 204 no content
  if (res.status === 204) return null;
  return res.json();
}
