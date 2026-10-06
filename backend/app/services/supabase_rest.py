"""Chamadas ao PostgREST do Supabase COM o JWT do usuário: a RLS continua valendo.

Não há service_role aqui: o backend não precisa de privilégios acima dos do próprio jogador.
"""

from typing import Any

import httpx
from fastapi import HTTPException, status

from app.auth.deps import CurrentUser
from app.config import Settings


def _headers(user: CurrentUser, settings: Settings) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {user.token}",
        "apikey": settings.supabase_publishable_key,
        "Content-Type": "application/json",
    }


async def rpc(name: str, params: dict[str, Any], user: CurrentUser, settings: Settings) -> Any:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/{name}"
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(url, json=params, headers=_headers(user, settings))
    if res.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"supabase rpc {name} failed ({res.status_code})")
    return res.json()


async def insert(table: str, row: dict[str, Any], user: CurrentUser, settings: Settings) -> None:
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(url, json=row, headers={**_headers(user, settings), "Prefer": "return=minimal"})
    if res.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"supabase insert {table} failed ({res.status_code})")
