# backend/app/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response


from . import database
from .seed import seed
from .routers import productos, comentarios, auth, orders  # ← usa SOLO orders

# Lifespan (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    await seed(database.db)
    try:
        yield
    finally:
        await database.disconnect()

app = FastAPI(title="Sabor Real API (MongoDB)", lifespan=lifespan)

# CORS (puedes configurar con variable, o deja estos por defecto)
origins = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if o.strip()]
# si usas variable:
# origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(productos.router)
app.include_router(comentarios.router)
app.include_router(auth.router)
app.include_router(orders.router)  # ← ticket/pedido (CREATED) sin pago

@app.get("/")
async def root():
    return {"ok": True, "service": "sabor-real-api-mongo"}
@app.get("/healthz", include_in_schema=False)
def healthz(): return {"status": "ok"}

@app.head("/healthz", include_in_schema=False)
def healthz_head(): return Response(status_code=200)