import { useEffect, useMemo, useRef, useState } from 'react';
import { appLogin, openCamera } from '@apps-in-toss/web-framework';
import { Button, FixedBottomCTA } from '@toss/tds-mobile';
import {
  countExpiringSoon,
  filterAndSortIngredients,
  rankRecipeCandidates,
} from './domain/fridge';
import {
  analyzeReceiptImage,
  exchangeTossLogin,
  fetchMyIngredients,
  requestRecommendations,
} from './services/miniappApi';

const sampleIngredients = [
  { id: 'sample-1', name: '계란', category: '정육/계란', dday: 'D-1', quantity: 1 },
  { id: 'sample-2', name: '김치', category: '가공식품', dday: 'D-2', quantity: 1 },
  { id: 'sample-3', name: '양파', category: '채소/과일', dday: 'D-5', quantity: 2 },
];

const sampleCandidates = [
  { recipeId: 'recipe-1', title: '김치계란볶음밥', ingredients: ['김치', '계란', '양파', '밥'] },
  { recipeId: 'recipe-2', title: '양파계란국', ingredients: ['양파', '계란', '대파'] },
  { recipeId: 'recipe-3', title: '오이무침', ingredients: ['오이', '고춧가루'] },
];

type Ingredient = {
  id: string;
  name: string;
  category: string;
  dday: string;
  quantity?: number;
};

type Recommendation = {
  recipeId: string;
  title: string;
  ingredients: string[];
  score: number;
  matchDetails: {
    matched: string[];
    missing: string[];
  };
};

const rankCandidates = rankRecipeCandidates as unknown as (input: {
  ingredients: string[];
  preferIngredients?: string[];
  dispreferIngredients?: string[];
  ingredientRatio: number;
  candidates: typeof sampleCandidates;
}) => Recommendation[];

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="pill">{label}</span>;
}

