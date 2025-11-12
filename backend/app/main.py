# backend/app/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from . import database
from .seed import seed
from .routers import productos, comentarios, auth, orders
from .routers.productos import admin as admin_products  # ← router admin de productos

# ---------- Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    await seed(database.db)
    try:
        yield
    finally:
        await database.disconnect()

app = FastAPI(title="Sabor Real API (MongoDB)", lifespan=lifespan)

# ---------- CORS ----------
# Usa CORS_ORIGINS si está definida; si no, aplica defaults útiles (prod + local).
# Incluyo ambas variantes por si tu sitio está como "saborreal" o "saboreal".
_default_origins = ",".join([
    "https://saborreal.netlify.app",
    "https://saboreal.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
])
origins = [
    o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,                          # lista explícita (prod + local)
    allow_origin_regex=r"https://.*\.netlify\.app$",# previews de Netlify (deploy previews)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],                            # incluye Authorization
)

# ---------- Routers ----------
app.include_router(productos.router)     # público productos
app.include_router(comentarios.router)   # público/privado comentarios
app.include_router(auth.router)          # auth
app.include_router(orders.router)        # pedidos (usuario)
app.include_router(admin_products)       # admin productos (CRUD)

# ---------- Health ----------
@app.get("/")
async def root():
    return {"ok": True, "service": "sabor-real-api-mongo"}

@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok"}

@app.head("/healthz", include_in_schema=False)
def healthz_head():
    return Response(status_code=200)
