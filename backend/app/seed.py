# backend/app/seed.py
from .security import get_password_hash 

async def seed(db):
    if await db.productos.count_documents({}) == 0:
        demo = [
            {"nombre":"Pan Francés","descripcion":"Clásico y crujiente","precio":0.50,"stock":200,"activo":True,"categoria":"pan"},
            {"nombre":"Croissant","descripcion":"Mantecoso y delicado","precio":2.20,"stock":80,"activo":True,"categoria":"postre"},
            {"nombre":"Torta de Chocolate","descripcion":"8 porciones","precio":25.00,"stock":12,"activo":True,"categoria":"postre"},
        ]
        await db.productos.insert_many(demo)
    await db.clientes.update_one(
        {"email": "demo@saborreal.com"},
        {"$set": {
            "nombre": "Cliente Demo",
            "email": "demo@saborreal.com",
            "password": get_password_hash("demo123"),
        }},
        upsert=True
    )
    await db.comentarios.create_index([("producto_id", 1)])
