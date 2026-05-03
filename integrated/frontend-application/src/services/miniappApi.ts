import { normalizeTossLoginExchangeResponse } from '../domain/auth';

const TOSS_LOGIN_EXCHANGE_PATH = '/auth/toss/login';
const LOCAL_LOGIN_PATH = '/auth/local/login';
const LOCAL_BACKEND_URL = 'http://localhost:8080';
const LOCAL_API_PROXY_PATH = '/api';
const PRODUCTION_API_BASE_URL = 'https://mulmumu-backend-aqjxa3obfa-du.a.run.app';

let miniappAccessToken: string | null = null;

export function setMiniappAccessToken(token: string | null) {
  miniappAccessToken = token;
}

const isLocalPreviewHost = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const toBearerToken = (accessToken?: string | null) => {
  const token = accessToken ?? miniappAccessToken;
  if (token == null || token.length === 0) {
    return undefined;
  }
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
};

const buildHeaders = ({ json = false, accessToken }: { json?: boolean; accessToken?: string | null } = {}) => {
  const headers: Record<string, string> = {};
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  const authorization = toBearerToken(accessToken);
  if (authorization != null) {
    return { ...headers, Authorization: authorization };
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
};

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (import.meta.env.DEV && (configuredUrl == null || configuredUrl.length === 0 || isLocalPreviewHost())) {
    return LOCAL_API_PROXY_PATH;
  }

  if (configuredUrl != null && configuredUrl.length > 0) {
    return configuredUrl;
  }

  if (import.meta.env.DEV) {
    return LOCAL_API_PROXY_PATH;
  }

  if (isLocalPreviewHost()) {
    return LOCAL_BACKEND_URL;
  }

  return PRODUCTION_API_BASE_URL;
}

type TossReferrer = 'DEFAULT' | 'SANDBOX';

type TossLoginExchangePayload = {
  authorizationCode: string;
  referrer: TossReferrer;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (text.length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      result: response.ok
        ? '응답을 해석하지 못했어요. 잠시 후 다시 시도해주세요.'
        : '서버 응답이 원활하지 않아요. 잠시 후 다시 시도해주세요.',
    };
  }
};

const imageToBlob = async (image: { dataUri?: string; uri?: string }) => {
  const source = image.dataUri ?? image.uri ?? '';
  const normalized = source.startsWith('data:')
    ? source
    : /^[A-Za-z0-9+/=]+$/.test(source)
      ? `data:image/jpeg;base64,${source}`
      : source;
  const response = await fetch(normalized);
  return response.blob();
};

export async function exchangeTossLogin(payload: TossLoginExchangePayload) {
  const response = await fetch(`${getApiBaseUrl()}${TOSS_LOGIN_EXCHANGE_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '토스 로그인을 완료하지 못했어요.');
  }

  return normalizeTossLoginExchangeResponse(data);
}

export async function loginWithLocalBackend() {
  const baseUrl = isLocalPreviewHost() ? LOCAL_API_PROXY_PATH : getApiBaseUrl();
  const response = await fetch(`${baseUrl}${LOCAL_LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: '로컬 테스트 사용자' }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '로컬 백엔드 로그인에 실패했어요.');
  }

  return normalizeTossLoginExchangeResponse(data);
}

