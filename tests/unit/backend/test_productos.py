import pytest
from fastapi import status

@pytest.mark.unit
@pytest.mark.asyncio
async def test_listar_productos_todas(client):
    res = await client.get("/api/productos")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert isinstance(data, list)

@pytest.mark.unit
@pytest.mark.asyncio
async def test_listar_productos_filtrado_pan(client):
    res = await client.get("/api/productos", params={"categoria": "pan"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert all((p.get("categoria") or "").lower() == "pan" for p in data)
