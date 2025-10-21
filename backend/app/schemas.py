from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId
from datetime import datetime

class MongoModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

# ---------- Productos ----------
class ProductoIn(MongoModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int = 0
    activo: bool = True
    imagenUrl: Optional[str] = None
    categoria: Optional[str] = None   # <-- antes: str

class ProductoOut(ProductoIn):
    id: str = Field(alias="_id")

# ---------- Auth ----------
class UserLogin(MongoModel):
    email: EmailStr
    password: str

# ---------- Comentarios ----------
class ComentarioIn(MongoModel):
    producto_id: str
    texto: str
    rating: int = Field(ge=1, le=5)

class ComentarioOut(MongoModel):
    id: str = Field(alias="_id")
    producto_id: str
    usuario_id: str
    texto: str
    rating: int
    creadoAt: datetime