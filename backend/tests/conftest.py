import uuid

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, generate_api_key, hash_api_key, hash_password
from app.main import app
from app.models.base import Base
from app.models.user import ApiKey, User

# NullPool ensures each session gets a dedicated connection — no asyncpg contention
engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_initialized = False


async def init_db():
    global _initialized
    if not _initialized:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        _initialized = True


@pytest_asyncio.fixture
async def client():
    await init_db()

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(client) -> tuple:
    """Create user via API, return (user_data, auth_token)."""
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/auth/register", json={
        "email": email, "password": "testpassword", "name": "Test User",
    })
    resp = await client.post("/auth/token", json={
        "email": email, "password": "testpassword",
    })
    token = resp.json()["access_token"]
    return email, token


@pytest_asyncio.fixture
async def auth_token(test_user) -> str:
    _, token = test_user
    return token


@pytest_asyncio.fixture
async def test_api_key(client, auth_token) -> tuple[dict, str]:
    """Create an API key via API, return (key_info, raw_key)."""
    resp = await client.post(
        "/api-keys",
        json={"name": "test-key", "project_name": "test-project"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    data = resp.json()
    return data, data["raw_key"]
