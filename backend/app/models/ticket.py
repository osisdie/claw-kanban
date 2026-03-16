from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class TicketStatus(str, enum.Enum):
    TODO = "TODO"
    DOING = "Doing"
    PENDING_CONFIRM = "Pending Confirm"
    TESTING = "Testing"
    DONE = "Done"


VALID_TRANSITIONS: dict[TicketStatus, list[TicketStatus]] = {
    TicketStatus.TODO: [TicketStatus.DOING],
    TicketStatus.DOING: [TicketStatus.PENDING_CONFIRM, TicketStatus.TESTING],
    TicketStatus.PENDING_CONFIRM: [TicketStatus.DOING],
    TicketStatus.TESTING: [TicketStatus.DONE, TicketStatus.DOING],
    TicketStatus.DONE: [],
}


class Ticket(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "tickets"

    api_key_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]), default=TicketStatus.TODO)
    order: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)

    comments: Mapped[list[TicketComment]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    history: Mapped[list[TicketHistory]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class AuthorType(str, enum.Enum):
    AGENT = "agent"
    HUMAN = "human"


class TicketComment(Base, UUIDPrimaryKey):
    __tablename__ = "ticket_comments"

    ticket_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    author_type: Mapped[AuthorType] = mapped_column(Enum(AuthorType, values_callable=lambda x: [e.value for e in x]))
    author_id: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped[Ticket] = relationship(back_populates="comments")


class TicketHistory(Base, UUIDPrimaryKey):
    __tablename__ = "ticket_history"

    ticket_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    from_status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]))
    to_status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]))
    changed_by: Mapped[str] = mapped_column(String(255))
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped[Ticket] = relationship(back_populates="history")
