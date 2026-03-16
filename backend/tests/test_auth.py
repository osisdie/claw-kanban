import pytest


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepass123",
        "name": "New User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"


@pytest.mark.asyncio
async def test_register_duplicate(client):
    payload = {"email": "dup@example.com", "password": "pass123", "name": "Dup"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/auth/register", json={
        "email": "login@example.com",
        "password": "pass123",
        "name": "Login User",
    })
    resp = await client.post("/auth/token", json={
        "email": "login@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "email": "wrong@example.com",
        "password": "correct",
        "name": "Wrong",
    })
    resp = await client.post("/auth/token", json={
        "email": "wrong@example.com",
        "password": "incorrect",
    })
    assert resp.status_code == 401
