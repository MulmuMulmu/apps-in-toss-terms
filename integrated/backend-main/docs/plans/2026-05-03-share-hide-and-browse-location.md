# Share Hide And Browse Location Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist per-user hidden share posts on the backend and separate verified transaction location from temporary browsing location.

**Architecture:** Add a `ShareHiddenPost` join entity keyed by user and share, expose hide/unhide endpoints, and exclude hidden shares in list queries. Keep the saved backend share location as the verified transaction location, while the frontend can search and browse another neighborhood without overwriting that verified location.

**Tech Stack:** Spring Boot/JPA/MySQL backend, React/Vite frontend, static WebView regression script, Gradle/Jest-style npm scripts.

---

### Task 1: Backend Hidden Shares

**Files:**
- Create: `src/main/java/com/team200/graduation_project/domain/share/entity/ShareHiddenPost.java`
- Create: `src/main/java/com/team200/graduation_project/domain/share/repository/ShareHiddenPostRepository.java`
- Modify: `src/main/java/com/team200/graduation_project/domain/share/service/ShareService.java`
- Modify: `src/main/java/com/team200/graduation_project/domain/share/controller/ShareController.java`

**Steps:**
1. Add failing tests or static assertions for `hideSharePosting`, `unhideSharePosting`, and list exclusion.
2. Implement the entity with unique user/share mapping.
3. Add repository methods for existence, delete, and hidden-share filtering.
4. Exclude hidden shares from `getShareList`.
5. Run backend tests.

### Task 2: Frontend Hide API

**Files:**
- Modify: `src/services/miniappApi.ts`
- Modify: `src/App.tsx`
- Modify: `scripts/test-full-webview-port.mjs`

**Steps:**
1. Add failing static checks that localStorage hide storage is gone and server API is used.
2. Add `hideSharePost` and `unhideSharePost` API helpers.
3. Update the detail action to call the backend and refresh the list.
4. Keep local hidden storage out of account state.

### Task 3: Browse Location

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/services/miniappApi.ts`
- Modify: `scripts/test-full-webview-port.mjs`

**Steps:**
1. Add failing checks for separate browsing location state and no verification payload on browse-only selection.
2. Add a browse location state to `MarketScreen`.
3. Let manual location search update browse state only.
4. Keep current-location verification as the write/transaction location path.
5. Run frontend checks and typecheck.
