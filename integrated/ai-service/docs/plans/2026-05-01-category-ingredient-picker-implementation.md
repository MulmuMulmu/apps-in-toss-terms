# Category Ingredient Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a category-based canonical ingredient picker so manual input never stores unnormalized free text.

**Architecture:** Backend exposes canonical ingredient names by category from the existing `Ingredient` table. Local development seeds the table from a curated canonical list, not directly from raw recipe ingredient strings. Frontend reuses the existing direct input screen and lets users choose a canonical ingredient either from search suggestions or category lists.

**Tech Stack:** Spring Boot, JPA, JUnit/Mockito, Expo React Native.

---

### Task 1: Backend Category Listing

**Files:**
- Modify: `Back-Repository-main-fresh/src/test/java/com/team200/graduation_project/domain/ingredient/service/IngredientServiceTest.java`
- Modify: `Back-Repository-main-fresh/src/main/java/com/team200/graduation_project/domain/ingredient/repository/IngredientRepository.java`
- Modify: `Back-Repository-main-fresh/src/main/java/com/team200/graduation_project/domain/ingredient/service/IngredientService.java`
- Modify: `Back-Repository-main-fresh/src/main/java/com/team200/graduation_project/domain/ingredient/controller/IngredientController.java`
- Modify: `Back-Repository-main-fresh/src/main/java/com/team200/graduation_project/domain/ingredient/controller/IngredientControllerDocs.java`

**Steps:**
1. Add a failing service test for `listIngredientsByCategory("정육/계란")`.
2. Add repository method `findByCategoryOrderByIngredientNameAsc`.
3. Implement service method returning `IngredientSearchResponse`.
4. Add controller endpoint `GET /ingredient/category?category=...`.
5. Run targeted backend test.

### Task 2: Frontend Picker API

**Files:**
- Modify: `Front-Repository-application-fresh/src/api/ingredients.js`

**Steps:**
1. Add `getIngredientsByCategory(category)`.
2. Reuse existing backend envelope handling through `apiRequest`.

### Task 3: Frontend Direct Input UX

**Files:**
- Modify: `Front-Repository-application-fresh/src/screens/DirectInputScreen.js`

**Steps:**
1. Add category picker state.
2. Add `카테고리에서 선택` button.
3. Load canonical ingredients for selected category.
4. Selecting a category item sets `name`, `category`, and `selected: true`.
5. Keep existing save guard that blocks unselected free text.

### Task 4: Verification

**Commands:**
- `.\gradlew.bat test --tests "*IngredientServiceTest"`
- `node .\scripts\verify-appintoss-flow.cjs`
- `npx expo export --platform web --output-dir tmp\verify-category-picker`

**Expected:** Commands exit with code 0. Remove temporary export output after verification.
