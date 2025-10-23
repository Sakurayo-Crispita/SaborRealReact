import os
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

os.environ.setdefault("ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("MONGODB_URI", "mongodb://127.0.0.1:27017")
os.environ.setdefault("MONGODB_DB", "sabor_test")

from app.main import app

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def client():
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
