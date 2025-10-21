async def seed(db):
    # Productos demo con categorías
    if await db.productos.count_documents({}) == 0:
        demo = [
            {"nombre":"Pan Francés","descripcion":"Clásico y crujiente","precio":0.50,"stock":200,"activo":True,"categoria":"pan"},
            {"nombre":"Croissant","descripcion":"Mantecoso y delicado","precio":2.20,"stock":80,"activo":True,"categoria":"postre"},
            {"nombre":"Torta de Chocolate","descripcion":"8 porciones","precio":25.00,"stock":12,"activo":True,"categoria":"postre"},
        ]
        await db.productos.insert_many(demo)

    # Usuario demo
    if await db.clientes.count_documents({}) == 0:
        from passlib.hash import pbkdf2_sha256  # más estable que bcrypt
        demo_user = {
            "nombre":"Cliente Demo",
            "email":"demo@saborreal.com",
            "password_hash": pbkdf2_sha256.hash("demo123"),
        }
        await db.clientes.insert_one(demo_user)

    # Índices útiles
    await db.comentarios.create_index([("producto_id", 1)])
