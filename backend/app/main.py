# backend/app/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from . import database
from .seed import seed
from .routers import productos, comentarios, auth, orders

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
# Lee orígenes desde variable CORS_ORIGINS, con defaults útiles para prod y local
# IMPORTANTE: Netlify es https://<tu-sitio>.netlify.app (siempre HTTPS)
origins = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "https://saboreal.netlify.app,http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,                 # lista explícita (prod + local)
    allow_origin_regex=r"https://.*\.netlify\.app$",  # previews de Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers ----------
app.include_router(productos.router)
app.include_router(comentarios.router)
app.include_router(auth.router)
app.include_router(orders.router)

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
