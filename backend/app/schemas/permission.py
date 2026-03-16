from datetime import datetime

from pydantic import BaseModel

from app.models.permission import PermissionStatus


class PermissionCreate(BaseModel):
    resource: str
    action: str
    metadata_: dict | None = None


class PermissionUpdate(BaseModel):
    status: PermissionStatus


class PermissionResponse(BaseModel):
    id: str
    api_key_id: str
    resource: str
    action: str
    status: PermissionStatus
    expires_at: datetime | None = None
    granted_by: str | None = None
    metadata_: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CredentialCreate(BaseModel):
    label: str
    value: str
    rotation_due_at: datetime | None = None


class CredentialResponse(BaseModel):
    id: str
    api_key_id: str
    label: str
    rotation_due_at: datetime | None = None
    last_accessed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BypassRequest(BaseModel):
    confirm: bool
