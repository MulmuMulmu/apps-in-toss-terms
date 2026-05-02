# Canonical Ingredient Master

## Purpose

The canonical ingredient master is the set of ingredient names users are allowed to save through manual input. It protects recipe recommendation, allergy filtering, and expiration prediction from noisy product names and raw recipe phrases.

## Source Policy

- Recipe ingredient data is an input source, not the final master.
- Raw recipe strings such as `삼겹살 4~5줄`, `육수 돼지고기(삼겹살`, or `소고기(불고기용` are not exposed directly to users.
- User-selectable names live in backend seed file `src/main/resources/seed/canonical_ingredients.json`.
- Product names and raw recipe phrases live in backend seed file `src/main/resources/seed/canonical_ingredient_aliases.json`.

## Runtime Flow

1. User types a query in manual input.
2. Backend searches canonical ingredients and aliases.
3. User selects a canonical ingredient from search results or category browsing.
4. Frontend sends only the selected canonical name to `POST /ingredient/input`.
5. Recommendation receives canonical ingredient names only.

## Operating Rule

When a new food name appears:

- If it is a clean food concept users should choose directly, add it to `canonical_ingredients.json`.
- If it is a product name, recipe phrase, quantity expression, or preparation variant, add it to `canonical_ingredient_aliases.json`.
- If the mapping is ambiguous, do not add it automatically. Put it through admin review.

## QA

Run the coverage audit from the AI repository:

```powershell
python .\scripts\audit_canonical_ingredient_coverage.py
```

The coverage rate is not expected to be 100%. Low-value raw phrases should remain unmapped unless they are useful for OCR or manual search.
