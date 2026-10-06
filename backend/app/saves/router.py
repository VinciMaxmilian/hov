import json

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth.deps import CurrentUser, current_user
from app.config import Settings, get_settings
from app.models.save import SaveData, SaveRequest, SaveResult
from app.services.supabase_rest import rpc

router = APIRouter(prefix="/saves", tags=["saves"])


async def _check_size(request: Request, settings: Settings = Depends(get_settings)) -> None:
    length = request.headers.get("content-length")
    if length and int(length) > settings.max_save_bytes + 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="save too large")


@router.post("/validate", dependencies=[Depends(_check_size)])
async def validate(data: SaveData, _user: CurrentUser = Depends(current_user)) -> dict[str, bool]:
    """Valida um save sem gravar (útil para ferramentas e testes)."""
    return {"valid": True}


@router.put("/{slot}", response_model=SaveResult, dependencies=[Depends(_check_size)])
async def put_save(
    slot: int,
    body: SaveRequest,
    user: CurrentUser = Depends(current_user),
    settings: Settings = Depends(get_settings),
) -> SaveResult:
    """Valida o payload e grava via função save_game (compare-and-swap em rev, RLS do usuário)."""
    if body.data.meta.slot != slot:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="slot mismatch")
    raw = body.data.model_dump(mode="json")
    if len(json.dumps(raw)) > settings.max_save_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="save too large")
    rows = await rpc(
        "save_game",
        {
            "p_slot": slot,
            "p_schema_version": body.data.schemaVersion,
            "p_data": raw,
            "p_area_label": body.data.meta.areaLabel[:64],
            "p_progress_pct": body.data.meta.progressPct,
            "p_playtime_sec": int(body.data.meta.playtimeSec),
            "p_base_rev": body.base_rev,
        },
        user,
        settings,
    )
    row = rows[0] if isinstance(rows, list) and rows else rows
    if not isinstance(row, dict):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="unexpected save_game response")
    return SaveResult(rev=int(row["rev"]), conflict=bool(row["conflict"]))
