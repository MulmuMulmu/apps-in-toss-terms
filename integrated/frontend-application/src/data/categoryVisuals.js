const CATEGORY_ICON_IMAGES = {
  meatEgg: require('../../assets/category-icons/meat-egg.png'),
  seafood: require('../../assets/category-icons/seafood.png'),
  vegetableFruit: require('../../assets/category-icons/vegetable-fruit.png'),
  dairy: require('../../assets/category-icons/dairy.png'),
  riceNoodleBread: require('../../assets/category-icons/rice-noodle-bread.png'),
  sauceSeasoningOil: require('../../assets/category-icons/sauce-seasoning-oil.png'),
  processedFood: require('../../assets/category-icons/processed-food.png'),
  other: require('../../assets/category-icons/other.png'),
};

const RECIPE_ICON_IMAGES = {
  sideDish: require('../../assets/recipe-category-icons/side-dish.png'),
  dessert: require('../../assets/recipe-category-icons/dessert.png'),
  mainDish: require('../../assets/recipe-category-icons/main-dish.png'),
  rice: require('../../assets/recipe-category-icons/rice.png'),
  soup: require('../../assets/recipe-category-icons/soup.png'),
  kimchi: require('../../assets/recipe-category-icons/kimchi.png'),
  noodleDumpling: require('../../assets/recipe-category-icons/noodle-dumpling.png'),
  namul: require('../../assets/recipe-category-icons/namul.png'),
  stewHotpot: require('../../assets/recipe-category-icons/stew-hotpot.png'),
};

