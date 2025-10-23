import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext();
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("cart")||"[]"));
  useEffect(()=> localStorage.setItem("cart", JSON.stringify(items)), [items]);

  const add = (producto, qty=1) => {
    setItems(prev=>{
      const i = prev.findIndex(p=>p.id===producto.id);
      if (i>=0) { const cp=[...prev]; cp[i].qty += qty; return cp; }
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: producto.precio, qty }];
    });
  };
  const remove = id => setItems(prev=>prev.filter(i=>i.id!==id));
  const setQty = (id, qty) => setItems(prev=>prev.map(i=>i.id===id?{...i, qty}:i));
  const clear = () => setItems([]);

  const total = items.reduce((s,i)=>s + i.precio * i.qty, 0);
  return <CartCtx.Provider value={{items, add, remove, setQty, clear, total}}>{children}</CartCtx.Provider>;
}
