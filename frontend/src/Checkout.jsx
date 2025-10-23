import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function Checkout(){
  const { items, total, clear } = useCart();
  const [form, setForm] = useState({nombre:"", telefono:"", direccion:"", notas:""});

  const submit = async(e)=>{
    e.preventDefault();
    const token = localStorage.getItem("access_token"); // o tu AuthContext
    const body = {
      items: items.map(i=>({ producto_id: i.id, qty: i.qty })),
      delivery_nombre: form.nombre,
      delivery_telefono: form.telefono,
      delivery_direccion: form.direccion,
      notas: form.notas
    };
    const res = await fetch(`${import.meta.env.VITE_API}/api/pedidos`,{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if(!res.ok){ alert("Error al crear pedido"); return; }
    clear();
    alert("¡Pedido creado!");
  };

  return (
    <form onSubmit={submit}>
      {/* lista de items + total */}
      <input placeholder="Nombre entrega" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
      <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})}/>
      <input placeholder="Dirección" value={form.direccion} onChange={e=>setForm({...form, direccion:e.target.value})}/>
      <textarea placeholder="Notas" value={form.notas} onChange={e=>setForm({...form, notas:e.target.value})}/>
      <button type="submit">Confirmar pedido (${total.toFixed(2)})</button>
    </form>
  );
}