export const INGREDIENT_CATEGORY_VISUALS = {
  '정육/계란': {
    label: '육',
    image: CATEGORY_ICON_IMAGES.meatEgg,
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  해산물: {
    label: '해',
    image: CATEGORY_ICON_IMAGES.seafood,
    backgroundColor: '#E8F3FF',
    textColor: '#2467A6',
  },
  '채소/과일': {
    label: '채',
    image: CATEGORY_ICON_IMAGES.vegetableFruit,
    backgroundColor: '#E8F7EF',
    textColor: '#237A4B',
  },
  유제품: {
    label: '유',
    image: CATEGORY_ICON_IMAGES.dairy,
    backgroundColor: '#F2E8FF',
    textColor: '#7048A8',
  },
  '쌀/면/빵': {
    label: '쌀',
    image: CATEGORY_ICON_IMAGES.riceNoodleBread,
    backgroundColor: '#FFF4D6',
    textColor: '#9A6B00',
  },
  '소스/조미료/오일': {
    label: '소스',
    image: CATEGORY_ICON_IMAGES.sauceSeasoningOil,
    backgroundColor: '#FFF0D6',
    textColor: '#A65F00',
  },
  가공식품: {
    label: '가공',
    image: CATEGORY_ICON_IMAGES.processedFood,
    backgroundColor: '#FFEFEF',
    textColor: '#B03A48',
  },
  기타: {
    label: '기타',
    image: CATEGORY_ICON_IMAGES.other,
    backgroundColor: '#F1F3F5',
    textColor: '#495057',
  },
};

const INGREDIENT_CATEGORY_ALIASES = {
  '원형 보존 농산물': '채소/과일',
  '원형 보존 농산물(과일, 채소)': '채소/과일',
  '미개봉 가공식품': '가공식품',
  건강기능식품: '기타',
};

const INGREDIENT_CATEGORY_KEYWORDS = [
  {
    category: '정육/계란',
    keywords: ['소고기', '돼지고기', '닭고기', '계란', '달걀', '삼겹살', '갈비', '등심', '안심'],
  },
  {
    category: '해산물',
    keywords: ['고등어', '새우', '오징어', '게', '조개', '멸치', '어묵', '연어', '참치'],
  },
  {
    category: '채소/과일',
    keywords: ['상추', '양상추', '토마토', '방울토마토', '감자', '시금치', '당근', '양파', '대파', '배추', '사과', '귤', '바나나', '버섯'],
  },
  {
    category: '유제품',
    keywords: ['우유', '치즈', '요거트', '요구르트', '버터', '크림'],
  },
  {
    category: '쌀/면/빵',
    keywords: ['쌀', '밥', '면', '우동', '라면', '국수', '식빵', '빵', '떡', '파스타'],
  },
  {
    category: '소스/조미료/오일',
    keywords: ['간장', '고추장', '된장', '소금', '설탕', '식초', '참기름', '오일', '소스'],
  },
  {
    category: '가공식품',
    keywords: ['두부', '햄', '소시지', '스팸', '만두', '김치', '통조림', '라떼', '음료'],
  },
];

export const normalizeIngredientCategory = (category) => {
  if (!category) {
    return '기타';
  }
  const trimmed = String(category).trim();
  return INGREDIENT_CATEGORY_VISUALS[trimmed] ? trimmed : INGREDIENT_CATEGORY_ALIASES[trimmed] ?? '기타';
};

export const inferIngredientCategory = (ingredientName, fallbackCategory) => {
  const normalizedFallback = normalizeIngredientCategory(fallbackCategory);
  if (normalizedFallback !== '기타') {
    return normalizedFallback;
  }

  const name = String(ingredientName ?? '').trim();
  if (!name) {
    return normalizedFallback;
  }

  return INGREDIENT_CATEGORY_KEYWORDS.find((entry) => (
    entry.keywords.some((keyword) => name.includes(keyword))
  ))?.category ?? normalizedFallback;
};

export const getIngredientVisualForItem = ({ name, category }) => (
  getIngredientCategoryVisual(inferIngredientCategory(name, category))
);

export const RECIPE_CATEGORY_VISUALS = {
  반찬: {
    label: '찬',
    image: RECIPE_ICON_IMAGES.sideDish,
    backgroundColor: '#E8F7EF',
    textColor: '#237A4B',
  },
  '후식/디저트': {
    label: '후식',
    image: RECIPE_ICON_IMAGES.dessert,
    backgroundColor: '#F2E8FF',
    textColor: '#7048A8',
  },
  일품요리: {
    label: '요리',
    image: RECIPE_ICON_IMAGES.mainDish,
    backgroundColor: '#E8F3FF',
    textColor: '#2467A6',
  },
  밥류: {
    label: '밥',
    image: RECIPE_ICON_IMAGES.rice,
    backgroundColor: '#FFF4D6',
    textColor: '#9A6B00',
  },
  '국/탕류': {
    label: '국',
    image: RECIPE_ICON_IMAGES.soup,
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  김치류: {
    label: '김치',
    image: RECIPE_ICON_IMAGES.kimchi,
    backgroundColor: '#FFE8EA',
    textColor: '#C2253A',
  },
  '면/만두류': {
    label: '면',
    image: RECIPE_ICON_IMAGES.noodleDumpling,
    backgroundColor: '#FFF0D6',
    textColor: '#A65F00',
  },
  '나물/무침류': {
    label: '나물',
    image: RECIPE_ICON_IMAGES.namul,
    backgroundColor: '#E8F7EF',
    textColor: '#237A4B',
  },
  '찌개/전골류': {
    label: '찌개',
    image: RECIPE_ICON_IMAGES.stewHotpot,
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  default: {
    label: '요리',
    image: RECIPE_ICON_IMAGES.mainDish,
    backgroundColor: '#E8F3FF',
    textColor: '#2467A6',
  },
};

export const getIngredientCategoryVisual = (category) => (
  INGREDIENT_CATEGORY_VISUALS[normalizeIngredientCategory(category)] ?? INGREDIENT_CATEGORY_VISUALS.기타
);

export const getRecipeCategoryVisual = (category) => (
  RECIPE_CATEGORY_VISUALS[category] ?? RECIPE_CATEGORY_VISUALS.default
);

const RECIPE_VISUAL_KEYWORDS = [
  {
    imageKey: 'namul',
    keywords: ['샐러드', '나물', '무침', '과일', '오렌지', '당근', '수박', '고추', '상추', '시금치', '버섯'],
    backgroundColor: '#E8F7EF',
    textColor: '#237A4B',
  },
  {
    imageKey: 'kimchi',
    keywords: ['김치', '배추김치', '깍두기', '겉절이'],
    backgroundColor: '#FFE8EA',
    textColor: '#C2253A',
  },
  {
    imageKey: 'rice',
    keywords: ['밥', '볶음밥', '비빔밥', '죽'],
    backgroundColor: '#FFF4D6',
    textColor: '#9A6B00',
  },
  {
    imageKey: 'noodleDumpling',
    keywords: ['면', '냉면', '국수', '우동', '라면', '만두', '빵', '떡'],
    backgroundColor: '#FFF0D6',
    textColor: '#A65F00',
  },
  {
    imageKey: 'soup',
    keywords: ['국', '탕', '맑은국', '해장국'],
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  {
    imageKey: 'stewHotpot',
    keywords: ['찌개', '전골', '조림'],
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  {
    imageKey: 'mainDish',
    keywords: ['고기', '소고기', '돼지고기', '닭', '갈비', '삼겹', '불고기', '계란', '달걀'],
    backgroundColor: '#FFE8E0',
    textColor: '#B24B2B',
  },
  {
    imageKey: 'mainDish',
    keywords: ['생선', '고등어', '새우', '오징어', '해물', '조개', '게', '멸치', '참치'],
    backgroundColor: '#E8F3FF',
    textColor: '#2467A6',
  },
  {
    imageKey: 'dessert',
    keywords: ['우유', '치즈', '요거트', '요구르트', '크림', '디저트', '푸딩', '아이스'],
    backgroundColor: '#F2E8FF',
    textColor: '#7048A8',
  },
];

export const getRecipeVisualForItem = ({ title, category, ingredients } = {}) => {
  const text = [
    title,
    category,
    Array.isArray(ingredients) ? ingredients.join(' ') : ingredients,
  ].filter(Boolean).join(' ');
  const matched = RECIPE_VISUAL_KEYWORDS.find((entry) => (
    entry.keywords.some((keyword) => text.includes(keyword))
  ));

  if (!matched) {
    return getRecipeCategoryVisual(category);
  }

  return {
    label: getRecipeCategoryVisual(category).label,
    image: RECIPE_ICON_IMAGES[matched.imageKey],
    backgroundColor: matched.backgroundColor,
    textColor: matched.textColor,
  };
};
