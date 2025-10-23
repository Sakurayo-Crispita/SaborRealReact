# tests/unit/backend/conftest.py
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from motor.motor_asyncio import AsyncIOMotorClient

# Variables de entorno para test (antes de importar la app)
os.environ.setdefault("ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("MONGODB_URI", "mongodb://127.0.0.1:27017")
os.environ.setdefault("MONGODB_DB", "sabor_test")

from app.main import app
from app import database as dbmod

# Fuerza a AnyIO a usar asyncio (no evita que cree su propio loop por test)
@pytest.fixture
def anyio_backend():
    return "asyncio"

# ⛔️ NO definimos event_loop de sesión: dejar que cada test tenga su loop propio

@pytest_asyncio.fixture(scope="function")
async def client():
    """
    Para CADA test, crea un MotorClient nuevo y lo inyecta en app.database,
    de modo que quede ligado al event loop del test actual.
    """
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongo_db  = os.getenv("MONGODB_DB", "sabor_test")

    # Cierra/descarta cualquier cliente previo del módulo database
    old_client = getattr(dbmod, "client", None)
    try:
        if old_client:
            old_client.close()
    except Exception:
        pass

    # Crea e inyecta cliente/db para ESTE test (mismo loop)
    new_client = AsyncIOMotorClient(mongo_uri)
    dbmod.client = new_client
    dbmod.db = new_client[mongo_db]

    # Si tu app usa app.state.db en startup, esto lo hace visible
    app.state.db = dbmod.db

    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    # Limpieza por test
    new_client.close()
