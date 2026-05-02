export const shareAllowedCategories = [
  '채소/과일',
  '쌀/면/빵',
  '소스/조미료/오일',
  '가공식품',
];

const blockedCategories = ['정육/계란', '해산물', '유제품', '건강기능식품', '의약품', '주류'];

const blockedKeywords = [
  '술',
  '맥주',
  '소주',
  '와인',
  '막걸리',
  '담배',
  '전자담배',
  '약',
  '의약품',
  '감기약',
  '진통제',
  '연고',
  '한약',
  '건강기능식품',
  '건기식',
  '영양제',
  '비타민',
  '홍삼',
  '분유',
  '이유식',
  '해외직구',
  '직구',
  '개봉한',
  '개봉됨',
  '뜯은',
  '소분',
  '조리',
  '반찬',
  '수제',
];

export const shareSafetyChecklist = [
  '소비기한이 지났거나 상태가 변한 식품이 아닙니다.',
  '개봉, 소분, 직접 조리한 음식이 아닙니다.',
  '주류, 의약품, 건강기능식품, 해외직구 식품이 아닙니다.',
  '냉장/냉동 보관이 필요한 품목은 나눔하지 않습니다.',
  '알레르기 유발 가능성이나 특이사항을 숨기지 않습니다.',
];

export const getSharePolicyViolation = ({
  ingredientName,
  ingredientCategory,
  category,
  title,
  content,
  expirationDate,
}) => {
  const categoryText = `${ingredientCategory || ''} ${category || ''}`;
  if (blockedCategories.some((blockedCategory) => categoryText.includes(blockedCategory))) {
    return '정육/계란, 해산물, 유제품, 건강기능식품은 보관 안전을 확인하기 어려워 나눔할 수 없어요.';
  }

  if (expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiration = new Date(expirationDate);
    if (!Number.isNaN(expiration.getTime()) && expiration < today) {
      return '소비기한이 지난 식재료는 나눔할 수 없어요.';
    }
  }

  const joinedText = `${ingredientName || ''} ${ingredientCategory || ''} ${category || ''} ${title || ''} ${content || ''}`.toLowerCase();
  if (blockedKeywords.some((keyword) => joinedText.includes(keyword.toLowerCase()))) {
    return '주류, 의약품, 건강기능식품, 개봉/소분/조리 식품은 나눔할 수 없어요.';
  }

  return null;
};
