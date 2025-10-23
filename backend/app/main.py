# backend/app/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import productos, comentarios, auth, orders
from .routers import productos, comentarios, auth, pedidos

from . import database
from .seed import seed
from .routers import productos, comentarios, auth

# --- Lifespan (reemplaza on_event) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # === startup ===
    await database.connect()
    await seed(database.db)
    try:
        yield
    finally:
        # === shutdown ===
        await database.disconnect()

app = FastAPI(title="Sabor Real API (MongoDB)", lifespan=lifespan)

# CORS
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(productos.router)
app.include_router(comentarios.router)
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(pedidos.router)

@app.get("/")
async def root():
    return {"ok": True, "service": "sabor-real-api-mongo"}
