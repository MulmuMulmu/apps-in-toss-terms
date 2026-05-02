// @ts-nocheck

const parseDday = dday => {
  const value = Number.parseInt(String(dday ?? '').replace('D-', ''), 10);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
};

export const countExpiringSoon = ingredients =>
  ingredients.filter(item => parseDday(item.dday) <= 3).length;

export const filterAndSortIngredients = (
  ingredients,
  { categories = [], keyword = '', sortType = '날짜순(오름차순)' } = {}
) => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filtered = ingredients.filter(item => {
    const matchesCategory = categories.length === 0 || categories.includes(item.category);
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      String(item.name ?? '').toLowerCase().includes(normalizedKeyword);
    return matchesCategory && matchesKeyword;
  });

  return [...filtered].sort((a, b) => {
    if (sortType === '날짜순(내림차순)') {
      return parseDday(b.dday) - parseDday(a.dday);
    }
    if (sortType === '이름순(오름차순)') {
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ko');
    }
    if (sortType === '이름순(내림차순)') {
      return String(b.name ?? '').localeCompare(String(a.name ?? ''), 'ko');
    }
    return parseDday(a.dday) - parseDday(b.dday);
  });
};

export const rankRecipeCandidates = ({
  ingredients = [],
  preferIngredients = [],
  dispreferIngredients = [],
  ingredientRatio = 0.5,
  candidates = [],
}) => {
  const owned = new Set(ingredients);
  const preferred = new Set(preferIngredients);
  const disliked = new Set(dispreferIngredients);

  return candidates
    .map(candidate => {
      const recipeIngredients = candidate.ingredients ?? [];
      const matched = recipeIngredients.filter(item => owned.has(item));
      const missing = recipeIngredients.filter(item => !owned.has(item));
      const baseRatio = recipeIngredients.length === 0 ? 0 : matched.length / recipeIngredients.length;
      const preferBonus = recipeIngredients.some(item => preferred.has(item)) ? 0.08 : 0;
      const dislikePenalty = recipeIngredients.some(item => disliked.has(item)) ? 0.2 : 0;
      const score = Math.max(0, Math.min(1, baseRatio + preferBonus - dislikePenalty));

      return {
        recipeId: candidate.recipeId ?? candidate.recipe_id,
        title: candidate.title,
        ingredients: recipeIngredients,
        score,
        matchDetails: { matched, missing },
      };
    })
    .filter(item => item.score >= ingredientRatio)
    .sort((a, b) => b.score - a.score);
};
