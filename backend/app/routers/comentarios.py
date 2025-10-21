from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from .. import database
from ..schemas import ComentarioIn, ComentarioOut
from .auth import get_current_user_id

router = APIRouter(prefix="/api/comentarios", tags=["comentarios"])

def oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except Exception:
        raise HTTPException(status_code=400, detail="producto_id inválido")

# Listar comentarios por producto (público)
@router.get("", response_model=list[ComentarioOut])
async def listar(producto_id: str = Query(..., description="ID del producto")):
    cursor = database.db.comentarios.find({"producto_id": producto_id}).sort("creadoAt", -1)
    return await database.serialize_many(cursor)

# Crear comentario (requiere login)
@router.post("", response_model=ComentarioOut)
async def crear(payload: ComentarioIn, user_id: str = Depends(get_current_user_id)):
    # validar producto existe
    prod = await database.db.productos.find_one({"_id": oid(payload.producto_id), "activo": True})
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no disponible")

    doc = {
        "producto_id": payload.producto_id,
        "usuario_id": user_id,
        "texto": payload.texto,
        "rating": payload.rating,
        "creadoAt": datetime.utcnow(),
    }
    res = await database.db.comentarios.insert_one(doc)
    creado = await database.db.comentarios.find_one({"_id": res.inserted_id})
    return database.serialize_doc(creado)
