# Apps in Toss Non-game/TDS Audit

> Historical audit note: this document was written before the TDS WebView implementation was promoted to the repository root. The current submission target is the root app, not `apps-in-toss-miniapp/`. Use `docs/APPS_IN_TOSS_RUNTIME.md` and the root `package.json` scripts for current build instructions.

검증 일자: 2026-04-29

검증 대상: `Front-Repository` `application` 브랜치

## 기준 문서

- Apps in Toss 비게임 출시 가이드
- Apps in Toss 서비스 오픈 정책
- Apps in Toss React Native 개발 가이드
- TDS React Native 시작하기 및 컴포넌트 문서

## 결론

현재 제출 대상은 루트 Vite/TDS WebView 앱이다. Expo 원본은 `legacy-expo/`에 비교 기준으로만 남겼고, 루트 앱에서 Apps in Toss 로그인, 사용자 화면, 백엔드 API 계약, `.ait` 빌드 검증을 관리한다.

가장 큰 점검 기준은 운영 런타임과 데이터 흐름이다. 루트 앱이 Apps in Toss WebView 런타임이므로 빌드, 테스트, 백엔드 연동, 관리자/AI 서버 검증은 모두 루트 기준으로 수행한다.

## 검증 결과

| 항목 | 현재 상태 | 판정 | 근거/조치 |
| --- | --- | --- | --- |
| 비게임 서비스 성격 | 식재료 관리, OCR, 레시피 추천, 나눔 | 적합 가능 | 게임/사행성/금융/의료 서비스가 아님 |
| 카카오 로그인 제거 | 로그인 화면과 코드 참조 제거 | 통과 | `src`, `App.js`, `app.json` 기준 `kakao/카카오/OAuth` 참조 없음 |
| 외부 소셜 로그인 | 화면 내 소셜 로그인 없음 | 통과 | 앱인토스 정책상 토스 로그인 외 소셜 로그인 불가 |
| 토스 로그인 | 미니앱에서 버튼 클릭 시 `appLogin()` 호출 후 백엔드 교환 API 호출 | 부분 완료 | 프론트 계약 구현 완료. 백엔드 `POST /auth/toss/login`의 Toss OAuth 토큰 교환 구현/확정 필요 |
| Granite 기반 구조 | 루트 `granite.config.ts`, `src`, `index.html`, Vite 설정 사용 | 진행 중 | 루트가 제출 대상 |
| Apps in Toss SDK | 루트 package에 포함 | 진행 중 | 루트 런타임 기준 |
| TDS WebView/Mobile | 루트 화면에서 TDS Mobile 컴포넌트와 토큰으로 치환 중 | 진행 중 | 원본 Expo 세부 화면과 계속 비교 필요 |
| React 버전 | 루트 TDS WebView 의존성 기준 | 진행 중 | 루트 `package.json`/lock 기준 |
| TDS 버튼 형태 | 루트 제출 흐름에서 TDS 컴포넌트 우선 사용 | 진행 중 | 직접 구현 UI는 잔여 전환 후보 |
| TextField 형태 | 루트 일부 직접 구현 유지 | 보완 필요 | 입력 화면 전체 TDS 치환은 다음 단계 |
| 외부 링크/앱 설치 유도 | 코드상 `Linking.openURL`, 앱 설치 문구 없음 | 통과 | 주요 기능이 외부 링크에 의존하지 않음 |
| 앱 내 기능 완결성 | 로그인 이후 주요 화면은 존재, 일부 더미/API fallback 혼재 | 보완 필요 | 출시 기능 범위를 OCR/식재료/추천으로 좁히고 더미 의존 제거 필요 |
| AI 표시/고지 | 추천/OCR 결과 라벨 미흡 | 보완 필요 | 생성형 AI 활용 결과는 사용자가 인지할 수 있게 표시 필요 |
| 출시 산출물 | 썸네일/스크린샷 있음 | 부분 완료 | `apps-in-toss/thumbnail.png`, `screenshot-landscape.png` 존재 |
| 번들 생성 | Expo web export 성공 | Expo 기준 통과 | 앱인토스 `.ait` 번들 생성은 별도 필요 |
| 잔여 리소스 | `assets/kakao.png` 존재 | 정리 필요 | 코드에서 미사용이나 혼동 방지를 위해 삭제 권장 |

