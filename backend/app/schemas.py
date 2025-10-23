from typing import Optional, List, Literal 
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
    precio: float = Field(gt=0, description="Precio > 0")
    stock: int = Field(ge=0, description="Stock no negativo")
    activo: bool = True
    imagenUrl: Optional[str] = None
    categoria: Optional[str] = None

class ProductoOut(ProductoIn):
    id: str = Field(alias="_id")

# ---------- Auth ----------
class UserLogin(MongoModel):
    email: EmailStr
    password: str

class UserRegister(MongoModel):
    email: EmailStr
    password: str
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class UserOut(MongoModel):
    id: str = Field(alias="_id")
    email: EmailStr
    nombre: str
    rol: Literal["customer", "admin"] = "customer"

class TokenOut(MongoModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"   

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

# ---------- Carrito / Pedido ----------
class CartItem(MongoModel):
    producto_id: str
    qty: int = Field(gt=0)

OrderStatus = Literal["CREATED", "PAID", "CANCELLED", "DELIVERED"]

class OrderCreate(MongoModel):
    items: List[CartItem]
    delivery_nombre: str
    delivery_telefono: str
    delivery_direccion: str
    notas: Optional[str] = None

class OrderOut(MongoModel):
    id: str = Field(alias="_id")
    code: str
    total: float
    status: OrderStatus
    creadoAt: datetime

# Items de pedido
class PedidoItem(MongoModel):
    producto_id: str
    qty: int = Field(ge=1)

class PedidoIn(MongoModel):
    items: List[PedidoItem]
    delivery_nombre: str
    delivery_telefono: Optional[str] = None
    delivery_direccion: Optional[str] = None
    notas: Optional[str] = None

class PedidoOut(MongoModel):
    id: str = Field(alias="_id")
    usuario_id: str
    items: List[dict]
    total: float
    estado: str
    creadoAt: datetime