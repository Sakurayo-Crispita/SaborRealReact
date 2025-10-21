# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
import os, time, jwt

from .. import database                  # <- usaremos database.db
from app.security import verify_password # <- compat bcrypt/pbkdf2

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGO = "HS256"

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def create_access_token(payload: dict, expires_in: int = 3600) -> str:
    to_encode = payload.copy()
    to_encode["exp"] = int(time.time()) + expires_in
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGO)

async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta token Bearer")
    token = authorization.split(" ", 1)[1]
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id

@router.post("/login")
async def login(payload: UserLogin):
    user = await database.db.clientes.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    return {"access_token": token, "token_type": "bearer"}
