from datetime import datetime

from pydantic import BaseModel

from app.models.ticket import AuthorType, TicketStatus


class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    tags: list[str] | None = None
    assignee: str | None = None


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    assignee: str | None = None
    order: int | None = None


class TicketMove(BaseModel):
    status: TicketStatus
    reason: str | None = None


class TicketResponse(BaseModel):
    id: str
    api_key_id: str
    title: str
    description: str | None = None
    status: TicketStatus
    order: int
    tags: list[str] | None = None
    assignee: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    author_type: AuthorType
    body: str


class CommentResponse(BaseModel):
    id: str
    ticket_id: str
    author_type: AuthorType
    author_id: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    id: str
    ticket_id: str
    from_status: TicketStatus
    to_status: TicketStatus
    changed_by: str
    reason: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
