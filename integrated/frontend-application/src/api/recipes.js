import { apiRequest } from './request';

export const getRecipes = async ({ page = 0, size = 20, category = '전체', keyword = '' } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (category && category !== '전체') {
    params.append('category', category);
  }
  if (keyword.trim()) {
    params.append('keyword', keyword.trim());
  }
  return await apiRequest(`/recipe?${params.toString()}`, { method: 'GET' });
};

export const recommendRecipes = async ({ ingredients, preferIngredients = [], dispreferIngredients = [], candidates = [], ingredientRatio = 0.5 }) => {
  return await apiRequest('/recipe/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      userIngredient: {
        ingredients,
        preferIngredients,
        dispreferIngredients,
        IngredientRatio: ingredientRatio,
      },
      candidates,
    }),
  });
};

export const getRecipeDetail = async (recipeId) => {
  return await apiRequest(`/recipe/${encodeURIComponent(recipeId)}`, { method: 'GET' });
};
