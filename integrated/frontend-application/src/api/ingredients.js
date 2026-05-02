import { Platform } from 'react-native';
import { apiRequest } from './request';

export const getMyIngredients = async () => {
  return await apiRequest('/ingredient/all/my?sort=date%26ascending', { method: 'GET' });
};

export const getMyIngredientsPage = async ({ page = 0, size = 20, sort = 'date&ascending', categories = [] } = {}) => {
  const params = new URLSearchParams({
    sort,
    page: String(page),
    size: String(size),
  });
  categories.forEach((category) => params.append('category', category));
  return await apiRequest(`/ingredient/all/my/page?${params.toString()}`, { method: 'GET' });
};

export const getNearExpiringIngredients = async () => {
  return await apiRequest('/ingredient/expiration/near', { method: 'GET' });
};

export const deleteMyIngredients = async (ingredientIds) => {
  const ids = Array.isArray(ingredientIds) ? ingredientIds : [ingredientIds];
  return await apiRequest('/ingredient/all/my', {
    method: 'DELETE',
    body: JSON.stringify({ ingredientIds: ids }),
  });
};

export const searchIngredients = async (keyword) => {
  return await apiRequest(`/ingredient/search?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' });
};

export const getIngredientsByCategory = async (category) => {
  return await apiRequest(`/ingredient/category?category=${encodeURIComponent(category)}`, { method: 'GET' });
};

export const saveFirstLoginIngredients = async ({ allergies = [], preferIngredients = [], dispreferIngredients = [] }) => {
  return await apiRequest('/ingredient/first/login', {
    method: 'POST',
    body: JSON.stringify({
      allergies,
      prefer_ingredients: preferIngredients,
      disprefer_ingredients: dispreferIngredients,
    }),
  });
};

export const updateAllergies = async ({ oldAllergy = [], newAllergy = [] }) => {
  return await apiRequest('/ingredient/allergy', {
    method: 'PUT',
    body: JSON.stringify({
      oldallergy: oldAllergy,
      newallergy: newAllergy,
    }),
  });
};

export const updatePreferenceIngredients = async ({ type, oldPrefer = [], newPrefer = [] }) => {
  return await apiRequest('/ingredient/prefer', {
    method: 'PUT',
    body: JSON.stringify({
      type,
      oldPrefer,
      newPrefer,
    }),
  });
};

export const createIngredients = async (ingredients) => {
  const payload = Array.isArray(ingredients) ? ingredients : [ingredients];
  return await apiRequest('/ingredient/input', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const createIngredient = async ({ ingredient, expirationDate, category }) => {
  return await createIngredients([{ ingredient, expirationDate, category }]);
};

export const predictIngredientExpirations = async ({ purchaseDate, ingredients }) => {
  return await apiRequest('/ingredient/prediction', {
    method: 'POST',
    body: JSON.stringify({
      purchaseDate,
      ingredients,
    }),
  });
};

export const analyzeReceipt = async (photoUri) => {
  const formData = new FormData();

  if (Platform.OS === 'web' && typeof photoUri === 'string') {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    formData.append('image', blob, 'receipt.jpg');
  } else {
    formData.append('image', {
      uri: photoUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    });
  }

  return await apiRequest('/ingredient/analyze', {
    method: 'POST',
    body: formData,
  });
};
