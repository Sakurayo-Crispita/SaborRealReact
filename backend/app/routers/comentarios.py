# app/routers/comentarios.py
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone

from .. import database
from ..schemas import ComentarioIn, ComentarioOut
from .auth import get_current_user_id

router = APIRouter(prefix="/api/comentarios", tags=["comentarios"])

def _oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except Exception:
        raise HTTPException(status_code=400, detail="producto_id inválido")

# GET /api/comentarios?producto_id=...&limit=50
@router.get("", response_model=list[ComentarioOut])
async def listar(
    producto_id: str = Query(..., description="ID del producto"),
    limit: int = Query(50, ge=1, le=200),
):
    # index recomendado: db.comentarios.createIndex({ producto_id: 1, creadoAt: -1 })
    cursor = (
        database.db.comentarios
        .find({"producto_id": producto_id})
        .sort("creadoAt", -1)
        .limit(limit)
    )
    return await database.serialize_many(cursor)

@router.post("", response_model=ComentarioOut, status_code=201)
async def crear(payload: ComentarioIn, user_id: str = Depends(get_current_user_id)):
    # Validar producto (aceptando "activo" o "disponible")
    prod = await database.db.productos.find_one({
        "_id": _oid(payload.producto_id),
        "$or": [
            {"activo": True},
            {"disponible": True},
            {"activo": {"$exists": False}, "disponible": {"$exists": False}},  # fallback si no usas flags
        ],
    })
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no disponible")

    # Construir documento
    doc = {
        "producto_id": payload.producto_id,          # str: consistente con front
        "usuario_id": ObjectId(user_id),             # guarda como ObjectId (más consistente)
        "texto": payload.texto.strip(),
        "rating": int(payload.rating),
        "creadoAt": datetime.now(timezone.utc),
    }
    if not doc["texto"]:
        raise HTTPException(status_code=422, detail="El comentario no puede estar vacío")

    res = await database.db.comentarios.insert_one(doc)
    creado = await database.db.comentarios.find_one({"_id": res.inserted_id})
    # Asegurar serialización (_id y usuario_id a str)
    creado["_id"] = str(creado["_id"])
    if isinstance(creado.get("usuario_id"), ObjectId):
        creado["usuario_id"] = str(creado["usuario_id"])
    return creado
