"""Espelho do schema de save do frontend (frontend/src/game/state/saveSchema.ts).

Validação defensiva: tipos, limites e coerência básica. Mantenha em sincronia ao mudar SAVE_SCHEMA_VERSION.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

SUPPORTED_SCHEMA_VERSIONS = {1}

Id = Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_:\-]+$")]
FlagValue = bool | int | float | Annotated[str, Field(max_length=256)]
Vec3 = tuple[float, float, float]


class Player(BaseModel):
    area: Id
    position: Vec3
    yaw: float
    pitch: float = 0

    @field_validator("position")
    @classmethod
    def in_world(cls, v: Vec3) -> Vec3:
        if any(abs(c) > 10_000 for c in v):
            raise ValueError("position out of world bounds")
        return v


class PuzzleState(BaseModel):
    status: Literal["unsolved", "solved"]
    values: dict[Id, int | float | Annotated[str, Field(max_length=64)]] = {}
    attempts: int = Field(default=0, ge=0)


class Clock(BaseModel):
    day: int = Field(ge=1, le=30)
    minutes: float = Field(ge=0, le=1440)


class Meta(BaseModel):
    slot: int = Field(ge=1, le=3)
    areaLabel: str = Field(max_length=64)
    progressPct: float = Field(ge=0, le=100)
    playtimeSec: float = Field(ge=0)
    updatedAt: str = Field(max_length=40)
    contentVersion: str = Field(max_length=32)


class Settings(BaseModel):
    mouseSensitivity: float = Field(ge=0.1, le=5)
    invertY: bool
    masterVolume: float = Field(ge=0, le=1)
    subtitles: bool


class SaveData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schemaVersion: int
    meta: Meta
    settings: Settings
    player: Player
    inventory: list[Id] = Field(max_length=200)
    world: dict[Id, Annotated[str, Field(max_length=32)]] = Field(max_length=2000)
    puzzles: dict[Id, PuzzleState] = Field(max_length=500)
    documents: list[Id] = Field(max_length=1000)
    flags: dict[Id, FlagValue] = Field(max_length=5000)
    journal: list[Id] = Field(max_length=1000)
    clock: Clock
    playtimeSec: float = Field(ge=0)

    @field_validator("schemaVersion")
    @classmethod
    def supported(cls, v: int) -> int:
        if v not in SUPPORTED_SCHEMA_VERSIONS:
            raise ValueError(f"unsupported schemaVersion {v}")
        return v

    @field_validator("inventory", "documents", "journal")
    @classmethod
    def unique(cls, v: list[str]) -> list[str]:
        if len(set(v)) != len(v):
            raise ValueError("duplicate ids")
        return v


class SaveRequest(BaseModel):
    base_rev: int = Field(ge=0)
    data: SaveData


class SaveResult(BaseModel):
    rev: int
    conflict: bool


class EventRequest(BaseModel):
    event: Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[a-z0-9_]+$")]
    payload: dict[str, bool | int | float | str | None] = Field(default_factory=dict, max_length=32)
