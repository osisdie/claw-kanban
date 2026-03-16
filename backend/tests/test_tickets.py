import pytest


@pytest.mark.asyncio
async def test_create_ticket(client, test_api_key):
    _, raw_key = test_api_key
    resp = await client.post(
        "/tickets",
        json={"title": "Test ticket", "description": "A test", "tags": ["claw-main"]},
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test ticket"
    assert data["status"] == "TODO"
    assert data["tags"] == ["claw-main"]


@pytest.mark.asyncio
async def test_list_tickets(client, test_api_key):
    _, raw_key = test_api_key
    await client.post(
        "/tickets",
        json={"title": "T1"},
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    resp = await client.get(
        "/tickets",
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_move_ticket(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    create_resp = await client.post(
        "/tickets",
        json={"title": "Movable ticket"},
        headers=headers,
    )
    ticket_id = create_resp.json()["id"]

    # TODO -> Doing
    resp = await client.post(
        f"/tickets/{ticket_id}/move",
        json={"status": "Doing", "reason": "Starting work"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Doing"


@pytest.mark.asyncio
async def test_invalid_move(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    create_resp = await client.post(
        "/tickets",
        json={"title": "Invalid move ticket"},
        headers=headers,
    )
    ticket_id = create_resp.json()["id"]

    # TODO -> Done (invalid)
    resp = await client.post(
        f"/tickets/{ticket_id}/move",
        json={"status": "Done"},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_full_ticket_lifecycle(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    # Create
    resp = await client.post("/tickets", json={"title": "Lifecycle"}, headers=headers)
    tid = resp.json()["id"]

    # TODO -> Doing
    await client.post(f"/tickets/{tid}/move", json={"status": "Doing"}, headers=headers)
    # Doing -> Testing
    await client.post(f"/tickets/{tid}/move", json={"status": "Testing"}, headers=headers)
    # Testing -> Done
    resp = await client.post(f"/tickets/{tid}/move", json={"status": "Done"}, headers=headers)
    assert resp.json()["status"] == "Done"

    # Verify history
    hist_resp = await client.get(f"/tickets/{tid}/history", headers=headers)
    assert len(hist_resp.json()) == 3


@pytest.mark.asyncio
async def test_comments(client, test_api_key):
    _, raw_key = test_api_key
    headers = {"Authorization": f"Bearer {raw_key}"}

    create_resp = await client.post("/tickets", json={"title": "Comment test"}, headers=headers)
    tid = create_resp.json()["id"]

    resp = await client.post(
        f"/tickets/{tid}/comments",
        json={"author_type": "human", "body": "Hello from human"},
        headers=headers,
    )
    assert resp.status_code == 201

    resp = await client.post(
        f"/tickets/{tid}/comments",
        json={"author_type": "agent", "body": "Hello from agent"},
        headers=headers,
    )
    assert resp.status_code == 201

    comments_resp = await client.get(f"/tickets/{tid}/comments", headers=headers)
    comments = comments_resp.json()
    assert len(comments) == 2
    assert comments[0]["author_type"] == "human"
    assert comments[1]["author_type"] == "agent"