export async function getMyProfile() {
  const response = await fetch(`${getApiBaseUrl()}/auth/mypage`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '프로필을 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function updateNickname({ oldNickName, newNickName }: { oldNickName: string; newNickName: string }) {
  const response = await fetch(`${getApiBaseUrl()}/auth/nickName`, {
    method: 'PUT',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ oldnickName: oldNickName, newnickName: newNickName }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '닉네임을 변경하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function updateProfilePicture(imageUri: string) {
  const formData = new FormData();
  formData.append('image', await imageToBlob({ dataUri: imageUri }), 'profile.jpg');

  const response = await fetch(`${getApiBaseUrl()}/auth/mypage/picture`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: formData,
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '프로필 사진을 변경하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function analyzeReceiptImage(image: { dataUri?: string; uri?: string }) {
  const formData = new FormData();
  formData.append('image', await imageToBlob(image), 'receipt.jpg');

  const response = await fetch(`${getApiBaseUrl()}/ingredient/analyze`, {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '영수증을 분석하지 못했어요.');
  }

  return data;
}

type MyIngredientsRequest = {
  accessToken?: string | null;
  page?: number;
  size?: number;
  sort?: string;
  categories?: string[];
  keyword?: string;
};

export async function fetchMyIngredients(input: string | null | MyIngredientsRequest = {}) {
  const options: MyIngredientsRequest = typeof input === 'string' || input == null ? { accessToken: input } : input;
  const params = new URLSearchParams({ sort: options.sort ?? 'date&ascending' });
  for (const category of options.categories ?? []) {
    params.append('category', category);
  }
  if (options.keyword != null && options.keyword.trim().length > 0) {
    params.set('keyword', options.keyword.trim());
  }
  const response = await fetch(`${getApiBaseUrl()}/ingredient/all/my?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders({ accessToken: options.accessToken }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 불러오지 못했어요.');
  }

  return data;
}

export async function getMyIngredientsPage({
  accessToken,
  page = 0,
  size = 20,
  sort = 'date&ascending',
  categories = [],
  keyword = '',
}: MyIngredientsRequest = {}) {
  const params = new URLSearchParams({
    sort,
    page: String(page),
    size: String(size),
  });
  for (const category of categories) {
    params.append('category', category);
  }
  if (keyword.trim().length > 0) {
    params.set('keyword', keyword.trim());
  }
  const response = await fetch(`${getApiBaseUrl()}/ingredient/all/my/page?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders({ accessToken }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 불러오지 못했어요.');
  }

  return data;
}

export async function getNearExpiringIngredients() {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/expiration/near`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '임박 식재료를 불러오지 못했어요.');
  }

  return data;
}

export async function deleteMyIngredients(ingredientIds: Array<string | number> | string | number) {
  const ids = Array.isArray(ingredientIds) ? ingredientIds : [ingredientIds];
  const response = await fetch(`${getApiBaseUrl()}/ingredient/all/my`, {
    method: 'DELETE',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ ingredientIds: ids }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 삭제하지 못했어요.');
  }

  return data;
}

export async function updateMyIngredient({
  userIngredientId,
  ingredient,
  purchaseDate,
  expirationDate,
  status,
}: {
  userIngredientId: string | number;
  ingredient: string;
  purchaseDate?: string;
  expirationDate?: string;
  status?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/all/my/${encodeURIComponent(String(userIngredientId))}`, {
    method: 'PUT',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({
      ingredient,
      purchaseDate: purchaseDate || null,
      expirationDate: expirationDate || null,
      status,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 수정하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function createIngredients(ingredients: Array<{ ingredient: string; purchaseDate?: string; expirationDate: string; category: string }>) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/input`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify(ingredients),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 저장하지 못했어요.');
  }

  return data;
}

export async function createIngredient(input: { ingredient: string; purchaseDate?: string; expirationDate: string; category: string }) {
  return createIngredients([input]);
}

export async function searchIngredients(keyword: string) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 검색하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function getIngredientsByCategory(category: string) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/category?category=${encodeURIComponent(category)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '카테고리 식재료를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function predictIngredientExpirations({
  purchaseDate,
  ingredients,
}: {
  purchaseDate: string;
  ingredients: string[];
}) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/prediction`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ purchaseDate, ingredients }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '소비기한을 예측하지 못했어요.');
  }

  return data;
}

export async function saveFirstLoginIngredients({
  allergies = [],
  preferIngredients = [],
  dispreferIngredients = [],
}: {
  allergies?: string[];
  preferIngredients?: string[];
  dispreferIngredients?: string[];
}) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/first/login`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({
      allergies,
      prefer_ingredients: preferIngredients,
      disprefer_ingredients: dispreferIngredients,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '초기 설정을 저장하지 못했어요.');
  }

  return data;
}

export async function getPreferenceSettings() {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/preferences`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '맞춤 설정을 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function updateAllergies({ oldAllergy = [], newAllergy = [] }: { oldAllergy?: string[]; newAllergy?: string[] }) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/allergy`, {
    method: 'PUT',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ oldallergy: oldAllergy, newallergy: newAllergy }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '알레르기 설정을 저장하지 못했어요.');
  }

  return data;
}

export async function updatePreferenceIngredients({
  type,
  oldPrefer = [],
  newPrefer = [],
}: {
  type: 'prefer' | 'disprefer' | string;
  oldPrefer?: string[];
  newPrefer?: string[];
}) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/prefer`, {
    method: 'PUT',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ type, oldPrefer, newPrefer }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '선호 설정을 저장하지 못했어요.');
  }

  return data;
}

export async function fetchRecipes({
  category,
  keyword,
  page = 0,
  size = 20,
}: {
  category?: string;
  keyword?: string;
  page?: number;
  size?: number;
}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (category != null && category.length > 0 && category !== '전체') {
    params.set('category', category);
  }

  if (keyword != null && keyword.length > 0) {
    params.set('keyword', keyword);
  }

  const response = await fetch(`${getApiBaseUrl()}/recipe?${params.toString()}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '레시피를 불러오지 못했어요.');
  }

  return data;
}

