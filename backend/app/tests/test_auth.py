import pytest
from fastapi import status
from app.security import hash_password, verify_password

@pytest.mark.asyncio
async def test_password_hash_roundtrip():
    plain = "demo123"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed)
    assert not verify_password("otra_clave", hashed)

@pytest.mark.asyncio
async def test_login_ok(client):
    res = await client.post("/api/auth/login", json={
        "email": "demo@saborreal.com",
        "password": "demo123"
    })
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"

@pytest.mark.asyncio
async def test_login_fail_password_incorrecta(client):
    res = await client.post("/api/auth/login", json={
        "email": "demo@saborreal.com",
        "password": "incorrecta"
    })
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
