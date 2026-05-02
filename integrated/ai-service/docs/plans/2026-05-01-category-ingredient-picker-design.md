# Category Ingredient Picker Design

**Goal:** Keep user ingredient data normalized by allowing manual input through search or category-based selection only.

**Decision:** Free text is used only as a search query. The saved ingredient must be one of the backend canonical `Ingredient` names.

## User Flow

1. The user types a product or ingredient name.
2. The app calls `GET /ingredient/search?keyword=...`.
3. If a result is visible, the user selects a canonical ingredient.
4. If the user cannot find the ingredient by typing, the user opens `카테고리에서 선택`.
5. The app calls `GET /ingredient/category?category=...`.
6. The user selects a canonical ingredient from that category.
7. `POST /ingredient/input` saves only the selected canonical ingredient name.

## Data Policy

- The backend `Ingredient` table remains the canonical ingredient master.
- The backend `IngredientAlias` table maps OCR/product names to canonical ingredients.
- Raw recipe ingredient strings are not exposed directly as user-selectable canonical ingredients.
- Recipe recommendation receives canonical ingredient names only.
- Unknown free text is not saved as a user ingredient.
- If a frequently missing item appears, it should be added by admin as an ingredient or alias.

## Why This Shape

This avoids polluting recommendation and allergy logic with product names like `서울우유 1L`, `한우불고기용`, or raw recipe strings like `삼겹살 4~5줄`. Users still have a fallback when search fails, but the fallback is category browsing rather than unstructured free text.

## API Addition

`GET /ingredient/category?category={categoryName}`

Response shape reuses the existing ingredient search response:

```json
{
  "success": true,
  "code": "COMMON200",
  "result": {
    "ingredientNames": ["소고기", "돼지고기", "삼겹살"]
  }
}
```

## Verification

- Searching still requires selecting a canonical ingredient.
- Category picker returns only canonical ingredient names.
- Manual save still rejects unselected free text.
- Recommendation input remains normalized.
