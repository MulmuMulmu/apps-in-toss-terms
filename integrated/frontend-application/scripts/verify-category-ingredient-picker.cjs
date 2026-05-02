const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing: ${expected}`);
  }
}

const api = read('src/api/ingredients.js');
const screen = read('src/screens/DirectInputScreen.js');

assertIncludes(api, 'getIngredientsByCategory', 'category ingredient API');
assertIncludes(api, '/ingredient/category?category=', 'backend category endpoint');

assertIncludes(screen, '카테고리에서 선택', 'category picker entry button');
assertIncludes(screen, 'categoryIngredientSuggestions', 'category suggestion state');
assertIncludes(screen, 'loadCategoryIngredients', 'category loader');
assertIncludes(screen, 'selected: true', 'canonical selection state');
assertIncludes(screen, '검색 결과에서 표준 식재료를 선택해주세요', 'free-text save guard');

console.log('Category ingredient picker static verification passed.');