export async function getRecipeDetail(recipeId: string) {
  const response = await fetch(`${getApiBaseUrl()}/recipe/${encodeURIComponent(recipeId)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '레시피 상세를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function requestRecommendations({
  accessToken,
  ingredients,
  candidates = [],
  allergies = [],
  preferIngredients = [],
  dispreferIngredients = [],
  ingredientRatio = 0.5,
}: {
  accessToken?: string | null;
  ingredients: string[];
  candidates?: Array<{ recipe_id?: string; recipeId?: string; title: string; ingredients: string[] }>;
  allergies?: string[];
  preferIngredients?: string[];
  dispreferIngredients?: string[];
  ingredientRatio?: number;
}) {
  const response = await fetch(`${getApiBaseUrl()}/recipe/recommendations`, {
    method: 'POST',
    headers: buildHeaders({ json: true, accessToken }),
    body: JSON.stringify({
      userIngredient: {
        ingredients,
        allergies,
        preferIngredients,
        dispreferIngredients,
        IngredientRatio: ingredientRatio,
      },
      candidates,
    }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '레시피를 추천하지 못했어요.');
  }

  return data;
}

export async function fetchSharePosts({
  radiusKm,
  page = 0,
  size = 10,
  latitude,
  longitude,
}: {
  radiusKm: number;
  page?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
}) {
  const params = new URLSearchParams({
    radiusKm: String(radiusKm),
    page: String(page),
    size: String(size),
  });
  if (latitude != null && longitude != null) {
    params.set('latitude', String(latitude));
    params.set('longitude', String(longitude));
  }
  const response = await fetch(`${getApiBaseUrl()}/share/list?${params.toString()}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 게시글을 불러오지 못했어요.');
  }

  return data?.result ?? data;
}

