// frontend/src/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sr_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('sr_cart', JSON.stringify(items));
  }, [items]);

  function add(prod, qty = 1) {
    setItems(prev => {
      const i = prev.findIndex(x => x.producto_id === prod._id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { producto_id: prod._id, nombre: prod.nombre, precio: prod.precio, qty }];
    });
  }
  function remove(producto_id) {
    setItems(prev => prev.filter(x => x.producto_id !== producto_id));
  }
  function clear() { setItems([]); }

  const total = items.reduce((s, it) => s + it.precio * it.qty, 0);

  const value = useMemo(() => ({ items, add, remove, clear, total }), [items, total]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
