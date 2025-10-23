import pytest
from fastapi import status
from app.security import hash_password, verify_password

@pytest.mark.unit
@pytest.mark.asyncio
async def test_password_hash_roundtrip():
    plain = "demo123"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed)
    assert not verify_password("otra_clave", hashed)

@pytest.mark.functional
@pytest.mark.asyncio
async def test_register_login_me_flow(client):
    # Usa dominio válido; email-validator rechaza .test
    email = f"user_test_{id(object())}@example.com"

    r = await client.post("/api/auth/register", json={
        "email": email,
        "password": "demo123",
        "nombre": "Tester",
        "telefono": "999999999",
        "direccion": "Calle Falsa 123"
    })
    assert r.status_code == status.HTTP_201_CREATED, r.text

    # login
    r = await client.post("/api/auth/login", json={"email": email, "password": "demo123"})
    assert r.status_code == 200
    token = r.json()["access_token"]

    # me
    r = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email

@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_fail_password_incorrecta(client):
    res = await client.post("/api/auth/login", json={
        "email": "demo@saborreal.com",
        "password": "incorrecta"
    })
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
