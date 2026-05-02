# Apps in Toss Non-game/TDS Audit

검증 일자: 2026-04-29

검증 대상: `Front-Repository` `application` 브랜치

## 기준 문서

- Apps in Toss 비게임 출시 가이드
- Apps in Toss 서비스 오픈 정책
- Apps in Toss React Native 개발 가이드
- TDS React Native 시작하기 및 컴포넌트 문서

## 결론

현재 앱은 Expo Web 번들은 생성되고, 별도 `apps-in-toss-miniapp/`에 Granite/TDS 기반 미니앱 골격을 추가했다. 다만 앱인토스 비게임 React Native 미니앱으로 바로 제출하려면 토스 로그인, 전체 화면 이식, `.ait` 빌드 및 샌드박스 검증이 남아 있다.

가장 큰 차이는 운영 런타임이다. 루트 앱은 여전히 Expo 기반이고, 앱인토스 제출 후보는 `apps-in-toss-miniapp/`에 분리했다. 이 구조는 기존 앱을 깨지 않고 Granite/TDS 검증을 시작하기 위한 중간 단계다.

## 검증 결과

| 항목 | 현재 상태 | 판정 | 근거/조치 |
| --- | --- | --- | --- |
| 비게임 서비스 성격 | 식재료 관리, OCR, 레시피 추천, 나눔 | 적합 가능 | 게임/사행성/금융/의료 서비스가 아님 |
| 카카오 로그인 제거 | 로그인 화면과 코드 참조 제거 | 통과 | `src`, `App.js`, `app.json` 기준 `kakao/카카오/OAuth` 참조 없음 |
| 외부 소셜 로그인 | 화면 내 소셜 로그인 없음 | 통과 | 앱인토스 정책상 토스 로그인 외 소셜 로그인 불가 |
| 토스 로그인 | 미니앱에서 버튼 클릭 시 `appLogin()` 호출 후 백엔드 교환 API 호출 | 부분 완료 | 프론트 계약 구현 완료. 백엔드 `POST /auth/toss/login`의 Toss OAuth 토큰 교환 구현/확정 필요 |
| Granite 기반 구조 | `apps-in-toss-miniapp/` 골격 추가 | 부분 완료 | `granite.config.ts`, `src/_app.tsx`, `require.context.ts`, `pages/index.tsx` 추가 |
| Apps in Toss SDK | 미니앱 package에 추가 | 부분 완료 | 루트 Expo 앱이 아니라 분리 런타임 기준 |
| TDS React Native | 미니앱 package와 `TDSProvider` 추가 | 부분 완료 | 전체 Expo 화면 치환은 아직 아님 |
| React 버전 | 루트 Expo React 19.1.0, 미니앱 React 18.2.0 | 부분 완료 | TDS 호환성 때문에 미니앱 런타임을 분리 |
| TDS 버튼 형태 | 미니앱 제출 흐름은 TDS `Button`, 루트 일부는 RN primitive | 부분 적합 | 제출 대상은 `apps-in-toss-miniapp` 기준으로 유지 |
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

### 1. 앱인토스 구조 미준수

루트 Expo 프로젝트는 앱인토스 RN 미니앱 표준 구조가 아니다. 대신 `apps-in-toss-miniapp/`에 Granite 기반 제출 후보 런타임을 분리했다.

조치:

- `apps-in-toss-miniapp/`에서 Granite 빌드와 샌드박스 검증을 먼저 통과시킨다.
- 이후 기존 Expo 화면 중 OCR, 냉장고, 추천 흐름을 Granite/TDS 화면으로 단계적으로 이식한다.

### 2. TDS 전면 적용 미완료

TDS 문서상 비게임 RN 미니앱은 TDS 사용이 검수 기준에 포함된다. 현재 미니앱 골격은 `TDSProvider`와 `Button`을 사용하지만, 전체 사용자 흐름은 아직 루트 Expo 화면에 남아 있다.

조치:

- 제출 대상이 될 Granite 화면에 `@toss/tds-react-native` 컴포넌트를 우선 적용한다.
- 로그인/회원가입/식재료/추천 화면의 `TouchableOpacity`, `TextInput`, 직접 Modal은 TDS `Button`, `TextField`, `Dialog` 계열로 단계적 치환한다.

### 3. 토스 로그인 백엔드 교환 미확정

카카오 로그인 제거는 완료됐고 미니앱은 토스 로그인 `appLogin()`만 사용한다. 남은 작업은 백엔드가 `authorizationCode`, `referrer`를 받아 Apps in Toss OAuth API와 mTLS로 토큰을 교환하고, 서비스 세션/JWT를 내려주는 것이다.

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

1. `apps-in-toss-miniapp/` 의존성 설치 및 Granite 빌드 확인
2. 토스 로그인 도입 또는 미니앱 내 비로그인 MVP 범위 확정
3. OCR, 냉장고, 추천 핵심 화면을 Granite/TDS로 이식
4. 루트 Expo 화면과 미니앱 화면의 API 계약 동기화
5. AI 고지/라벨 추가
6. 샌드박스 앱에서 실제 기기 테스트
7. `.ait` 번들 생성 및 콘솔 업로드 테스트

## 현재 가능한 제출 상태

현재 상태는 앱 소개 이미지, Expo 웹 번들, Granite/TDS 미니앱 흐름 관점에서는 확인 가능하다. WSL/Linux + Node 24 환경에서 `.ait` 빌드도 통과했다. 다만 백엔드 토스 로그인 교환 API 확정과 샌드박스 앱 검증 전에는 제출 완료 상태로 볼 수 없다.