function getErrorMessage(error: unknown, fallback: string) {
  console.error(error);
  return error instanceof Error ? error.message : fallback;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState('토스 로그인을 확인하고 있어요.');
  const [receiptItems, setReceiptItems] = useState<Ingredient[]>([]);
  const [fridgeItems, setFridgeItems] = useState<Ingredient[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    rankCandidates({
      ingredients: sampleIngredients.map(item => item.name),
      ingredientRatio: 0.5,
      candidates: sampleCandidates,
    })
  );
  const [statusMessage, setStatusMessage] = useState('영수증을 촬영하면 냉장고와 추천 결과를 바로 확인할 수 있어요.');
  const [busy, setBusy] = useState(false);
  const loginRequestedRef = useRef(false);

  const visibleFridgeItems = useMemo(
    () =>
      filterAndSortIngredients(fridgeItems.length > 0 ? fridgeItems : sampleIngredients, {
        sortType: '날짜순(오름차순)',
      }),
    [fridgeItems]
  );
  const expiringCount = countExpiringSoon(visibleFridgeItems);

  const handleTossLogin = async () => {
    setBusy(true);
    try {
      setLoginMessage('토스 로그인이 필요하면 인증 화면으로 이동해요.');
      const { authorizationCode, referrer } = await appLogin();
      const exchanged = await exchangeTossLogin({ authorizationCode, referrer });
      setAccessToken(exchanged.accessToken);
      setRefreshToken(exchanged.refreshToken);
      setLoginMessage('토스 로그인으로 시작할 준비가 끝났어요.');
    } catch (error) {
      setLoginMessage(`토스 로그인을 다시 시도해 주세요. ${getErrorMessage(error, '')}`.trim());
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loginRequestedRef.current) {
      return;
    }
    loginRequestedRef.current = true;
    void handleTossLogin();
  }, []);

  const handleAnalyzeReceipt = async () => {
    setBusy(true);
    try {
      const image = await openCamera({ base64: true, maxWidth: 1280 });
      const analyzed = await analyzeReceiptImage(image);
      const foodItems = analyzed?.result?.food_items ?? analyzed?.data?.food_items ?? [];
      const mapped = foodItems.map((item: any, index: number) => ({
        id: `receipt-${index}`,
        name: item.product_name ?? item.name ?? '인식 품목',
        category: item.category ?? '기타',
        dday: 'D-?',
        quantity: item.quantity ?? 1,
      }));
      setReceiptItems(mapped);
      setFridgeItems(mapped);
      setStatusMessage('영수증에서 찾은 식재료를 냉장고 후보로 불러왔어요. 저장하기 전에 확인해 주세요.');
    } catch (error) {
      setReceiptItems(sampleIngredients);
      setFridgeItems(sampleIngredients);
      setStatusMessage(`영수증을 불러오지 못했어요. ${getErrorMessage(error, '샘플 식재료로 흐름을 보여드릴게요.')}`);
    } finally {
      setBusy(false);
    }
  };

  const handleLoadFridge = async () => {
    setBusy(true);
    try {
      const data = await fetchMyIngredients(accessToken);
      const result = data?.result ?? data?.data ?? [];
      const mapped = result.map((item: any, index: number) => ({
        id: String(item.id ?? item.ingredientId ?? index),
        name: item.ingredient ?? item.name ?? item.productName ?? '식재료',
        category: item.category ?? '기타',
        dday: item.dDay ?? 'D-?',
        quantity: item.quantity ?? 1,
      }));
      setFridgeItems(mapped);
      setStatusMessage('내 냉장고 식재료를 불러왔어요.');
    } catch (error) {
      setFridgeItems(sampleIngredients);
      setStatusMessage(`냉장고를 불러오지 못했어요. ${getErrorMessage(error, '샘플 식재료로 흐름을 보여드릴게요.')}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRecommend = async () => {
    setBusy(true);
    const currentIngredients = visibleFridgeItems.map(item => item.name);
    const candidates = sampleCandidates.map(item => ({
      recipe_id: item.recipeId,
      title: item.title,
      ingredients: item.ingredients,
    }));

    try {
      const data = await requestRecommendations({
        accessToken,
        ingredients: currentIngredients,
        candidates,
      });
      const serverRecommendations = data?.data?.recommendations ?? data?.result?.recommendations ?? [];
      setRecommendations(
        serverRecommendations.map((item: any) => ({
          recipeId: item.recipeId ?? item.recipe_id,
          title: item.title,
          ingredients: [],
          score: item.score ?? 0,
          matchDetails: {
            matched: item.match_details?.matched ?? [],
            missing: item.match_details?.missing ?? [],
          },
        })) as Recommendation[]
      );
      setStatusMessage('지금 가진 재료와 잘 맞는 레시피를 먼저 보여드려요.');
    } catch (error) {
      setRecommendations(
        rankCandidates({
          ingredients: currentIngredients,
          ingredientRatio: 0.5,
          candidates: sampleCandidates,
        })
      );
      setStatusMessage(`추천 결과를 불러오지 못했어요. ${getErrorMessage(error, '샘플 추천을 보여드릴게요.')}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="badge">토스 미니앱</p>
        <h1>물무물무</h1>
        <p>
          영수증을 촬영하고, 냉장고에 있는 식재료로 만들 수 있는 레시피를 확인해요.
        </p>
      </section>

      <Card eyebrow="로그인" title="토스 로그인으로 시작해요">
        <p className="body-text">{loginMessage}</p>
        <p className="body-text">
          미니앱에 들어오면 토스 로그인을 먼저 확인해요. 다시 필요할 때만 아래 버튼을 눌러 주세요.
        </p>
        {accessToken ? (
          <p className="token-state">로그인 상태를 확인했어요{refreshToken ? '' : '.'}</p>
        ) : null}
        <Button display="block" loading={busy} onClick={handleTossLogin}>
          토스 로그인 다시 시도
        </Button>
      </Card>

      <Card eyebrow="영수증" title="영수증에서 식재료를 찾아요">
        <p className="body-text">카메라로 영수증을 촬영하면 품목, 카테고리, 수량을 확인할 수 있어요.</p>
        <Button display="block" color="dark" variant="weak" loading={busy} onClick={handleAnalyzeReceipt}>
          영수증 다시 촬영하기
        </Button>
        <div className="list">
          {(receiptItems.length > 0 ? receiptItems : sampleIngredients).map(item => (
            <div className="list-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </div>
              <Pill label={`${item.quantity ?? 1}개`} />
            </div>
          ))}
        </div>
      </Card>

      <Card eyebrow="냉장고" title={`내 냉장고 · 임박 ${expiringCount}개`}>
        <div className="action-row">
          <Button display="full" color="primary" variant="weak" loading={busy} onClick={handleLoadFridge}>
            내 식재료 불러오기
          </Button>
          <Button display="full" loading={busy} onClick={handleRecommend}>
            레시피 추천
          </Button>
        </div>
        <div className="chips">
          {visibleFridgeItems.map(item => (
            <Pill key={item.id} label={`${item.name} ${item.dday}`} />
          ))}
        </div>
      </Card>

      <Card eyebrow="추천" title="지금 만들기 좋은 레시피">
        <p className="body-text">{statusMessage}</p>
        <div className="list">
          {recommendations.map(item => (
            <article className="recipe-card" key={item.recipeId}>
              <div>
                <strong>{item.title}</strong>
                <span>점수 {Math.round(item.score * 100)}점</span>
              </div>
              <p>맞는 재료: {item.matchDetails.matched.join(', ') || '없음'}</p>
              <p>부족한 재료: {item.matchDetails.missing.join(', ') || '없음'}</p>
            </article>
          ))}
        </div>
      </Card>
      <FixedBottomCTA
        loading={busy}
        onClick={handleAnalyzeReceipt}
        topAccessory={<p className="bottom-cta-help">영수증을 촬영해 냉장고 후보를 만들어요.</p>}
      >
        영수증 촬영하고 식재료 찾기
      </FixedBottomCTA>
    </main>
  );
}
