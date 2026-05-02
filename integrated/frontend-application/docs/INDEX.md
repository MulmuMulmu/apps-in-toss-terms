# Front Application Index

이 문서는 사용자 앱 `application` 브랜치 기준 화면 구조와 백엔드 API 연결 지점을 정리한 인덱스다.

## 실행

- 의존성 설치: `npm install`
- 웹 실행: `npx expo start --web --localhost --port 8082`
- API 주소 변경: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 npx expo start --web --localhost --port 8082`
- 앱인토스 로그인 없이 로컬 관리자 계정으로 자동 진입: `EXPO_PUBLIC_DEV_BYPASS_APPINTOSS_LOGIN=1 npx expo start --web --localhost --port 8082`
- 로컬 자동 진입 기본 계정: `mulmuAdmin / 1234`. 필요하면 `EXPO_PUBLIC_DEV_LOGIN_ID`, `EXPO_PUBLIC_DEV_LOGIN_PASSWORD`로 덮어쓴다.

## 공통 API 구조

- `src/api/config.js`: 백엔드 base URL. 기본값은 `https://sokksik.click`
- `src/api/request.js`: 공통 fetch wrapper. JWT가 있으면 `Authorization` 헤더를 붙인다.
- `src/api/auth.js`: 기존 백엔드 로그인 API와 Apps in Toss 인가코드 교환 API
- `src/services/appInTossAuth.js`: 앱인토스 첫 진입 `appLogin` 브릿지 호출 래퍼
- `src/api/ingredients.js`: 내 식재료 조회, 식재료 저장, 영수증 분석
- `src/api/recipes.js`: 레시피 추천 요청

## 화면과 API 연결 상태

- 앱 첫 진입: `appLogin` 인가코드 요청 후 `POST /auth/toss/login` 호출. 기존 ID/PW 로그인 화면은 기본 플로우에서 제외
- 로그인/회원가입: 레거시 화면 파일은 남아 있으나 기본 네비게이션에 등록하지 않음
- 내 식자재 화면: `GET /ingredient/all/my` 호출 후 실패 시 더미 데이터를 유지
- 직접 입력 화면: `POST /ingredient/input` 호출
- 영수증 촬영/갤러리: 이미지 선택 후 `POST /ingredient/analyze` 호출, 첫 번째 OCR 품목을 직접 입력 화면에 채움
- 레시피 추천 재료 선택: `GET /ingredient/all/my` 호출 후 실패 시 더미 데이터를 유지
- 레시피 추천 결과: `POST /recipe/recommendations` 호출 후 실패 시 더미 결과를 유지
- 나눔/채팅: 이번 1차 통합테스트 필수 경로에서 제외

## 네비게이션 구조

- `App.js`: Splash(Apps in Toss login bootstrap) -> Allergy/Prefer/Dislike 또는 Main
- `src/navigation/MainNavigator.js`: 내 식자재, 나눔, 레시피, 채팅, 내 정보 탭
- `src/navigation/FridgeNavigator.js`: Fridge, ReceiptCamera, ReceiptGallery, ReceiptLoading, DirectInput
- `src/navigation/RecipeNavigator.js`: RecipeMain, RecipeRecommend, RecipeResult, RecipeDetail
- `src/navigation/MarketNavigator.js`: 나눔 목록, 위치 설정, 글쓰기, 상세
- `src/navigation/ChatNavigator.js`: 채팅 목록, 채팅방

## Apps in Toss 산출물

- `apps-in-toss/thumbnail.png`: 앱 등록 썸네일, `1932x828`
- `apps-in-toss/screenshot-landscape.png`: 앱 등록 가로 스크린샷, `1504x741`
- `apps-in-toss/captures/`: Playwright 기반 사용자 앱 캡처 원본

## 통합테스트 기준

공통 로컬 통합테스트 계획은 AI 레포의 `docs/integration/LOCAL_INTEGRATION_TEST_PLAN.md`를 기준으로 한다.

프론트는 AI 컨테이너를 직접 호출하지 않는다. 모든 OCR/추천 요청은 백엔드 공개 API를 통해 전달한다.
