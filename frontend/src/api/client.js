// src/api/client.js
const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
