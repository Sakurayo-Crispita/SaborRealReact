# backend/app/seed.py
from .security import hash_password  

async def seed(db):
    prods = [
        {"nombre":"Pan Francés","descripcion":"Clásico y crujiente","precio":0.50,"stock":200,"activo":True,"categoria":"pan"},
        {"nombre":"Croissant","descripcion":"Mantecoso y delicado","precio":2.20,"stock":80,"activo":True,"categoria":"postre"},
        {"nombre":"Torta de Chocolate","descripcion":"8 porciones","precio":25.00,"stock":12,"activo":True,"categoria":"postre"},
    ]
    for p in prods:
        await db.productos.update_one(
            {"nombre": p["nombre"]},
            {"$setOnInsert": p},
            upsert=True,
        )

    await db.clientes.update_one(
        {"email": "demo@saborreal.com"},
        {"$setOnInsert": {
            "nombre": "Cliente Demo",
            "email": "demo@saborreal.com",
            "password_hash": hash_password("demo123"), 
        }},
        upsert=True
    )

    await db.comentarios.create_index([("producto_id", 1)])