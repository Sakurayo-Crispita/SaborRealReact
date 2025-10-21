import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import database
from .seed import seed
from .routers import productos, comentarios, auth

app = FastAPI(title="Sabor Real API (MongoDB)")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_start():
    await database.connect()
    await seed(database.db)

@app.on_event("shutdown")
async def on_stop():
    await database.disconnect()

# Rutas
app.include_router(productos.router)
app.include_router(comentarios.router)  # <- nuevo
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"ok": True, "service": "sabor-real-api-mongo"}
