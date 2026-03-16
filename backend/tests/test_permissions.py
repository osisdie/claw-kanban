import pytest


@pytest.mark.asyncio
async def test_create_permission(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    resp = await client.post(
        "/permissions",
        json={"resource": "github", "action": "push"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["resource"] == "github"


@pytest.mark.asyncio
async def test_approve_permission(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    create_resp = await client.post(
        "/permissions",
        json={"resource": "aws", "action": "s3:GetObject"},
        headers=headers,
    )
    perm_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/permissions/{perm_id}",
        json={"status": "granted"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "granted"


@pytest.mark.asyncio
async def test_bypass_permissions(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    # Create some pending permissions
    await client.post("/permissions", json={"resource": "r1", "action": "a1"}, headers=headers)
    await client.post("/permissions", json={"resource": "r2", "action": "a2"}, headers=headers)

    resp = await client.post(
        "/permissions/bypass",
        json={"confirm": True},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["count"] >= 2


@pytest.mark.asyncio
async def test_bypass_without_confirm(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    resp = await client.post(
        "/permissions/bypass",
        json={"confirm": False},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_store_credential(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    resp = await client.post(
        "/permissions/credentials",
        json={"label": "GitHub PAT", "value": "ghp_abc123"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["label"] == "GitHub PAT"
    assert "encrypted_value" not in data
    assert "value" not in data
