from __future__ import annotations

import os
from fastapi import Request
from fastapi.responses import JSONResponse


PUBLIC_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json",
}


def get_cors_allowed_origins() -> list[str]:
    raw_origins = os.environ.get(
        "AI_CORS_ALLOW_ORIGINS",
        "http://localhost:8081,http://localhost:8082,https://mulmumu-frontend-aqjxa3obfa-du.a.run.app",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def _extract_token(request: Request) -> str:
    explicit_token = request.headers.get("x-ai-internal-token", "").strip()
    if explicit_token:
        return explicit_token

    authorization = request.headers.get("authorization", "").strip()
    bearer_prefix = "Bearer "
    if authorization.startswith(bearer_prefix):
        return authorization[len(bearer_prefix):].strip()
    return authorization


def internal_token_required_response(request: Request) -> JSONResponse | None:
    expected_token = os.environ.get("AI_INTERNAL_TOKEN", "").strip()
    if not expected_token:
        return None
    if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
        return None
    if _extract_token(request) == expected_token:
        return None

    return JSONResponse(
        status_code=401,
        content={
            "success": False,
            "code": "AI401",
            "result": "AI 서비스 인증이 필요합니다.",
        },
    )
