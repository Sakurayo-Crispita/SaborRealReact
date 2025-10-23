import pytest
from fastapi import status

pytestmark = pytest.mark.functional

@pytest.mark.asyncio
async def test_flow_login_comentar_y_listar(client):
    rlogin = await client.post("/api/auth/login", json={
        "email": "demo@saborreal.com",
        "password": "demo123"
    })
    assert rlogin.status_code == status.HTTP_200_OK
    token = rlogin.json()["access_token"]

    rprods = await client.get("/api/productos")
    assert rprods.status_code == 200
    prods = rprods.json()
    assert prods, "No hay productos en la BD para probar comentarios"
    producto_id = prods[0]["_id"]

    rcom = await client.post(
        "/api/comentarios",
        headers={"Authorization": f"Bearer {token}"},
        json={"producto_id": producto_id, "texto": "Muy rico", "rating": 5},
    )
    assert rcom.status_code == 200
    c = rcom.json()
    assert c["producto_id"] == producto_id
    assert c["rating"] == 5
