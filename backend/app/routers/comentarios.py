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
    # ❗ CAMBIO: evitar utilidad externa; serializar a mano
    cursor = (
        database.db.comentarios
        .find({"producto_id": producto_id})
        .sort("creadoAt", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
        if isinstance(d.get("usuario_id"), ObjectId):
            d["usuario_id"] = str(d["usuario_id"])
        # rating como int seguro
        if "rating" in d:
            try:
                d["rating"] = int(d["rating"])
            except Exception:
                d["rating"] = 0
    return docs

@router.post("", response_model=ComentarioOut, status_code=201)
async def crear(payload: ComentarioIn, user_id: str = Depends(get_current_user_id)):
    # Validar producto (aceptando "activo" o "disponible")
    prod = await database.db.productos.find_one({
        "_id": _oid(payload.producto_id),
        "$or": [
            {"activo": True},
            {"disponible": True},
            {"activo": {"$exists": False}, "disponible": {"$exists": False}},
        ],
    })
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no disponible")

    doc = {
        "producto_id": payload.producto_id,   # se guarda como str
        "usuario_id": ObjectId(user_id),
        "texto": payload.texto.strip(),
        "rating": int(payload.rating),
        "creadoAt": datetime.now(timezone.utc),
    }
    if not doc["texto"]:
        raise HTTPException(status_code=422, detail="El comentario no puede estar vacío")

    res = await database.db.comentarios.insert_one(doc)
    creado = await database.db.comentarios.find_one({"_id": res.inserted_id})
    creado["_id"] = str(creado["_id"])
    if isinstance(creado.get("usuario_id"), ObjectId):
        creado["usuario_id"] = str(creado["usuario_id"])
    return creado
