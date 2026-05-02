# Apps in Toss Granite Runtime

The root Expo runtime now follows the Apps in Toss entry flow for local UI/integration testing.
The production Apps in Toss artifact still lives in `apps-in-toss-miniapp/` as a parallel Vite/WebView entry point.

## Scope

- Root `App.js` starts at `Splash` and no longer registers the legacy `Login` or `Register` routes in the default stack.
- Root `src/screens/SplashScreen.js` requests Apps in Toss authorization on first entry, exchanges it through the backend, and then routes to onboarding or `Main`.
- Root `src/services/appInTossAuth.js` isolates the Apps in Toss login bridge lookup so the Expo dev build can still bundle without the Apps in Toss SDK dependency.
- `apps-in-toss-miniapp/src/App.tsx` renders the first submission flow using TDS primitives:
  Toss Login, receipt OCR, fridge loading, and recipe recommendation.
- `apps-in-toss-miniapp/src/services/miniappApi.ts` centralizes the backend contract used by the miniapp.
- `apps-in-toss-miniapp/src/domain/fridge.js` contains deterministic fridge filtering and recommendation ranking helpers.

## Dependency Boundary

The miniapp has its own `package.json` with the Apps in Toss and Granite dependency set expected by official examples:
`@apps-in-toss/framework`, `@granite-js/react-native`, `@granite-js/plugin-router`,
`@toss/tds-react-native`, React 18.2, and React Native 0.72.

Dependencies are pinned and locked in `apps-in-toss-miniapp/package-lock.json`.

## Verified Commands

Windows PowerShell:

```powershell
cd apps-in-toss-miniapp
npm install
node .\node_modules\typescript\bin\tsc --noEmit
node .\scripts\test-domain.mjs
```

In the current local Windows/npm environment, `npm run` itself can fail before executing scripts because npm cannot resolve a shell. Direct `node ...` commands are the reliable local check.

`node .\node_modules\@granite-js\react-native\bin\cli.js build` currently fails on direct Windows execution because Granite generates an unescaped Windows absolute path in `.granite/micro-frontend-runtime.js`.

Verified WSL/Linux build path:

```bash
cd /tmp/mulmu-miniapp-build
npm ci
node node_modules/typescript/bin/tsc --noEmit
npx -y node@24 node_modules/@granite-js/react-native/bin/cli.js build
```

Result: `MulmuMulmu.ait` build completed in the WSL/Linux copy. Node 24 is required by `@apps-in-toss/ait-format`.

## Backend Contract Points

The miniapp currently calls the backend through `src/services/miniappApi.ts`.

### Toss Login

Apps in Toss 공식 예제 기준 클라이언트 로그인 진입점은 `appLogin()`이다.

```ts
const { authorizationCode, referrer } = await appLogin();
```

`appLogin()` 반환 계약:

```ts
{
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
}
```

미니앱은 이 값을 백엔드로 전달하고, 백엔드는 Apps in Toss OAuth API에 mTLS 인증서로 토큰 교환을 수행한다.

```text
POST /auth/toss/login
```

Request body:

```json
{
  "authorizationCode": "from appLogin()",
  "referrer": "DEFAULT"
}
```

Recommended backend response:

```json
{
  "success": true,
  "result": {
    "jwt": "backend-session-token",
    "refreshToken": "backend-refresh-token"
  }
}
```

The miniapp also accepts the official example shape while the backend contract is being finalized:

```json
{
  "data": {
    "success": {
      "accessToken": "apps-in-toss-access-token",
      "refreshToken": "apps-in-toss-refresh-token"
    }
  }
}
```

Backend exchange target:

```text
POST https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token
```

Backend request body to Toss:

```json
{
  "authorizationCode": "from frontend",
  "referrer": "DEFAULT"
}
```

Backend prerequisites:

- Toss Login must be enabled in the Apps in Toss console.
- User data decryption key/AAD must be issued if backend reads encrypted user profile fields.
- mTLS certificate and private key must be issued and configured on the backend.

### User Consent Screen Behavior

Opening the root Expo app no longer shows the old ID/password login screen.

Current root flow:

1. User opens the miniapp.
2. The app attempts Apps in Toss authorization immediately.
3. Toss shows the login/consent screen only if the current user state requires it.
4. The app receives `authorizationCode` and `referrer`, then calls `POST /auth/toss/login`.
5. The backend returns a service JWT; the app stores it and routes to onboarding or `Main`.

If the root Expo build is opened outside the Apps in Toss runtime, the bridge is unavailable. In that case the app shows retry plus a local development entry button, not the old login form.

For local UI testing without the Toss runtime, set the explicit bypass flag:

```powershell
$env:EXPO_PUBLIC_DEV_BYPASS_APPINTOSS_LOGIN='1'
npx expo start --web --localhost --port 8082
```

This skips only the Apps in Toss bridge call. The app still logs in to the backend before entering `Main`.

Default local credentials match the backend `local` profile seed data:

```text
id: mulmuAdmin
password: 1234
```

To use a different local test account:

```powershell
$env:EXPO_PUBLIC_DEV_BYPASS_APPINTOSS_LOGIN='1'
$env:EXPO_PUBLIC_DEV_LOGIN_ID='user1'
$env:EXPO_PUBLIC_DEV_LOGIN_PASSWORD='1234'
npx expo start --web --localhost --port 8082
```

### OCR, Fridge, Recommendation

```text
POST /ingredient/analyze
GET /ingredient/all/my
POST /ingredient/recommondation
```

These match the current backend-facing OCR, fridge, and recommendation flow. Until backend integration is available, the UI clearly labels fallback/sample data as a connection fallback rather than real user data.

## Current Limitations

- Toss Login now calls `appLogin()` and then the backend exchange endpoint. The backend endpoint still needs to be implemented/confirmed by the backend owner.
- This is a first submission flow, not a full migration of every Expo screen.
- Final validation still requires sandbox-app testing with the generated `.ait` artifact.
- Direct Windows `granite build` remains blocked by a Granite Windows path generation issue; use WSL/Linux or CI Linux for packaging.
