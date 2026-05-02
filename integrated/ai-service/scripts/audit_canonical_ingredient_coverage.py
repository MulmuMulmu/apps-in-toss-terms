"""Audit recipe ingredient coverage against backend canonical ingredients.

This script intentionally treats backend seed files as the operating source for
manual input and normalization. Raw recipe ingredient strings are measured
against canonical names and aliases, but they are not automatically promoted.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


DEFAULT_AI_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BACKEND_ROOT = DEFAULT_AI_ROOT.parent / "Back-Repository-main-fresh"


def normalize(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]", "", value or "").lower()


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ai-root", type=Path, default=DEFAULT_AI_ROOT)
    parser.add_argument("--backend-root", type=Path, default=DEFAULT_BACKEND_ROOT)
    parser.add_argument("--top-missing", type=int, default=40)
    args = parser.parse_args()

    ai_ingredients_path = args.ai_root / "data" / "db" / "ingredients.json"
    canonical_path = args.backend_root / "src" / "main" / "resources" / "seed" / "canonical_ingredients.json"
    alias_path = args.backend_root / "src" / "main" / "resources" / "seed" / "canonical_ingredient_aliases.json"

    recipe_ingredients = load_json(ai_ingredients_path)
    canonical_rows = load_json(canonical_path)
    alias_rows = load_json(alias_path)

    canonical_by_norm = {
        normalize(row["ingredientName"]): row["ingredientName"]
        for row in canonical_rows
        if row.get("ingredientName")
    }
    alias_by_norm = {
        normalize(row["aliasName"]): row["ingredientName"]
        for row in alias_rows
        if row.get("aliasName") and row.get("ingredientName")
    }

    status_counts = Counter()
    category_counts: dict[str, Counter] = defaultdict(Counter)
    missing_by_category: dict[str, list[str]] = defaultdict(list)

    for row in recipe_ingredients:
        name = row.get("ingredientName", "")
        category = row.get("category") or "미분류"
        norm = normalize(name)
        if not norm:
            continue

        if norm in canonical_by_norm:
            status = "canonical_exact"
        elif norm in alias_by_norm:
            status = "alias_exact"
        elif any(norm == canonical_norm or norm.find(canonical_norm) >= 0 for canonical_norm in canonical_by_norm if len(canonical_norm) >= 2):
            status = "contains_canonical"
        else:
            status = "missing"
            missing_by_category[category].append(name)

        status_counts[status] += 1
        category_counts[category][status] += 1

    total = sum(status_counts.values())
    covered = total - status_counts["missing"]
    print(f"total_recipe_ingredient_names={total}")
    print(f"canonical_count={len(canonical_by_norm)}")
    print(f"alias_count={len(alias_by_norm)}")
    print(f"covered_count={covered}")
    print(f"coverage_rate={covered / total:.3f}" if total else "coverage_rate=0.000")
    print()

    for category in sorted(category_counts):
        counter = category_counts[category]
        category_total = sum(counter.values())
        category_covered = category_total - counter["missing"]
        rate = category_covered / category_total if category_total else 0
        print(
            f"[{category}] total={category_total} covered={category_covered} "
            f"coverage={rate:.3f} missing={counter['missing']}"
        )

    print()
    print("top_missing_by_category")
    for category in sorted(missing_by_category):
        counts = Counter(missing_by_category[category])
        samples = ", ".join(name for name, _ in counts.most_common(args.top_missing))
        print(f"[{category}] {samples}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
