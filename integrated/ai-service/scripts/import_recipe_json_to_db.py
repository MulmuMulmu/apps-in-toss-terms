from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from canonical_ingredients import canonicalize_db_rows


REQUIRED_FILES = ("ingredients.json", "recipe_ingredients.json", "recipes.json", "recipe_steps.json")


def import_recipe_json_to_db(*, source_dir: Path, output_dir: Path) -> dict[str, int]:
    source_dir = source_dir.expanduser().resolve()
    output_dir = output_dir.expanduser().resolve()
    _validate_source_dir(source_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    raw_ingredients = _load_json(source_dir / "ingredients.json")
    raw_recipe_ingredients = _load_json(source_dir / "recipe_ingredients.json")
    result = canonicalize_db_rows(raw_ingredients, raw_recipe_ingredients)

    alias_rows = [
        {"ingredientName": canonical_name, "aliasName": alias_name}
        for canonical_name, aliases in result.aliases_by_canonical_name.items()
        for alias_name in aliases
    ]

    _write_json(output_dir / "recipes.json", _load_json(source_dir / "recipes.json"))
    _write_json(output_dir / "recipe_steps.json", _load_json(source_dir / "recipe_steps.json"))
    _write_json(output_dir / "ingredients.json", result.ingredients)
    _write_json(output_dir / "recipe_ingredients.json", result.recipe_ingredients)
    _write_json(output_dir / "ingredient_aliases.json", alias_rows)

    return {
        "ingredients_before": len(raw_ingredients),
        "ingredients_after": len(result.ingredients),
        "recipe_ingredients_before": len(raw_recipe_ingredients),
        "recipe_ingredients_after": len(result.recipe_ingredients),
        "alias_rows": len(alias_rows),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Import recipe JSON files and canonicalize ingredient IDs.")
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=REPO_ROOT / "data" / "db")
    args = parser.parse_args()

    summary = import_recipe_json_to_db(source_dir=args.source_dir, output_dir=args.output_dir)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


def _validate_source_dir(source_dir: Path) -> None:
    missing = [name for name in REQUIRED_FILES if not (source_dir / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing required source files in {source_dir}: {', '.join(missing)}")


def _load_json(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def _write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
