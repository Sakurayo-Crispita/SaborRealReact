// src/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sr_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('sr_cart', JSON.stringify(items));
  }, [items]);

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

  function clear() { setItems([]); }

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