## 확인한 명령

```powershell
Get-ChildItem -Path src,App.js,app.json -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.json |
  Select-String -Pattern 'kakao|카카오|Kakao|oauth|OAuth' -CaseSensitive:$false
```

결과: 코드 참조 없음.

```powershell
npx expo export --platform web --output-dir .expo-policy-check
```

결과: web export 성공.

## 주요 리스크

### 1. 앱인토스 구조 혼선

루트 앱이 현재 제출 대상이므로 이전 분리 런타임 사본이 남아 있으면 빌드/테스트 대상 혼선이 생긴다.

조치:

- 루트 `package.json`, `src`, `scripts`, `docs/APPS_IN_TOSS_RUNTIME.md`를 기준 문서와 검증 대상으로 유지한다.
- stale migration copy는 실행 참조가 제거된 뒤 삭제한다.
- 기존 Expo 화면은 `legacy-expo/`와 원본 코드 비교로 기능 parity를 계속 확인한다.

### 2. TDS 전면 적용 미완료

TDS 문서상 비게임 미니앱은 TDS 기반 UI 일관성이 중요하다. 루트 WebView는 TDS Mobile 전환을 진행했지만 일부 직접 구현 컨트롤과 CSS 보정이 남아 있다.

조치:

- 루트 화면의 직접 Modal, native select/date, 직접 버튼 스타일을 TDS Mobile 컴포넌트 또는 동일 토큰으로 계속 치환한다.
- 브라우저와 Apps in Toss WebView 양쪽에서 spacing, overflow, touch target을 검증한다.

### 3. 토스 로그인 백엔드 교환 미확정

카카오 로그인 제거는 완료됐고 루트 WebView는 토스 로그인 `appLogin()`만 사용한다. 남은 작업은 백엔드가 `authorizationCode`, `referrer`를 받아 Apps in Toss OAuth API와 mTLS로 토큰을 교환하고, 서비스 세션/JWT를 내려주는 것이다.

조치:

- 클라이언트에서 `appLogin()`으로 `authorizationCode`, `referrer`를 받는다.
- 백엔드에서 인가 코드를 토큰으로 교환하고 자체 세션/JWT를 발급한다.
- 민감 토큰은 클라이언트에 장기 저장하지 않는다.

### 4. AI 결과 표시/고지 부족

서비스는 OCR, 소비기한 예측, 레시피 추천을 제공한다. 정책상 생성형 AI 결과를 사용자에게 노출하는 경우 AI 활용 사실을 인지할 수 있게 표시해야 한다.

조치:

- OCR 분석 결과 화면에 “AI 분석 결과이며 수정할 수 있어요” 안내를 표시한다.
- 추천 결과 화면에 “AI 추천” 또는 “추천 알고리즘 결과” 라벨을 표시한다.
- 첫 사용 시 AI 기능 고지 문구를 추가한다.

## 우선순위

1. 루트 WebView 빌드와 `.ait` 산출물 검증
2. 토스 로그인 백엔드 교환 확정
3. OCR, 냉장고, 추천, 나눔, 채팅 세부 화면을 Expo 원본 기준으로 계속 parity 검증
4. 루트 WebView와 백엔드/API/관리자/AI 계약 동기화
5. AI 고지/라벨 추가
6. 샌드박스 앱에서 실제 기기 테스트
7. `.ait` 번들 생성 및 콘솔 업로드 테스트

## 현재 가능한 제출 상태

현재 상태는 앱 소개 이미지, Expo 웹 번들, Granite/TDS 미니앱 흐름 관점에서는 확인 가능하다. WSL/Linux + Node 24 환경에서 `.ait` 빌드도 통과했다. 다만 백엔드 토스 로그인 교환 API 확정과 샌드박스 앱 검증 전에는 제출 완료 상태로 볼 수 없다.
