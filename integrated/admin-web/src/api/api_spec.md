# 물무물무 관리자 프론트 API 연결 기준

관리자 프론트는 백엔드 `Back-Repository-main`의 기존 `/admin/*` 공개 계약만 호출한다.

## 공통

- Base URL: `VITE_API_BASE_URL`
- 로컬 개발 기본값: `http://localhost:8080`
- 인증 헤더: `Authorization: Bearer {admin_token}`
- 응답 envelope: `{ "success": boolean, "code"?: string, "result": any }`

## 인증

- `POST /admin/auth/login`
- Request: `{ "email": "mulmuAdmin", "password": "1234" }`
- Response result: `{ "jwt": "..." }`

## 대시보드

- `GET /admin/dashboard/user`
- `GET /admin/dashboard/today/report`
- `GET /admin/dashboard/today/share`

## 신고 관리

- `GET /admin/report/list?Date=yyyy-MM-dd&type=all|completed|notCompleted`
- `GET /admin/report/one?reportId={uuid}`
- `PATCH /admin/report/post/masking?shareId={uuid}`
- `PATCH /admin/report/users`
- `GET /admin/shares/one?shareId={uuid}`

## 사용자 관리

- `GET /admin/users/list?userId=all`
- `GET /admin/users/shares/list?userId={userId}`

## OCR 검수

- `GET /admin/ocr/list`
- `GET /admin/ocr/one?ocrId={uuid}`
- `GET /admin/ocr/one/ingredients?ocrId={uuid}`
- `POST /admin/ocr/accuracy`
- `PATCH /admin/ocr/ingredients`

`PATCH /admin/ocr/ingredients`는 관리자 검수 화면에서 OCR 정확도와 품목명/수량을 함께 수정한다.

```json
{
  "ocrId": "uuid",
  "accuracy": 96.5,
  "items": [
    {
      "ocrIngredientId": "uuid",
      "itemName": "우유",
      "quantity": 1
    }
  ]
}
```

## 데이터 통계

- `GET /admin/data/statistics?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd`
