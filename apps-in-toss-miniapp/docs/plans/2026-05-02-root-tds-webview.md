# Root TDS WebView Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the repository root into the Apps in Toss TDS WebView app so root `.ait` builds are valid submission artifacts.

**Architecture:** Promote the working `apps-in-toss-miniapp` Vite/TDS implementation into the repository root. Preserve the Expo app under `legacy-expo/` for future feature migration and replace the root Apps in Toss contract test to guard against accidentally packaging Expo again.

**Tech Stack:** Apps in Toss WebView, Vite, React, TypeScript, `@apps-in-toss/web-framework`, `@toss/tds-mobile`, Node test scripts.

---

### Task 1: Replace Root Contract Test

**Files:**
- Modify: `scripts/test-ait-root-contract.mjs`

**Step 1: Write the failing test**

Assert that root config uses `vite build`, root files contain `VITE_API_BASE_URL`, root `src/App.tsx` calls `appLogin()`, root package uses `@toss/tds-mobile`, and any root `.ait` archive does not contain `web/_expo/`.

**Step 2: Run test to verify it fails**

Run: `node scripts/test-ait-root-contract.mjs`

Expected: FAIL because root still uses `build-expo-web-for-ait.mjs`.

### Task 2: Promote TDS WebView Files

**Files:**
- Move: `src/` to `legacy-expo/src/`
- Move: `App.js`, `index.js`, `app.json`, Expo-specific scripts/config into `legacy-expo/`
- Copy: `apps-in-toss-miniapp/src/` to `src/`
- Copy: `apps-in-toss-miniapp/index.html`, `vite.config.ts`, `tsconfig.json`, `.env.production`, `package.json`, `package-lock.json`, `granite.config.ts` to root

**Step 1: Preserve legacy app**

Create `legacy-expo/` and move the current Expo runtime files there without deleting them.

**Step 2: Promote WebView app**

Copy the working miniapp files to root so the root app is Vite/TDS WebView.

### Task 3: Verify and Build

**Files:**
- Generated: `dist/`
- Generated: `mulmumulmu.ait`

**Step 1: Run contract test**

Run: `node scripts/test-ait-root-contract.mjs`

Expected: PASS.

**Step 2: Install/build if needed**

Run: `npm install`, then `npm run build`, then `npm run ait:build`.

Expected: Vite build succeeds and root `.ait` contains `web/index.html` plus `web/assets/index-*`, with no `web/_expo/`.
