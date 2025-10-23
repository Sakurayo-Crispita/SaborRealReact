import pytest

@pytest.mark.smoke
@pytest.mark.anyio
async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"
