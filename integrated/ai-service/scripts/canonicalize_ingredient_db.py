from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from canonical_ingredients import canonicalize_db_rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Canonicalize data/db ingredient IDs used by recipes.")
    parser.add_argument("--db-dir", type=Path, default=REPO_ROOT / "data" / "db")
    parser.add_argument("--write", action="store_true", help="Rewrite ingredients.json and recipe_ingredients.json.")
    parser.add_argument(
        "--alias-output",
        type=Path,
        default=REPO_ROOT / "data" / "db" / "ingredient_aliases.json",
        help="Output path for generated alias records.",
    )
    args = parser.parse_args()

    ingredients_path = args.db_dir / "ingredients.json"
    recipe_ingredients_path = args.db_dir / "recipe_ingredients.json"
    ingredients = _load_json(ingredients_path)
    recipe_ingredients = _load_json(recipe_ingredients_path)

    result = canonicalize_db_rows(ingredients, recipe_ingredients)
    alias_rows = [
        {"ingredientName": canonical_name, "aliasName": alias_name}
        for canonical_name, aliases in result.aliases_by_canonical_name.items()
        for alias_name in aliases
    ]

    print(f"ingredients_before={len(ingredients)}")
    print(f"ingredients_after={len(result.ingredients)}")
    print(f"merged_ingredient_ids={sum(1 for old, new in result.ingredient_id_map.items() if old != new)}")
    print(f"recipe_ingredients_before={len(recipe_ingredients)}")
    print(f"recipe_ingredients_after={len(result.recipe_ingredients)}")
    print(f"alias_rows={len(alias_rows)}")

    for row in alias_rows[:30]:
        print(f"alias: {row['aliasName']} -> {row['ingredientName']}")

    if not args.write:
        print("dry_run=true")
        return 0

    _write_json(ingredients_path, result.ingredients)
    _write_json(recipe_ingredients_path, result.recipe_ingredients)
    _write_json(args.alias_output, alias_rows)
    print("write=true")
    return 0


def _load_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
