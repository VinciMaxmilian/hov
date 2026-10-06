from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração via env/.env. Nenhum segredo no código."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    # Chave publicável: identifica o projeto nas chamadas ao PostgREST/Auth feitas COM o JWT do usuário.
    supabase_publishable_key: str
    # Origem(ns) do frontend permitidas no CORS, separadas por vírgula.
    cors_origins: str = "http://localhost:5173"
    # Tamanho máximo de um save (bytes de JSON).
    max_save_bytes: int = 512 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
