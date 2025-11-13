import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth(); // email del usuario (o null si no logueado)

  // Storage separado por usuario (si no hay, "anon")
  const storageKey = useMemo(
    () => `sr_cart_${user?.email ?? "anon"}`,
    [user?.email]
  );

  const [items, setItems] = useState([]);

  // Cargar carrito del usuario actual (con migración desde 'sr_cart')
  useEffect(() => {
    try {
      const legacy = localStorage.getItem("sr_cart");
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setItems(JSON.parse(saved));
      } else if (legacy) {
        setItems(JSON.parse(legacy));
        localStorage.removeItem("sr_cart");
        localStorage.setItem(storageKey, legacy);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Persistir carrito
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  // Normaliza el producto a la forma que guardamos en el carrito
  function normalizeProduct(product) {
    return {
      _id: product._id ?? product.id,
      nombre: product.nombre ?? product.title ?? "Producto",
      precio: Number(product.precio ?? product.price ?? 0),
      imagenUrl: product.imagenUrl ?? product.image ?? null,
    };
  }

  // ==== API del carrito ====
  function addItem(product, qty = 1) {
    const p = normalizeProduct(product);
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => {
      const i = prev.findIndex((x) => x._id === p._id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + q };
        return copy;
      }
      return [...prev, { ...p, qty: q }];
    });
  }

  function setQty(id, qty) {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, qty: q } : x)));
  }

  function inc(id) {
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, qty: x.qty + 1 } : x)));
  }

  function dec(id) {
    setItems((prev) =>
      prev.map((x) =>
        x._id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x
      )
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x._id !== id));
  }

  function clear() {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.precio) || 0) * it.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, setQty, inc, dec, removeItem, clear, total }),
    [items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
