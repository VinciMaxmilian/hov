import copy

import pytest
from fastapi.testclient import TestClient

from app.auth.deps import CurrentUser, current_user
from app.main import app
from app.saves import router as saves_module

SAVE = {
    "schemaVersion": 1,
    "meta": {
        "slot": 1,
        "areaLabel": "West Library",
        "progressPct": 31.0,
        "playtimeSec": 812,
        "updatedAt": "2026-10-06T18:00:00.000Z",
        "contentVersion": "slice-0.1",
    },
    "settings": {"mouseSensitivity": 1, "invertY": False, "masterVolume": 0.8, "subtitles": True},
    "player": {"area": "library", "position": [-9.5, 0, -8.2], "yaw": 1.2, "pitch": 0},
    "inventory": ["entry_key", "oil_lamp"],
    "world": {"main_door": "closed", "library_bookcase": "closed"},
    "puzzles": {"library_clock": {"status": "unsolved", "values": {"hour": 10, "minute": 8}, "attempts": 1}},
    "documents": ["doc_arthur_letter"],
    "flags": {"arrived": True, "visited:library": True},
    "journal": ["j_will"],
    "clock": {"day": 1, "minutes": 1203.5},
    "playtimeSec": 812,
}


@pytest.fixture
def client():
    app.dependency_overrides[current_user] = lambda: CurrentUser(id="u1", email="a@b.c", token="t")
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health():
    assert TestClient(app).get("/health").json() == {"status": "ok"}


def test_requires_bearer_token():
    res = TestClient(app).post("/saves/validate", json=SAVE)
    assert res.status_code == 401


def test_validate_accepts_valid_save(client):
    assert client.post("/saves/validate", json=SAVE).json() == {"valid": True}


@pytest.mark.parametrize(
    "mutate",
    [
        lambda s: s.update(schemaVersion=99),
        lambda s: s["inventory"].append("entry_key"),
        lambda s: s["player"].update(position=[1e9, 0, 0]),
        lambda s: s.update(hacked=True),
        lambda s: s["meta"].update(slot=7),
    ],
)
def test_validate_rejects_bad_saves(client, mutate):
    bad = copy.deepcopy(SAVE)
    mutate(bad)
    assert client.post("/saves/validate", json=bad).status_code == 422


def test_put_save_calls_rpc_with_user_token(client, monkeypatch):
    calls = {}

    async def fake_rpc(name, params, user, settings):
        calls.update(name=name, params=params, user=user)
        return [{"rev": 3, "conflict": False, "updated_at": "now"}]

    monkeypatch.setattr(saves_module, "rpc", fake_rpc)
    res = client.put("/saves/1", json={"base_rev": 2, "data": SAVE})
    assert res.status_code == 200
    assert res.json() == {"rev": 3, "conflict": False}
    assert calls["name"] == "save_game"
    assert calls["params"]["p_base_rev"] == 2
    assert "user_id" not in calls["params"]  # identidade vem do JWT, nunca do payload


def test_put_save_rejects_slot_mismatch(client):
    assert client.put("/saves/2", json={"base_rev": 0, "data": SAVE}).status_code == 422
