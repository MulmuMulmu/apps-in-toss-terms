import { normalizeTossLoginExchangeResponse } from '../domain/auth';

const TOSS_LOGIN_EXCHANGE_PATH = '/auth/toss/login';

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredUrl != null && configuredUrl.length > 0) {
    return configuredUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8080';
  }

  throw new Error('서비스 주소를 확인하고 다시 시도해 주세요.');
}

type TossReferrer = 'DEFAULT' | 'SANDBOX';

type TossLoginExchangePayload = {
  authorizationCode: string;
  referrer: TossReferrer;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  return text.length > 0 ? JSON.parse(text) : {};
};

const imageToBlob = async (image: { dataUri?: string; uri?: string }) => {
  const uri = image.uri ?? image.dataUri ?? '';
  const dataUri = uri.startsWith('data:') ? uri : `data:image/jpeg;base64,${uri}`;
  const response = await fetch(dataUri);
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

export async function analyzeReceiptImage(image: { dataUri?: string; uri?: string }) {
  const formData = new FormData();
  formData.append('image', await imageToBlob(image), 'receipt.jpg');

  const response = await fetch(`${getApiBaseUrl()}/ingredient/analyze`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '영수증을 분석하지 못했어요.');
  }

  return data;
}

export async function fetchMyIngredients(accessToken?: string | null) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/all/my`, {
    method: 'GET',
    headers: accessToken ? { Authorization: accessToken } : undefined,
  });
  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result ?? '식재료를 불러오지 못했어요.');
  }

  return data;
}

export async function requestRecommendations({
  accessToken,
  ingredients,
  candidates,
}: {
  accessToken?: string | null;
  ingredients: string[];
  candidates: Array<{ recipe_id: string; title: string; ingredients: string[] }>;
}) {
  const response = await fetch(`${getApiBaseUrl()}/ingredient/recommondation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: accessToken } : {}),
    },
    body: JSON.stringify({
      userIngredient: {
        ingredients,
        preferIngredients: [],
        dispreferIngredients: [],
        IngredientRatio: 0.5,
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
