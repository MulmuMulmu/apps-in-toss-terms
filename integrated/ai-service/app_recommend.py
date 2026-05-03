from __future__ import annotations

import math
from typing import Any, List

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

from canonical_ingredients import canonicalize_ingredient_name
from internal_auth import get_cors_allowed_origins, internal_token_required_response


MAX_USER_INGREDIENTS = 200
MAX_RECOMMENDATION_CANDIDATES = 500
MAX_RECIPE_INGREDIENTS = 100
MAX_INGREDIENT_NAME_LENGTH = 120
MAX_RECIPE_TITLE_LENGTH = 200


class BackendUserIngredient(BaseModel):
    ingredients: List[str] = Field(default_factory=list, max_length=MAX_USER_INGREDIENTS)
    allergies: List[str] = Field(default_factory=list, max_length=MAX_USER_INGREDIENTS)
    preferIngredients: List[str] = Field(default_factory=list, max_length=MAX_USER_INGREDIENTS)
    dispreferIngredients: List[str] = Field(default_factory=list, max_length=MAX_USER_INGREDIENTS)
    IngredientRatio: float = Field(default=0.5, ge=0.0, le=1.0)

    @field_validator("ingredients", "allergies", "preferIngredients", "dispreferIngredients", mode="before")
    @classmethod
    def default_none_list(cls, value):
        return [] if value is None else value


class BackendCandidateRecipe(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    recipe_id: str = Field(validation_alias=AliasChoices("recipe_id", "recipeId"))
    title: str = Field(max_length=MAX_RECIPE_TITLE_LENGTH)
    ingredients: List[str] = Field(default_factory=list, max_length=MAX_RECIPE_INGREDIENTS)


class BackendRecommendationRequest(BaseModel):
    userIngredient: BackendUserIngredient
    candidates: List[BackendCandidateRecipe] = Field(max_length=MAX_RECOMMENDATION_CANDIDATES)


app = FastAPI(
    title="추천 AI API",
    version="1.0.0",
    description="벡터 기반 레시피 추천 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def recommendation_validation_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": "AI500",
            "result": "레시피를 추천할 수 없습니다.",
        },
    )


@app.middleware("http")
async def require_internal_token_when_configured(request, call_next):
    unauthorized_response = internal_token_required_response(request)
    if unauthorized_response is not None:
        return unauthorized_response
    return await call_next(request)


def _normalize_name(value: str) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def _canonical_key(value: str) -> str:
    canonical_name = canonicalize_ingredient_name(str(value or ""))
    return _normalize_name(canonical_name or value)


def _ingredient_match_terms(value: str) -> set[str]:
    raw_name = _normalize_name(value)
    canonical_name = _canonical_key(value)
    return {term for term in {raw_name, canonical_name} if term}


def _dedupe_names(values: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = str(value or "").strip()
        key = _normalize_name(cleaned)
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(cleaned)
    return deduped


def _contains_any_preference(texts: list[str], preferences: set[str]) -> bool:
    normalized_texts = [
        term
        for text in texts
        for term in _ingredient_match_terms(text)
    ]
    return any(
        preference and any(preference in text or text in preference for text in normalized_texts)
        for preference in preferences
    )


def _recommend_backend_candidates(payload: dict) -> dict:
    request = BackendRecommendationRequest(**payload)
    owned = set(_canonical_key(name) for name in request.userIngredient.ingredients if _canonical_key(name))
    preferred = set(
        _canonical_key(name)
        for name in request.userIngredient.preferIngredients
        if _canonical_key(name)
    )
    disliked = set(
        _canonical_key(name)
        for name in request.userIngredient.dispreferIngredients
        if _canonical_key(name)
    )
    allergies = set(
        _canonical_key(name)
        for name in request.userIngredient.allergies
        if _canonical_key(name)
    )
    hard_excluded = disliked | allergies
    min_ratio = request.userIngredient.IngredientRatio

    recommendations: list[dict[str, Any]] = []
    for candidate in request.candidates:
        recipe_ingredients = _dedupe_names(candidate.ingredients)
        if not recipe_ingredients:
            continue

        recipe_keys = [_canonical_key(name) for name in recipe_ingredients]
        recipe_key_set = set(recipe_keys)
        if (
            recipe_key_set & hard_excluded
            or _contains_any_preference([candidate.title], hard_excluded)
            or _contains_any_preference(recipe_ingredients, hard_excluded)
        ):
            continue

        matched = [
            ingredient
            for ingredient, key in zip(recipe_ingredients, recipe_keys)
            if key in owned
        ]
        missing = [
            ingredient
            for ingredient, key in zip(recipe_ingredients, recipe_keys)
            if key not in owned
        ]
        coverage_ratio = len(matched) / len(recipe_ingredients)
        if coverage_ratio < min_ratio:
            continue

        cosine_score = len(set(recipe_keys) & owned) / math.sqrt(
            max(len(owned), 1) * max(len(recipe_key_set), 1)
        )
        preference_bonus = 0.0
        if preferred:
            preference_hits = len(recipe_key_set & preferred)
            preference_bonus = 0.08 * (preference_hits / len(preferred))
        weighted_score = (0.75 * coverage_ratio) + (0.17 * cosine_score) + preference_bonus
        score = min(1.0, max(coverage_ratio, weighted_score))

        recommendations.append(
            {
                "recipeId": candidate.recipe_id,
                "title": candidate.title,
                "score": round(score, 4),
                "match_details": {
                    "matched": matched,
                    "missing": missing,
                },
            }
        )

    recommendations.sort(
        key=lambda item: (
            item["score"],
            len(item["match_details"]["matched"]),
            item["recipeId"],
        ),
        reverse=True,
    )
    return {"recommendations": recommendations}


@app.post("/ai/ingredient/recommondation")
async def recommend_backend_candidates(req: BackendRecommendationRequest):
    try:
        result = _recommend_backend_candidates(req.model_dump())
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "code": "AI500",
                "result": "레시피를 추천할 수 없습니다.",
            },
        )

    return {"success": True, "data": result}
