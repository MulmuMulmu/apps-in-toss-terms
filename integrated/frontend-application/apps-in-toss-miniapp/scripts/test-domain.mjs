import assert from 'node:assert/strict';
import { normalizeTossLoginExchangeResponse } from '../src/domain/auth.js';
import {
  countExpiringSoon,
  filterAndSortIngredients,
  rankRecipeCandidates,
} from '../src/domain/fridge.js';

const ingredients = [
  { name: '양파', category: '채소/과일', dday: 'D-5' },
  { name: '계란', category: '정육/계란', dday: 'D-1' },
  { name: '김치', category: '가공식품', dday: 'D-2' },
];

assert.equal(countExpiringSoon(ingredients), 2);
assert.deepEqual(
  filterAndSortIngredients(ingredients, {
    categories: ['채소/과일'],
    keyword: '양',
    sortType: '이름순(오름차순)',
  }).map(item => item.name),
  ['양파']
);

const ranked = rankRecipeCandidates({
  ingredients: ['김치', '계란'],
  preferIngredients: ['두부'],
  dispreferIngredients: ['오이'],
  ingredientRatio: 0.5,
  candidates: [
    { recipeId: '1', title: '김치계란밥', ingredients: ['김치', '계란', '밥'] },
    { recipeId: '2', title: '오이무침', ingredients: ['오이', '고춧가루'] },
  ],
});

assert.equal(ranked.length, 1);
assert.equal(ranked[0].recipeId, '1');
assert.equal(ranked[0].matchDetails.matched.length, 2);

const officialTossToken = normalizeTossLoginExchangeResponse({
  data: {
    success: {
      accessToken: 'official-access',
      refreshToken: 'official-refresh',
    },
  },
});

assert.equal(officialTossToken.accessToken, 'official-access');
assert.equal(officialTossToken.refreshToken, 'official-refresh');

const backendToken = normalizeTossLoginExchangeResponse({
  success: true,
  result: {
    jwt: 'backend-jwt',
    refreshToken: 'backend-refresh',
  },
});

assert.equal(backendToken.accessToken, 'backend-jwt');
assert.equal(backendToken.refreshToken, 'backend-refresh');

assert.throws(
  () => normalizeTossLoginExchangeResponse({ success: true, result: {} }),
  /AccessToken/
);

console.log('domain tests passed');
