# Root TDS WebView Migration Design

## Goal

Make the repository root itself the Apps in Toss submission project. The generated root `.ait` file must be a TDS WebView/Vite bundle, not an Expo web export.

## Architecture

The existing `apps-in-toss-miniapp` implementation becomes the canonical root app because it already matches the Apps in Toss WebView shape and has verified login behavior. The existing Expo app is retained under `legacy-expo/` for reference while its screens are migrated incrementally into the TDS WebView app.

## Data Flow

The root app calls `appLogin()` from `@apps-in-toss/web-framework`, sends `{ authorizationCode, referrer }` to `POST /auth/toss/login`, stores the returned service token in React state, and uses that token on later backend calls.

## Build Contract

Root `granite.config.ts` uses `vite build`. Root `package.json` owns the WebView dependencies: `@apps-in-toss/web-framework`, `@toss/tds-mobile`, React, Vite, and TypeScript. The root `.ait` archive should include `web/index.html` and `web/assets/index-*.js/css`, and should not include Expo `_expo` assets.

## Testing

Update the root contract test so it fails while the root still points at Expo and passes only after the root has the TDS WebView entry, Vite config, Apps in Toss login call, production API URL, and non-Expo `.ait` package shape.
