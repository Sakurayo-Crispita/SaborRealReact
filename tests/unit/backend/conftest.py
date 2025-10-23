# tests/unit/backend/conftest.py
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from motor.motor_asyncio import AsyncIOMotorClient

os.environ.setdefault("ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("MONGODB_URI", "mongodb://127.0.0.1:27017")
os.environ.setdefault("MONGODB_DB", "sabor_test")

from app.main import app
from app import database as dbmod

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest_asyncio.fixture(scope="function")
async def client():
    """
    Para CADA test, crea un MotorClient nuevo y lo inyecta en app.database,
    de modo que quede ligado al event loop del test actual.
    """
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongo_db  = os.getenv("MONGODB_DB", "sabor_test")

    old_client = getattr(dbmod, "client", None)
    try:
        if old_client:
            old_client.close()
    except Exception:
        pass

    new_client = AsyncIOMotorClient(mongo_uri)
    dbmod.client = new_client
    dbmod.db = new_client[mongo_db]

    app.state.db = dbmod.db

    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    new_client.close()
