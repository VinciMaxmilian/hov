"""Autenticação: valida o JWT do Supabase enviado pelo frontend.

Estratégia:
1. Tokens assinados com chaves assimétricas (ES256/RS256) são verificados localmente via JWKS do projeto.
2. Tokens legados (HS256) são confirmados chamando GET /auth/v1/user no Supabase.

O user_id NUNCA vem do corpo da requisição: só do token validado.
"""

from dataclasses import dataclass

import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings

_jwks_clients: dict[str, jwt.PyJWKClient] = {}


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    token: str


def _jwks_client(settings: Settings) -> jwt.PyJWKClient:
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    if url not in _jwks_clients:
        _jwks_clients[url] = jwt.PyJWKClient(url, cache_keys=True, lifespan=3600)
    return _jwks_clients[url]


def _unauthorized(detail: str = "invalid token") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": "Bearer"})


async def _verify_remote(token: str, settings: Settings) -> CurrentUser:
    async with httpx.AsyncClient(timeout=8) as client:
        res = await client.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_publishable_key},
        )
    if res.status_code != 200:
        raise _unauthorized()
    body = res.json()
    return CurrentUser(id=body["id"], email=body.get("email"), token=token)


async def current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorized("missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise _unauthorized() from exc

    if header.get("alg") in {"ES256", "RS256", "EdDSA"}:
        try:
            key = _jwks_client(settings).get_signing_key_from_jwt(token)
            claims = jwt.decode(token, key.key, algorithms=[header["alg"]], audience="authenticated")
        except jwt.PyJWTError as exc:
            raise _unauthorized() from exc
        return CurrentUser(id=claims["sub"], email=claims.get("email"), token=token)

    return await _verify_remote(token, settings)
