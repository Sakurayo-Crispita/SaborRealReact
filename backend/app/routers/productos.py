from fastapi import APIRouter
from typing import List, Optional
from .. import database
from ..schemas import ProductoOut

router = APIRouter(prefix="/api/productos", tags=["productos"])

@router.get("", response_model=List[ProductoOut])
async def listar_productos(categoria: Optional[str] = None, activo: bool | None = None):
    query = {}
    if categoria:
        query["categoria"] = categoria
    if activo is not None:
        query["activo"] = activo
    cursor = database.db.productos.find(query).sort("nombre", 1)
    return await database.serialize_many(cursor)
