from fastapi import APIRouter, Depends

from app.auth.deps import CurrentUser, current_user
from app.config import Settings, get_settings
from app.models.save import EventRequest
from app.services.supabase_rest import insert

router = APIRouter()


@router.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me", tags=["auth"])
async def me(user: CurrentUser = Depends(current_user)) -> dict[str, str | None]:
    return {"id": user.id, "email": user.email}


@router.post("/events", status_code=204, tags=["analytics"])
async def track(body: EventRequest, user: CurrentUser = Depends(current_user), settings: Settings = Depends(get_settings)) -> None:
    """Analytics mínimo. user_id é preenchido pelo banco (auth.uid()), nunca pelo cliente."""
    await insert("game_events", {"event": body.event, "payload": body.payload}, user, settings)
