# Back Repository Index

이 문서는 백엔드 `main` 브랜치 기준 코드 구조와 AI 통합 지점을 빠르게 확인하기 위한 인덱스다.

## 실행

- 로컬 테스트: `.\gradlew.bat test`
- 로컬 실행: `.\gradlew.bat bootRun`
- Docker 실행: `docker compose up --build`

## 주요 환경변수

- `DB_URL`, `DB_USER`, `DB_PASSWORD`: MySQL 연결
- `JWT_SECRET`: JWT 서명 키
- `KAKAO_API_KEY`: 카카오 API 키
- `AI_OCR_BASE_URL`: OCR/Qwen AI 컨테이너 주소, 기본값 `http://localhost:8000`
- `AI_RECOMMEND_BASE_URL`: 추천 AI 컨테이너 주소, 기본값 `http://localhost:8002`
- `APPS_IN_TOSS_CLIENT_ID`, `APPS_IN_TOSS_CLIENT_SECRET`, `APPS_IN_TOSS_REDIRECT_URI`: 앱인토스/토스 로그인 서버 교환용 설정
- `APPS_IN_TOSS_MTLS_ENABLED`, `APPS_IN_TOSS_MTLS_CERT_PATH`, `APPS_IN_TOSS_MTLS_KEY_PATH`: 토스 서버 API가 mTLS를 요구할 때만 설정한다. 인증서/키 파일은 레포에 커밋하지 않는다.

## 도메인 구조

- `domain/auth`: 회원가입, 로그인, 로그아웃, 비밀번호 변경, JWT 발급
- `domain/user/client`: 앱인토스 `appLogin` authorizationCode를 토스 AccessToken/userKey로 교환하는 서버사이드 클라이언트
- `domain/ingredient`: 식재료 검색, 수동 입력, 내 식재료 조회, 알레르기/선호/비선호 설정
- `domain/ocr`: 백엔드 공개 OCR endpoint. 프론트 multipart 이미지를 받고 AI OCR 컨테이너로 위임
- `domain/recipe`: 백엔드 공개 추천 endpoint. 프론트/백엔드가 구성한 추천 요청을 AI 추천 컨테이너로 위임
- `domain/ai`: AI 컨테이너 호출 client, DTO, 설정
- `global/apiPayload`: 공통 응답 envelope `ApiResponse { success, code, result }`
- `global/jwt`, `global/security`: 인증/인가 설정

## 현재 AI 연동 지점

- `POST /ingredient/analyze`
  - 프론트가 영수증 이미지를 multipart `image`로 전송한다.
  - 백엔드는 내부적으로 `AI_OCR_BASE_URL + /ai/ocr/analyze`를 호출한다.
  - 성공 시 OCR 결과를 `ApiResponse.onSuccess(result)`로 감싼다.
  - AI 실패 시 `success:false`, `code:AI500`으로 응답한다.

- `POST /recipe/recommendations`
  - 추천 요청 body는 AI 추천 API 계약을 그대로 받는다.
  - 백엔드는 내부적으로 `AI_RECOMMEND_BASE_URL + /ai/ingredient/recommondation`를 호출한다.
  - 성공 시 추천 결과를 `ApiResponse.onSuccess(result)`로 감싼다.
  - AI 실패 시 `success:false`, `code:AI500`으로 응답한다.

## 통합테스트 기준

공통 로컬 통합테스트 계획은 AI 레포의 `docs/integration/LOCAL_INTEGRATION_TEST_PLAN.md`를 기준으로 한다.

백엔드는 AI 컨테이너를 직접 구현하지 않고 adapter 역할만 한다. 프론트는 AI 컨테이너를 직접 호출하지 않고 백엔드 공개 API만 호출한다.

## 앱인토스 로그인 연동

- 프론트는 앱인토스 SDK의 `appLogin`으로 `authorizationCode`와 `referrer`만 받는다.
- 백엔드 `POST /auth/toss/login`이 토스 토큰 API와 사용자 정보 API를 호출해 `userKey`를 확보한다.
- 백엔드는 `userKey`를 `User.tossUserKey`로 저장하고 내부 `userId=toss_{userKey}` 계정을 만든 뒤 기존 JWT를 발급한다.
- 이름, 전화번호, 이메일 등 암호화된 개인정보는 현재 저장하지 않는다. 필요한 경우 별도 scope, 복호화 키, 보관 정책을 합의한 뒤 확장한다.
- 앱인토스 연결 끊기 콜백은 백엔드 운영 도메인이 확정된 뒤 별도 구현/등록한다.
