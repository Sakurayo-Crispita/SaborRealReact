# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
import os, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from bson.errors import InvalidId


from .. import database             
from app.security import verify_password, hash_password  

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGO = "HS256"
ACCESS_EXPIRES_H = int(os.getenv("ACCESS_EXPIRES_H", "8")) 

router = APIRouter(prefix="/api/auth", tags=["auth"])

bearer_scheme = HTTPBearer(auto_error=False)

# ===== Schemas =====
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    telefono: str | None = None
    direccion: str | None = None

# ===== JWT =====
def create_access_token(payload: dict, expires_hours: int = ACCESS_EXPIRES_H) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=expires_hours)).timestamp()),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGO)

# ===== Dependencies =====
async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> str:
    # Si no llega o no es Bearer, 401
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Falta token Bearer")

    token = credentials.credentials
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
    except Exception as e:
        # 👇 Deja este print temporalmente para ver causa exacta en consola
        print("JWT decode error:", repr(e))
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id

async def get_current_user(user_id: str = Depends(get_current_user_id)):
    # Convierte el sub del JWT a ObjectId de forma segura
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        # El token tiene un sub inválido -> 401
        raise HTTPException(status_code=401, detail="Token inválido")

    u = await database.db.clientes.find_one({"_id": oid})
    if not u:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    u["_id"] = str(u["_id"])
    return u

# ===== Endpoints =====
@router.post("/register", status_code=201)
async def register(payload: UserRegister):
    exists = await database.db.clientes.find_one({"email": payload.email})
    if exists:
        raise HTTPException(status_code=409, detail="Email ya registrado")

    doc = {
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "nombre": payload.nombre,
        "telefono": payload.telefono,
        "direccion": payload.direccion,
        "rol": "customer",
        "createdAt": datetime.now(timezone.utc),
    }
    res = await database.db.clientes.insert_one(doc)
    return {"_id": str(res.inserted_id), "email": doc["email"], "nombre": doc["nombre"], "rol": "customer"}

@router.post("/login")
async def login(payload: UserLogin):
    user = await database.db.clientes.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token({"sub": str(user["_id"]), "email": user["email"], "rol": user.get("rol", "customer")})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
async def me(user = Depends(get_current_user)):
    return {
        "_id": user["_id"],
        "email": user["email"],
        "nombre": user.get("nombre"),
        "rol": user.get("rol", "customer"),
        "telefono": user.get("telefono"),
        "direccion": user.get("direccion"),
    }
