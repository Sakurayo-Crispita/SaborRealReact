import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { apix } from './api/api';

export default function Checkout() {
  const { token, isAuthenticated } = useAuth();
  const { items, total, clear } = useCart();
  const [form, setForm] = useState({
    delivery_nombre: '',
    delivery_telefono: '',
    delivery_direccion: '',
    notas: '',
  });
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function onChange(e){ setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submit(e) {
    e.preventDefault();
    if (!isAuthenticated) { alert('Inicia sesión'); return; }
    if (items.length === 0) { alert('Tu ticket está vacío'); return; }

    // Construye el payload que espera /api/orders
    const payload = {
      items: items.map(it => ({ producto_id: it._id || it.id, qty: Number(it.qty) || 1 })),
      delivery_nombre: form.delivery_nombre || 'Cliente',
      delivery_telefono: form.delivery_telefono || '',
      delivery_direccion: form.delivery_direccion || '',
      notas: form.notas || '',
    };

    try {
      setSubmitting(true);
      const o = await apix.createOrder(token, payload);
      setDone(o);
      clear();
    } catch (err) {
      console.error(err);
      alert(err?.message || 'No se pudo crear el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{maxWidth:800, margin:'2rem auto', padding:'0 1rem', color:'#eee'}}>
      <h2>Ticket</h2>
      {items.length === 0 ? <p>No hay productos en tu ticket.</p> : (
        <table style={{width:'100%', borderCollapse:'collapse', marginBottom:16}}>
          <thead><tr><th align="left">Producto</th><th>Qty</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>
            {items.map(it => {
              const nombre = it.nombre ?? it.title ?? 'Producto';
              const precio = Number(it.precio ?? it.price ?? 0);
              return (
                <tr key={it._id || it.id}>
                  <td>{nombre}</td>
                  <td align="center">{it.qty}</td>
                  <td align="right">${precio.toFixed(2)}</td>
                  <td align="right">${(precio * it.qty).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} align="right"><b>Total</b></td>
              <td align="right"><b>${total.toFixed(2)}</b></td>
            </tr>
          </tfoot>
        </table>
      )}

      <h3>Datos de entrega</h3>
      <form onSubmit={submit} style={{display:'grid', gap:8, maxWidth:480}}>
        <input name="delivery_nombre" value={form.delivery_nombre} onChange={onChange} placeholder="Nombre" />
        <input name="delivery_telefono" value={form.delivery_telefono} onChange={onChange} placeholder="Teléfono" />
        <input name="delivery_direccion" value={form.delivery_direccion} onChange={onChange} placeholder="Dirección" />
        <textarea name="notas" value={form.notas} onChange={onChange} placeholder="Notas (opcional)" />
        <button type="submit" disabled={items.length===0 || submitting}>
          {submitting ? 'Creando…' : 'Confirmar pedido'}
        </button>
      </form>

      {done && (
        <div style={{marginTop:16, padding:12, border:'1px solid #2a2a2a', borderRadius:8}}>
          <b>¡Pedido creado!</b><br/>
          Código: {done.code}<br/>
          Total: ${Number(done.total).toFixed(2)}<br/>
          Estado: {done.status}<br/>
          Creado: {new Date(done.creadoAt || done.created_at || Date.now()).toLocaleString()}
        </div>
      )}
    </main>
  );
}
