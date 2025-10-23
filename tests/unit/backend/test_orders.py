import pytest
from fastapi import status

pytestmark = pytest.mark.functional


@pytest.mark.anyio
async def test_create_order_and_list(client):
    # login demo
    r = await client.post("/api/auth/login", json={"email": "demo@saborreal.com", "password": "demo123"})
    assert r.status_code == status.HTTP_200_OK
    token = r.json()["access_token"]

    # obtener un producto
    r = await client.get("/api/productos")
    assert r.status_code == 200
    prod = r.json()[0]

    # crear orden
    payload = {
        "items": [{"producto_id": prod["_id"], "qty": 1}],
        "delivery_nombre": "Cliente Demo",
        "delivery_telefono": "999999999",
        "delivery_direccion": "Calle de prueba 123",
        "notas": "dejar en puerta"
    }
    r = await client.post("/api/orders", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == status.HTTP_201_CREATED, r.text
    created = r.json()
    assert "code" in created and created["status"] == "CREATED"

    # listar mis órdenes
    r = await client.get("/api/orders", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    arr = r.json()
    assert any(o["code"] == created["code"] for o in arr)
