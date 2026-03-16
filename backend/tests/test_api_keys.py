import pytest


@pytest.mark.asyncio
async def test_create_api_key(client, auth_token):
    resp = await client.post(
        "/api-keys",
        json={"name": "my-key", "project_name": "test"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "my-key"
    assert "raw_key" in data
    assert data["raw_key"].startswith("ck_")


@pytest.mark.asyncio
async def test_list_api_keys(client, auth_token):
    await client.post(
        "/api-keys",
        json={"name": "list-key"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    resp = await client.get(
        "/api-keys",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_delete_api_key(client, auth_token):
    create_resp = await client.post(
        "/api-keys",
        json={"name": "delete-me"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    key_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api-keys/{key_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200
