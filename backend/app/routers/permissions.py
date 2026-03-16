from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import check_quota, get_api_key, increment_quota
from app.core.security import encrypt_value
from app.models.permission import AgentCredential, AgentPermission, AuditLog, PermissionStatus
from app.models.user import ApiKey
from app.schemas.permission import (
    BypassRequest,
    CredentialCreate,
    CredentialResponse,
    PermissionCreate,
    PermissionResponse,
    PermissionUpdate,
)
from app.services.websocket import manager

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentPermission).where(AgentPermission.api_key_id == api_key.id)
    )
    perms = result.scalars().all()
    return [_perm_response(p) for p in perms]


@router.post("", response_model=PermissionResponse, status_code=201)
async def request_permission(
    body: PermissionCreate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    check_quota(api_key)
    perm = AgentPermission(
        api_key_id=api_key.id,
        resource=body.resource,
        action=body.action,
        metadata_=body.metadata_,
    )
    db.add(perm)
    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(perm)

    await manager.broadcast(api_key.project_name, {
        "event": "permission_requested",
        "permission": {"id": str(perm.id), "resource": perm.resource, "action": perm.action},
    })
    return _perm_response(perm)


@router.patch("/{perm_id}", response_model=PermissionResponse)
async def update_permission(
    perm_id: str,
    body: PermissionUpdate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentPermission).where(AgentPermission.id == perm_id, AgentPermission.api_key_id == api_key.id)
    )
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    perm.status = body.status
    if body.status == PermissionStatus.GRANTED:
        perm.granted_by = str(api_key.id)

    await db.commit()
    await db.refresh(perm)

    await manager.broadcast(api_key.project_name, {
        "event": "permission_updated",
        "permission": {"id": str(perm.id), "status": perm.status.value},
    })
    return _perm_response(perm)


@router.post("/bypass")
async def bypass_permissions(
    body: BypassRequest,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    if not body.confirm:
        raise HTTPException(status_code=400, detail="Must explicitly confirm bypass")

    # Grant all pending permissions
    result = await db.execute(
        select(AgentPermission).where(
            AgentPermission.api_key_id == api_key.id,
            AgentPermission.status == PermissionStatus.PENDING,
        )
    )
    pending = result.scalars().all()
    for perm in pending:
        perm.status = PermissionStatus.GRANTED
        perm.granted_by = "YOLO_BYPASS"

    # Write audit log
    audit = AuditLog(
        api_key_id=api_key.id,
        action="YOLO_BYPASS",
        detail=f"Bypassed {len(pending)} pending permissions",
    )
    db.add(audit)
    await db.commit()

    return {"detail": f"Bypassed {len(pending)} permissions", "count": len(pending)}


# --- Credentials ---

@router.get("/credentials", response_model=list[CredentialResponse])
async def list_credentials(
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentCredential).where(AgentCredential.api_key_id == api_key.id)
    )
    creds = result.scalars().all()
    return [
        CredentialResponse(
            id=str(c.id), api_key_id=str(c.api_key_id), label=c.label,
            rotation_due_at=c.rotation_due_at, last_accessed_at=c.last_accessed_at,
            created_at=c.created_at,
        )
        for c in creds
    ]


@router.post("/credentials", response_model=CredentialResponse, status_code=201)
async def store_credential(
    body: CredentialCreate,
    api_key: ApiKey = Depends(get_api_key),
    db: AsyncSession = Depends(get_db),
):
    check_quota(api_key)
    cred = AgentCredential(
        api_key_id=api_key.id,
        label=body.label,
        encrypted_value=encrypt_value(body.value),
        rotation_due_at=body.rotation_due_at,
    )
    db.add(cred)
    await increment_quota(api_key, db)
    await db.commit()
    await db.refresh(cred)

    return CredentialResponse(
        id=str(cred.id), api_key_id=str(cred.api_key_id), label=cred.label,
        rotation_due_at=cred.rotation_due_at, last_accessed_at=cred.last_accessed_at,
        created_at=cred.created_at,
    )


def _perm_response(p: AgentPermission) -> PermissionResponse:
    return PermissionResponse(
        id=str(p.id), api_key_id=str(p.api_key_id),
        resource=p.resource, action=p.action, status=p.status,
        expires_at=p.expires_at, granted_by=p.granted_by,
        metadata_=p.metadata_, created_at=p.created_at,
    )
