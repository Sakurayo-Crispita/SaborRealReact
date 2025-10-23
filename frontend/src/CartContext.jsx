// src/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth(); // <- email del usuario actual (o null si no logueado)

  // clave de storage por usuario (si no hay, usa "anon")
  const storageKey = useMemo(
    () => `sr_cart_${user?.email ?? 'anon'}`,
    [user?.email]
  );

  const [items, setItems] = useState([]);

  // Cargar carrito del usuario actual
  useEffect(() => {
    try {
      // migración: si existe el viejo 'sr_cart', úsalo una vez y bórralo
      const legacy = localStorage.getItem('sr_cart');
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setItems(JSON.parse(saved));
      } else if (legacy) {
        setItems(JSON.parse(legacy));
        localStorage.removeItem('sr_cart');
        localStorage.setItem(storageKey, legacy);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Guardar cambios del carrito para ese usuario
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  function addItem(product, qty = 1) {
    setItems(prev => {
      const i = prev.findIndex(x => x._id === product._id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { ...product, qty }];
    });
  }

  function removeItem(id) {
    setItems(prev => prev.filter(x => x._id !== id));
  }

  function clear() {
    setItems([]);
    try { localStorage.removeItem(storageKey); } catch {}
  }

  const total = items.reduce((acc, it) => acc + (Number(it.precio) || 0) * it.qty, 0);

  const value = useMemo(() => ({
    items, addItem, removeItem, clear, total
  }), [items, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
