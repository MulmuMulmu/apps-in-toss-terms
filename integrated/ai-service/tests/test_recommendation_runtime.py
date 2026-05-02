from __future__ import annotations

import asyncio

import httpx

import app_recommend


def test_recommondation_returns_empty_when_ratio_not_met() -> None:
    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {
                        "ingredients": ["김치"],
                        "IngredientRatio": 0.75,
                    },
                    "candidates": [
                        {
                            "recipe_id": "recipe-kimchi-rice",
                            "title": "김치볶음밥",
                            "ingredients": ["김치", "밥", "양파", "스팸"],
                        }
                    ],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    assert response.json()["data"]["recommendations"] == []


def test_recommondation_excludes_dispreferred_candidates() -> None:
    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {
                        "ingredients": ["김치", "오이"],
                        "dispreferIngredients": ["오이"],
                        "IngredientRatio": 0.5,
                    },
                    "candidates": [
                        {
                            "recipe_id": "recipe-cucumber",
                            "title": "오이 김치무침",
                            "ingredients": ["김치", "오이"],
                        }
                    ],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    assert response.json()["data"]["recommendations"] == []


def test_recommondation_preference_boost_affects_order() -> None:
    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {
                        "ingredients": ["김치", "양파"],
                        "preferIngredients": ["소고기"],
                        "IngredientRatio": 0.5,
                    },
                    "candidates": [
                        {
                            "recipe_id": "recipe-beef",
                            "title": "소고기 김치볶음",
                            "ingredients": ["김치", "양파", "소고기", "대파"],
                        },
                        {
                            "recipe_id": "recipe-spam",
                            "title": "스팸 김치볶음",
                            "ingredients": ["김치", "양파", "스팸", "대파"],
                        },
                    ],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    recommendations = response.json()["data"]["recommendations"]
    assert [item["recipeId"] for item in recommendations] == ["recipe-beef", "recipe-spam"]


def test_recommondation_matches_canonical_ingredient_aliases() -> None:
    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {
                        "ingredients": ["마늘"],
                        "IngredientRatio": 0.5,
                    },
                    "candidates": [
                        {
                            "recipe_id": "recipe-garlic",
                            "title": "마늘 양념",
                            "ingredients": ["다진마늘", "간장"],
                        }
                    ],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    recommendations = response.json()["data"]["recommendations"]
    assert recommendations[0]["recipeId"] == "recipe-garlic"
    assert recommendations[0]["match_details"]["matched"] == ["다진마늘"]


def test_recommondation_score_is_at_least_coverage_ratio() -> None:
    async def _request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app_recommend.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post(
                "/ai/ingredient/recommondation",
                json={
                    "userIngredient": {
                        "ingredients": ["오징어", "대파"],
                        "IngredientRatio": 0.5,
                    },
                    "candidates": [
                        {
                            "recipe_id": "recipe-squid",
                            "title": "오징어 산적",
                            "ingredients": ["오징어", "대파", "마늘", "간장"],
                        }
                    ],
                },
            )

    response = asyncio.run(_request())

    assert response.status_code == 200
    recommendations = response.json()["data"]["recommendations"]
    assert recommendations[0]["score"] >= 0.5
