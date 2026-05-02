from __future__ import annotations

import asyncio

import httpx

import app_recommend
import main


def test_ocr_app_rejects_requests_without_internal_token_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("AI_INTERNAL_TOKEN", "test-internal-token")

    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post("/ai/sharing/check", json={"item_names": ["통조림 참치"]})

    response = asyncio.run(_request())

    assert response.status_code == 401
    assert response.json() == {
        "success": False,
        "code": "AI401",
        "result": "AI 서비스 인증이 필요합니다.",
    }


def test_ocr_app_accepts_internal_token_header_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("AI_INTERNAL_TOKEN", "test-internal-token")

    class _StubSharingFilter:
        def check(self, item_names):
            return {"allowed": [{"item_name": item_names[0]}], "blocked": [], "review_required": []}

    monkeypatch.setattr(main, "_get_sharing_filter", lambda: _StubSharingFilter())

    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/sharing/check",
                headers={"X-AI-Internal-Token": "test-internal-token"},
                json={"item_names": ["통조림 참치"]},
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    assert response.json()["success"] is True


def test_recommend_app_rejects_requests_without_internal_token_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("AI_INTERNAL_TOKEN", "test-internal-token")

    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {"ingredients": ["김치"], "IngredientRatio": 0.5},
                    "candidates": [],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 401
    assert response.json()["code"] == "AI401"


def test_recommend_app_accepts_bearer_internal_token_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("AI_INTERNAL_TOKEN", "test-internal-token")

    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                headers={"Authorization": "Bearer test-internal-token"},
                json={
                    "userIngredient": {"ingredients": ["김치"], "IngredientRatio": 0.5},
                    "candidates": [],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    assert response.json() == {"success": True, "data": {"recommendations": []}}
