# backend/app/seed.py
from .security import hash_password  

# Usaremos rutas públicas del frontend (Netlify sirve /public como raíz)
IMAGES = {
    "Pan Francés": "/img/panfrance.jpg",
    "Croissant": "/img/croissant.jpg",
    "Torta de Chocolate": "/img/tortachoco.jpg",
}

async def seed(db):
    prods = [
        {
            "nombre": "Pan Francés",
            "descripcion": "Clásico y crujiente",
            "precio": 0.50,
            "stock": 200,
            "activo": True,
            "categoria": "pan",
            "imagenUrl": IMAGES["Pan Francés"],
        },
        {
            "nombre": "Croissant",
            "descripcion": "Mantecoso y delicado",
            "precio": 2.20,
            "stock": 80,
            "activo": True,
            "categoria": "postre",
            "imagenUrl": IMAGES["Croissant"],
        },
        {
            "nombre": "Torta de Chocolate",
            "descripcion": "8 porciones",
            "precio": 25.00,
            "stock": 12,
            "activo": True,
            "categoria": "postre",
            "imagenUrl": IMAGES["Torta de Chocolate"],
        },
    ]

    for p in prods:
        # Inserta si no existe
        await db.productos.update_one(
            {"nombre": p["nombre"]},
            {"$setOnInsert": p},
            upsert=True,
        )
        # Asegura/actualiza imagen y descripción
        await db.productos.update_one(
            {"nombre": p["nombre"]},
            {"$set": {
                "imagenUrl": p["imagenUrl"],
                "descripcion": p["descripcion"],
            }}
        )

    # Usuario demo
    await db.clientes.update_one(
        {"email": "demo@saborreal.com"},
        {"$setOnInsert": {
            "nombre": "Cliente Demo",
            "email": "demo@saborreal.com",
            "password_hash": hash_password("demo123"),
        }},
        upsert=True
    )

    # Índice para comentarios
    await db.comentarios.create_index([("producto_id", 1)])
