from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import check_quota, get_api_key, increment_quota
from app.models.ticket import Ticket, TicketComment, TicketHistory, TicketStatus, VALID_TRANSITIONS
from app.models.user import ApiKey
from app.schemas.ticket import (
    CommentCreate,
    CommentResponse,
    HistoryResponse,
    TicketCreate,
    TicketMove,
    TicketResponse,
    TicketUpdate,
)
from app.services.websocket import manager

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=list[TicketResponse])
async def list_tickets(
    status: list[TicketStatus] | None = Query(None),
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    query = select(Ticket).where(Ticket.api_key_id == api_key.id)
    if status:
        query = query.where(Ticket.status.in_(status))
    query = query.order_by(Ticket.order, Ticket.created_at)
    result = await db.execute(query)
    tickets = result.scalars().all()
    return [_ticket_response(t) for t in tickets]


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket(
    body: TicketCreate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    check_quota(api_key)
    ticket = Ticket(
        api_key_id=api_key.id,
        title=body.title,
        description=body.description,
        tags=body.tags,
        assignee=body.assignee,
    )
    db.add(ticket)
    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(ticket)

    await manager.broadcast(api_key.project_name, {
        "event": "ticket_created",
        "ticket": _ticket_dict(ticket),
    })
    return _ticket_response(ticket)


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str,
    body: TicketUpdate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_ticket(ticket_id, api_key, db)
    check_quota(api_key)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(ticket)

    await manager.broadcast(api_key.project_name, {
        "event": "ticket_updated",
        "ticket": _ticket_dict(ticket),
    })
    return _ticket_response(ticket)


@router.post("/{ticket_id}/move", response_model=TicketResponse)
async def move_ticket(
    ticket_id: str,
    body: TicketMove,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    ticket = await _get_ticket(ticket_id, api_key, db)
    check_quota(api_key)

    if body.status not in VALID_TRANSITIONS.get(ticket.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from {ticket.status.value} to {body.status.value}",
        )

    old_status = ticket.status
    ticket.status = body.status

    history = TicketHistory(
        ticket_id=ticket.id,
        from_status=old_status,
        to_status=body.status,
        changed_by=str(api_key.id),
        reason=body.reason,
    )
    db.add(history)
    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(ticket)

    await manager.broadcast(api_key.project_name, {
        "event": "ticket_moved",
        "ticket": _ticket_dict(ticket),
        "from_status": old_status.value,
        "to_status": body.status.value,
    })
    return _ticket_response(ticket)


@router.post("/{ticket_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(
    ticket_id: str,
    body: CommentCreate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    await _get_ticket(ticket_id, api_key, db)
    check_quota(api_key)

    comment = TicketComment(
        ticket_id=ticket_id,
        author_type=body.author_type,
        author_id=str(api_key.id),
        body=body.body,
    )
    db.add(comment)
    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(comment)

    await manager.broadcast(api_key.project_name, {
        "event": "comment_added",
        "ticket_id": ticket_id,
        "comment": {"id": str(comment.id), "body": comment.body, "author_type": comment.author_type.value},
    })
    return CommentResponse(
        id=str(comment.id), ticket_id=str(comment.ticket_id),
        author_type=comment.author_type, author_id=comment.author_id,
        body=comment.body, created_at=comment.created_at,
    )


@router.get("/{ticket_id}/history", response_model=list[HistoryResponse])
async def get_history(
    ticket_id: str,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    await _get_ticket(ticket_id, api_key, db)
    result = await db.execute(
        select(TicketHistory).where(TicketHistory.ticket_id == ticket_id).order_by(TicketHistory.created_at)
    )
    items = result.scalars().all()
    return [
        HistoryResponse(
            id=str(h.id), ticket_id=str(h.ticket_id),
            from_status=h.from_status, to_status=h.to_status,
            changed_by=h.changed_by, reason=h.reason, created_at=h.created_at,
        )
        for h in items
    ]


@router.get("/{ticket_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    ticket_id: str,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    await _get_ticket(ticket_id, api_key, db)
    result = await db.execute(
        select(TicketComment).where(TicketComment.ticket_id == ticket_id).order_by(TicketComment.created_at)
    )
    items = result.scalars().all()
    return [
        CommentResponse(
            id=str(c.id), ticket_id=str(c.ticket_id),
            author_type=c.author_type, author_id=c.author_id,
            body=c.body, created_at=c.created_at,
        )
        for c in items
    ]


async def _get_ticket(ticket_id: str, api_key: ApiKey, db: AsyncSession) -> Ticket:
    result = await db.execute(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.api_key_id == api_key.id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _ticket_response(t: Ticket) -> TicketResponse:
    return TicketResponse(
        id=str(t.id), api_key_id=str(t.api_key_id), title=t.title,
        description=t.description, status=t.status, order=t.order,
        tags=t.tags, assignee=t.assignee, created_at=t.created_at, updated_at=t.updated_at,
    )


def _ticket_dict(t: Ticket) -> dict:
    return {
        "id": str(t.id), "title": t.title, "status": t.status.value,
        "tags": t.tags, "assignee": t.assignee,
    }
