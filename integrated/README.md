# 물무물무 통합 스냅샷

이 폴더는 앱인토스 제출과 팀 공유를 위해 프론트엔드, 백엔드, AI 서버의 현재 통합 상태를 한 레포 안에 묶은 스냅샷입니다.

## 구성

- `frontend-application/`: 사용자 앱 프론트엔드. 앱인토스 WebView 흐름, Cloud Run 배포 설정, 카카오 지도, 배너 광고 연결 포함.
- `backend-main/`: Spring 백엔드. 사용자, 식재료, 나눔, 채팅, 관리자, AI 연동 계약 기준 소스.
- `ai-service/`: OCR, 소비기한 예측, 레시피 추천 AI 서비스. OCR/추천 컨테이너 분리와 API 계약 기준 소스.

## 제외한 항목

- Git 메타데이터: `.git`
- 의존성/빌드 산출물: `node_modules`, `build`, `dist`, `.expo`, `.gradle`, `.granite`
- 로컬/민감 설정: `.env`, `.env.local`, `.env.*.local`
- 실행 로그와 캐시: `*.log`, `tmp`, `__pycache__`, `.pytest_cache`

## 운영 기준

이 스냅샷은 통합 제출 및 검토용입니다. 각 서비스의 실제 배포, 이슈 추적, 세부 개발 이력은 기존 원본 레포의 브랜치 정책을 따르는 것이 안전합니다.
