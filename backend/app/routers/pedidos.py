from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from .. import database
from ..schemas import PedidoIn, PedidoOut
from .auth import get_current_user, get_current_user_id  # ya lo tienes

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])

@router.post("", response_model=dict, status_code=201)
async def crear_pedido(payload: PedidoIn, user = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(400, "El pedido debe tener items")

    # Validar y calcular total, descontar stock
    total = 0.0
    items_doc = []
    for it in payload.items:
        prod = await database.db.productos.find_one({"_id": database.to_object_id(it.producto_id), "activo": True})
        if not prod:
            raise HTTPException(404, f"Producto {it.producto_id} no encontrado")
        if prod.get("stock", 0) < it.qty:
            raise HTTPException(409, f"Sin stock para {prod['nombre']}")

        # descontar stock (update atómico)
        res = await database.db.productos.update_one(
            {"_id": prod["_id"], "stock": {"$gte": it.qty}},
            {"$inc": {"stock": -it.qty}}
        )
        if res.matched_count == 0:
            raise HTTPException(409, f"Stock cambió para {prod['nombre']}")

        linea_total = float(prod["precio"]) * it.qty
        total += linea_total
        items_doc.append({
            "producto_id": str(prod["_id"]),
            "nombre": prod["nombre"],
            "precio": float(prod["precio"]),
            "qty": it.qty,
            "subtotal": linea_total
        })

    doc = {
        "usuario_id": user["_id"],
        "items": items_doc,
        "total": round(total, 2),
        "estado": "creado",
        "delivery": {
            "nombre": payload.delivery_nombre,
            "telefono": payload.delivery_telefono,
            "direccion": payload.delivery_direccion,
            "notas": payload.notas,
        },
        "creadoAt": datetime.now(timezone.utc),
    }
    ins = await database.db.pedidos.insert_one(doc)
    return {"_id": str(ins.inserted_id), "total": doc["total"], "estado": doc["estado"]}

@router.get("/mios", response_model=list[PedidoOut])
async def mis_pedidos(user_id: str = Depends(get_current_user_id)):
    cur = database.db.pedidos.find({"usuario_id": user_id}).sort("creadoAt", -1)
    res = []
    async for p in cur:
        p["_id"] = str(p["_id"])
        res.append({
            "_id": p["_id"],
            "usuario_id": p["usuario_id"],
            "items": p["items"],
            "total": p["total"],
            "estado": p["estado"],
            "creadoAt": p["creadoAt"],
        })
    return res
