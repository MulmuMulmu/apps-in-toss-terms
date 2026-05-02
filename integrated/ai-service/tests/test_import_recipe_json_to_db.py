from __future__ import annotations

import json
from pathlib import Path

from scripts.import_recipe_json_to_db import import_recipe_json_to_db


def test_import_recipe_json_to_db_canonicalizes_ingredients(tmp_path: Path) -> None:
    source_dir = tmp_path / "source"
    output_dir = tmp_path / "db"
    source_dir.mkdir()

    (source_dir / "ingredients.json").write_text(
        json.dumps(
            [
                {"ingredientId": "garlic", "ingredientName": "마늘", "category": "채소/과일"},
                {"ingredientId": "minced-garlic", "ingredientName": "다진마늘", "category": "채소/과일"},
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (source_dir / "recipe_ingredients.json").write_text(
        json.dumps(
            [
                {
                    "recipeIngredientId": "ri1",
                    "recipeId": "r1",
                    "ingredientId": "minced-garlic",
                    "amount": 1.0,
                    "unit": "큰술",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (source_dir / "recipes.json").write_text("[]", encoding="utf-8")
    (source_dir / "recipe_steps.json").write_text("[]", encoding="utf-8")

    summary = import_recipe_json_to_db(source_dir=source_dir, output_dir=output_dir)

    ingredients = json.loads((output_dir / "ingredients.json").read_text(encoding="utf-8"))
    recipe_ingredients = json.loads((output_dir / "recipe_ingredients.json").read_text(encoding="utf-8"))
    aliases = json.loads((output_dir / "ingredient_aliases.json").read_text(encoding="utf-8"))

    assert summary["ingredients_before"] == 2
    assert summary["ingredients_after"] == 1
    assert ingredients == [{"ingredientId": "garlic", "ingredientName": "마늘", "category": "채소/과일"}]
    assert recipe_ingredients[0]["ingredientId"] == "garlic"
    assert aliases == [{"ingredientName": "마늘", "aliasName": "다진마늘"}]