export async function hideSharePost(postId: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/${encodeURIComponent(postId)}/hide`, {
    method: 'POST',
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글을 숨기지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function unhideSharePost(postId: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/${encodeURIComponent(postId)}/hide`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글 숨김을 해제하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function fetchHiddenSharePosts() {
  const response = await fetch(`${getApiBaseUrl()}/share/hidden/list`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '숨긴 나눔글을 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? [];
}

export async function updateShareLocation({
  latitude,
  longitude,
  verificationLatitude,
  verificationLongitude,
}: {
  latitude: number;
  longitude: number;
  verificationLatitude?: number;
  verificationLongitude?: number;
}) {
  const response = await fetch(`${getApiBaseUrl()}/share/location`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ latitude, longitude, verificationLatitude, verificationLongitude }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 위치를 저장하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function getMyShareLocation() {
  const response = await fetch(`${getApiBaseUrl()}/share/location/me`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 위치를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function searchShareLocations(query: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/location/search?query=${encodeURIComponent(query)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '주소를 검색하지 못했어요.');
  }

  return data?.result ?? data?.data ?? [];
}

export async function getShareDetail(postId: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/list/one?postId=${encodeURIComponent(postId)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 상세를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

const appendDataUriImage = async (formData: FormData, dataUri?: string | null) => {
  const trimmed = String(dataUri ?? '').trim();
  if (trimmed.length === 0) {
    return;
  }
  const normalized = trimmed.startsWith('data:') ? trimmed : /^[A-Za-z0-9+/=]+$/.test(trimmed) ? `data:image/jpeg;base64,${trimmed}` : '';
  if (!normalized) {
    return;
  }
  const response = await fetch(normalized);
  formData.append('image', await response.blob(), 'share.jpg');
};

export async function createSharePost({
  title,
  ingredientName,
  content,
  category,
  expirationDate,
  imageUri,
}: {
  title: string;
  ingredientName: string;
  content: string;
  category: string;
  expirationDate: string;
  imageUri?: string | null;
}) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('ingredientName', ingredientName);
  formData.append('content', content);
  formData.append('category', category);
  formData.append('expirationDate', expirationDate);
  await appendDataUriImage(formData, imageUri);

  const response = await fetch(`${getApiBaseUrl()}/share/posting`, { method: 'POST', headers: buildHeaders(), body: formData });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글을 저장하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function updateSharePost(input: {
  postId: string;
  title: string;
  ingredientName: string;
  content: string;
  category: string;
  expirationDate: string;
  imageUri?: string | null;
}) {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('ingredientName', input.ingredientName);
  formData.append('content', input.content);
  formData.append('category', input.category);
  formData.append('expirationDate', input.expirationDate);
  await appendDataUriImage(formData, input.imageUri);

  const response = await fetch(`${getApiBaseUrl()}/share/list/my?postId=${encodeURIComponent(input.postId)}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: formData,
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글을 수정하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function deleteMySharePost(postId: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/list/my?postId=${encodeURIComponent(postId)}`, { method: 'DELETE', headers: buildHeaders() });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글을 삭제하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function completeShareSuccession({ postId, chatRoomId, type }: { postId: string; chatRoomId: string; type: string }) {
  const response = await fetch(`${getApiBaseUrl()}/share/posting/succession`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ postId, chatRoomId, type }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 완료 처리에 실패했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function reportSharePost({ postId, title, content }: { postId: string; title: string; content: string }) {
  const response = await fetch(`${getApiBaseUrl()}/share/report?postId=${encodeURIComponent(postId)}`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ title, content }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '나눔 글을 신고하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function getMyShareList(type = '나눔 중') {
  const response = await fetch(`${getApiBaseUrl()}/share/list/my?type=${encodeURIComponent(type)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '내 나눔 목록을 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? [];
}

export async function fetchUserSharePosts(sellerId: string) {
  const response = await fetch(`${getApiBaseUrl()}/share/users/${encodeURIComponent(sellerId)}/list`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '작성자의 나눔글을 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? [];
}

export async function fetchChats({
  type,
  page = 0,
  size = 20,
}: {
  type: 'all' | 'take' | 'give';
  page?: number;
  size?: number;
}) {
  const params = new URLSearchParams({
    type,
    page: String(page),
    size: String(size),
  });
  const response = await fetch(`${getApiBaseUrl()}/chat/list/page?${params.toString()}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅 목록을 불러오지 못했어요.');
  }

  return data?.result ?? data;
}

export async function startChat(postId: string) {
  const response = await fetch(`${getApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ postId }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅을 시작하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function getChatMessages(chatRoomId: string) {
  const response = await fetch(`${getApiBaseUrl()}/chat/reception?chatRoomId=${encodeURIComponent(chatRoomId)}`, {
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅 메시지를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? [];
}

export async function getChatMessagesPage({ chatRoomId, page = 0, size = 30 }: { chatRoomId: string; page?: number; size?: number }) {
  const response = await fetch(`${getApiBaseUrl()}/chat/reception/page?chatRoomId=${encodeURIComponent(chatRoomId)}&page=${page}&size=${size}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅 메시지를 불러오지 못했어요.');
  }

  return data?.result ?? data?.data ?? { items: [], totalCount: 0, page, size, hasNext: false };
}

export async function sendChatMessage({ chatRoomId, content }: { chatRoomId: string; content: string }) {
  const response = await fetch(`${getApiBaseUrl()}/chat/sending`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ chatRoomId, content }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '메시지를 보내지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function markChatAsRead(chatRoomId: string) {
  const response = await fetch(`${getApiBaseUrl()}/chat/read`, {
    method: 'PATCH',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ chatRoomId }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '읽음 처리에 실패했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function reportChat({ chatRoomId, messageId, reason, content }: { chatRoomId: string; messageId?: string; reason?: string; content?: string }) {
  const response = await fetch(`${getApiBaseUrl()}/chat/report`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ chatRoomId, messageId, reason, content }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅을 신고하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function blockChat(chatRoomId: string) {
  const response = await fetch(`${getApiBaseUrl()}/chat/block`, {
    method: 'POST',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ chatRoomId }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅 상대를 차단하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function deleteChatRoom(chatRoomId: string) {
  const response = await fetch(`${getApiBaseUrl()}/chat/rooms/${encodeURIComponent(chatRoomId)}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅방을 삭제하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function deleteChatRooms(chatRoomIds: string[]) {
  const response = await fetch(`${getApiBaseUrl()}/chat/rooms`, {
    method: 'DELETE',
    headers: buildHeaders({ json: true }),
    body: JSON.stringify({ chatRoomIds }),
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '채팅방을 삭제하지 못했어요.');
  }

  return data?.result ?? data?.data ?? data;
}

export async function deleteAccount() {
  const response = await fetch(`${getApiBaseUrl()}/auth/deletion`, { method: 'DELETE', headers: buildHeaders() });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '회원 탈퇴를 처리하지 못했어요.');
  }

  return data;
}
