from datetime import datetime

from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    name: str
    project_name: str = "default"


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    project_name: str
    action_count: int
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None = None

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyResponse):
    raw_key: str  # only returned once at creation
