# app/routers/orders.py
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from typing import Any
import re


from .. import database
from ..schemas import OrderCreate, OrderOut, CartItem
from .auth import get_current_user_id

router = APIRouter(prefix="/api/orders", tags=["orders"])

def _oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except Exception:
        raise HTTPException(400, f"ObjectId inválido: {s}")

def _order_code() -> str:
    return datetime.now(timezone.utc).strftime("SR-%Y%m%d-%H%M%S")

# app/routers/orders.py

async def _calc_total_snapshot_and_reserve(items: list[CartItem]) -> tuple[float, list[dict[str, Any]]]:
    """
    Versión sin inventario: no valida ni descuenta stock.
    Solo verifica que el producto exista y esté activo, y calcula totales.
    """
    total = 0.0
    snapshot: list[dict[str, Any]] = []

    for it in items:
        prod = await database.db.productos.find_one({"_id": _oid(it.producto_id), "activo": True})
        if not prod:
            raise HTTPException(400, f"Producto no disponible: {it.producto_id}")

        precio = float(prod.get("precio", 0))
        subtotal = precio * it.qty
        total += subtotal

        snapshot.append({
            "producto_id": str(prod["_id"]),
            "nombre": prod.get("nombre"),
            "precio": precio,
            "qty": it.qty,
            "subtotal": round(subtotal, 2),
            "imagenUrl": prod.get("imagenUrl"),
        })

    return round(total, 2), snapshot

@router.post("", response_model=OrderOut, status_code=201)
async def create_order(payload: OrderCreate, user_id: str = Depends(get_current_user_id)):
    if not payload.items:
        raise HTTPException(400, "Carrito vacío")

    TEL_RGX = re.compile(r"^[\d+\-\s]{6,20}$")
    if not payload.delivery_nombre or not payload.delivery_nombre.strip():
        raise HTTPException(status_code=422, detail="Nombre de entrega requerido")
    if not TEL_RGX.match((payload.delivery_telefono or "").strip()):
        raise HTTPException(status_code=422, detail="Teléfono inválido")
    if not payload.delivery_direccion or len(payload.delivery_direccion.strip()) < 5:
        raise HTTPException(status_code=422, detail="Dirección muy corta")

    total, items_snapshot = await _calc_total_snapshot_and_reserve(payload.items)

    doc = {
        "code": _order_code(),
        "userId": _oid(user_id),
        "items": items_snapshot,
        "total": total,
        "status": "CREATED",
        "delivery": {
            "nombre": payload.delivery_nombre,
            "telefono": payload.delivery_telefono,
            "direccion": payload.delivery_direccion,
            "notas": payload.notas,
        },
        "createdAt": datetime.now(timezone.utc),
    }

    res = await database.db.pedidos.insert_one(doc)
    return {
        "_id": str(res.inserted_id),
        "code": doc["code"],
        "total": doc["total"],
        "status": doc["status"],
        "creadoAt": doc["createdAt"],
    }

@router.get("", response_model=list[OrderOut])
async def my_orders(user_id: str = Depends(get_current_user_id)):
    cur = database.db.pedidos.find({"userId": _oid(user_id)}).sort("createdAt", -1)
    out: list[dict[str, Any]] = []
    async for o in cur:
        out.append({
            "_id": str(o["_id"]),
            "code": o["code"],
            "total": float(o["total"]),
            "status": o["status"],
            "creadoAt": o["createdAt"],
        })
    return out

@router.get("/{order_id}")
async def order_detail(order_id: str, user_id: str = Depends(get_current_user_id)):
    o = await database.db.pedidos.find_one({"_id": _oid(order_id), "userId": _oid(user_id)})
    if not o:
        raise HTTPException(404, "Pedido no encontrado")
    o["_id"] = str(o["_id"])
    o["userId"] = str(o["userId"])
    return o
# --- ADMIN ORDERS ---
from fastapi import APIRouter as _APIRouter
from .auth import get_current_user

def _require_admin(user = Depends(get_current_user)):
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")
    return user

admin = _APIRouter(prefix="/api/admin/orders", tags=["admin:orders"])

@admin.get("", response_model=list[OrderOut])
async def admin_list_orders(user = Depends(_require_admin)):
    cur = database.db.pedidos.find({}).sort("createdAt", -1)
    out = []
    async for o in cur:
        out.append({
            "_id": str(o["_id"]),
            "code": o.get("code"),
            "total": float(o.get("total", 0)),
            "status": o.get("status", "CREATED"),
            "creadoAt": o.get("createdAt"),
        })
    return out

@admin.get("/{order_id}")
async def admin_order_detail(order_id: str, user = Depends(_require_admin)):
    o = await database.db.pedidos.find_one({"_id": _oid(order_id)})
    if not o:
        raise HTTPException(404, "Pedido no encontrado")
    o["_id"] = str(o["_id"])
    if "userId" in o:
        o["userId"] = str(o["userId"])
    return o

class _StatusPatch(BaseModel):
    status: OrderStatus

@admin.patch("/{order_id}")
async def admin_update_status(order_id: str, body: _StatusPatch, user = Depends(_require_admin)):
    res = await database.db.pedidos.update_one(
        {"_id": _oid(order_id)},
        {"$set": {"status": body.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Pedido no encontrado")
    return {"ok": True}
