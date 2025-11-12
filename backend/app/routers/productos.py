# app/routers/productos.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Any, Dict
from bson import ObjectId
from bson.errors import InvalidId

from .. import database
from ..schemas import ProductoIn, ProductoOut
from .auth import get_current_user  # para chequear rol admin

# -------- ADMIN --------
from fastapi import APIRouter as _APIRouter
admin = _APIRouter(prefix="/api/admin/products", tags=["admin:products"])

def require_admin(user = Depends(get_current_user)):
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")
    return user

@admin.get("", response_model=List[ProductoOut])
async def admin_list_products(
    user = Depends(require_admin),
    categoria: Optional[str] = None,
    activo: Optional[bool] = None,
    all: Optional[int] = Query(default=1, description="Por defecto 1: lista todo"),
):
    query: Dict[str, Any] = {}
    if categoria:
        query["categoria"] = categoria
    if all != 1:
        # si ponen all != 1, aplicamos filtro activo (por defecto True)
        if activo is None:
            activo = True
        query["activo"] = activo
    cursor = database.db.productos.find(query).sort("nombre", 1)
    return await _serialize_many(cursor)

@admin.post("", response_model=ProductoOut, status_code=201)
async def admin_create_product(payload: ProductoIn, user = Depends(require_admin)):
    data = _normalize_payload(payload.model_dump(exclude_unset=True))
    # defaults mínimos
    data.setdefault("activo", True)
    data.setdefault("stock", 0)
    ins = await database.db.productos.insert_one(data)
    doc = await database.db.productos.find_one({"_id": ins.inserted_id})
    return database.serialize_doc(doc)

@admin.put("/{product_id}", response_model=ProductoOut)
async def admin_update_product(product_id: str, payload: ProductoIn, user = Depends(require_admin)):
    data = _normalize_payload(payload.model_dump(exclude_unset=True))
    res = await database.db.productos.update_one(
        {"_id": _oid(product_id)},
        {"$set": data},
        upsert=False,
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not Found")
    doc = await database.db.productos.find_one({"_id": _oid(product_id)})
    return database.serialize_doc(doc)

@admin.delete("/{product_id}", status_code=204)
async def admin_delete_product(product_id: str, user = Depends(require_admin)):
    res = await database.db.productos.delete_one({"_id": _oid(product_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not Found")
    return None


router = APIRouter(prefix="/api/productos", tags=["productos"])

# -------- utils --------
def _oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ObjectId inválido")

async def _serialize_many(cursor):
    return await database.serialize_many(cursor)

def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asegura compatibilidad con el front:
    - disponible -> activo
    - limpia strings
    """
    out = dict(payload or {})
    if "disponible" in out and "activo" not in out:
        out["activo"] = bool(out.get("disponible"))
    # saneo simple de strings
    for key in ("nombre", "descripcion", "categoria", "imagenUrl"):
        if key in out and isinstance(out[key], str):
            out[key] = out[key].strip()
    return out

# -------- público --------
@router.get("", response_model=List[ProductoOut])
async def listar_productos(
    categoria: Optional[str] = None,
    activo: Optional[bool] = None,
    all: Optional[int] = Query(default=None, description="1 para listar todos, ignorando activo"),
    disponible: Optional[bool] = None,  # compat: si lo envían desde el front
):
    query: Dict[str, Any] = {}

    if categoria:
        query["categoria"] = categoria

    # compat: si llega "disponible", úsalo como "activo"
    if disponible is not None and activo is None:
        activo = bool(disponible)

    if all == 1:
        # lista todo sin filtrar por activo
        pass
    else:
        # por defecto, solo activos
        if activo is None:
            activo = True
        query["activo"] = activo

    cursor = database.db.productos.find(query).sort("nombre", 1)
    return await _serialize_many(cursor)
