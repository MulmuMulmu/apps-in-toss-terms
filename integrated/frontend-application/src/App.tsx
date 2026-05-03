import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Accuracy, TossAds, appLogin, fetchAlbumPhotos, getCurrentLocation, graniteEvent, openCamera } from '@apps-in-toss/web-framework';
import { BottomSheet, Button, ConfirmDialog, ListRow, SegmentedControl, TextArea, TextField, WheelDatePicker } from '@toss/tds-mobile';
import {
  countExpiringSoon,
} from './domain/fridge';
import {
  analyzeReceiptImage,
  blockChat,
  completeShareSuccession,
  createIngredients,
  createSharePost,
  deleteAccount,
  deleteChatRoom,
  deleteChatRooms,
  deleteMyIngredients,
  deleteMySharePost,
  exchangeTossLogin,
  fetchChats,
  fetchHiddenSharePosts,
  fetchUserSharePosts,
  fetchMyIngredients,
  fetchRecipes,
  fetchSharePosts,
  getChatMessagesPage,
  getIngredientsByCategory,
  getMyIngredientsPage,
  getMyProfile,
  getMyShareList,
  getMyShareLocation,
  getPreferenceSettings,
  getRecipeDetail,
  getShareDetail,
  hideSharePost,
  loginWithLocalBackend,
  markChatAsRead,
  predictIngredientExpirations,
  requestRecommendations,
  reportChat,
  reportSharePost,
  saveFirstLoginIngredients,
  searchIngredients,
  searchShareLocations,
  sendChatMessage,
  setMiniappAccessToken,
  startChat,
  updateAllergies,
  updateMyIngredient,
  updateNickname,
  updatePreferenceIngredients,
  updateProfilePicture,
  updateShareLocation,
  updateSharePost,
  unhideSharePost,
} from './services/miniappApi';
import logoUrl from '../assets/logo.png';
import fridgeIcon from '../assets/fridge.png';
import marketIcon from '../assets/market.png';
import recipeIcon from '../assets/recipe.png';
import chatIcon from '../assets/chat.png';
import infoIcon from '../assets/info.png';
import dairyIcon from '../assets/category-icons/dairy.png';
import meatEggIcon from '../assets/category-icons/meat-egg.png';
import otherIcon from '../assets/category-icons/other.png';
import processedFoodIcon from '../assets/category-icons/processed-food.png';
import riceNoodleBreadIcon from '../assets/category-icons/rice-noodle-bread.png';
import sauceIcon from '../assets/category-icons/sauce-seasoning-oil.png';
import seafoodIcon from '../assets/category-icons/seafood.png';
import vegetableFruitIcon from '../assets/category-icons/vegetable-fruit.png';
import dessertIcon from '../assets/recipe-category-icons/dessert.png';
import kimchiIcon from '../assets/recipe-category-icons/kimchi.png';
import mainDishIcon from '../assets/recipe-category-icons/main-dish.png';
import namulIcon from '../assets/recipe-category-icons/namul.png';
import noodleIcon from '../assets/recipe-category-icons/noodle-dumpling.png';
import riceIcon from '../assets/recipe-category-icons/rice.png';
import sideDishIcon from '../assets/recipe-category-icons/side-dish.png';
import soupIcon from '../assets/recipe-category-icons/soup.png';
import stewIcon from '../assets/recipe-category-icons/stew-hotpot.png';
import administrativeRegions from './data/administrativeRegions.json';

type RootScreen = 'splash' | 'allergy' | 'prefer' | 'dislike' | 'profileSetup' | 'main';
type TabKey = 'fridge' | 'market' | 'recipe' | 'chat' | 'info';
type ViewRoute =
  | { view: 'tabs' }
  | { view: 'directInput'; initialItems?: any[]; purchaseDate?: string }
  | { view: 'receiptCamera' }
  | { view: 'receiptGallery' }
  | { view: 'receiptLoading'; image: { dataUri?: string; uri?: string } }
  | { view: 'receiptResult'; items: Ingredient[] }
  | { view: 'recipeRecommend' }
  | { view: 'recipeResult'; recipes?: Recipe[]; selectedIngredients?: string[] }
  | { view: 'recipeDetail'; recipe: Recipe; selectedIngredients?: string[] }
  | { view: 'locationSetting' }
  | { view: 'marketWrite'; post?: SharePost; returnTo?: 'myPosts' }
  | { view: 'marketDetail'; post: SharePost }
  | { view: 'authorPosts'; sellerId: string; sellerName: string; sellerProfileImageUrl?: string }
  | { view: 'myPosts' }
  | { view: 'myShareHistory' }
  | { view: 'hiddenSharePosts' }
  | { view: 'chatRoom'; chat: Chat; post?: SharePost };

type Ingredient = {
  id: string;
  userIngredientId?: string | number | null;
  name: string;
  category: string;
  dday: string;
  date?: string;
  purchaseDate?: string;
  status?: string;
  quantity?: number;
};

type Recipe = {
  recipeId: string;
  title: string;
  category: string;
  ingredients: string[];
  imageUrl?: string;
  score?: number;
  hasAll?: boolean;
  matchDetails?: {
    matched: string[];
    missing: string[];
  };
};

type SharePost = {
  id: string;
  postId?: string;
  title: string;
  food: string;
  category: string;
  neighborhood: string;
  distance: string;
  timeAgo: string;
  description: string;
  imageUrl?: string;
  authorName?: string;
  sellerId?: string;
  sellerName?: string;
  sellerProfileImageUrl?: string;
  expirationDate?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
};

type BrowseLocation = {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
};

type Chat = {
  id: string;
  chatRoomId?: string;
  postId?: string;
  opponentId?: string;
  name: string;
  lastMessage: string;
  time: string;
  type: 'all' | 'take' | 'give';
};

type SiRegion = { code: string; name: string };
type GuRegion = { code: string; siCode: string; name: string };
type DongRegion = { code: string; siCode: string; guCode: string; name: string; fullName: string };

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'fridge', label: '내 식자재', icon: fridgeIcon },
  { key: 'market', label: '나눔', icon: marketIcon },
  { key: 'recipe', label: '레시피', icon: recipeIcon },
  { key: 'chat', label: '채팅', icon: chatIcon },
  { key: 'info', label: '내 정보', icon: infoIcon },
];

const ingredientCategories = ['전체', '정육/계란', '해산물', '채소/과일', '유제품', '쌀/면/빵', '소스/조미료/오일', '가공식품', '기타'];
const recipeCategories = ['반찬', '후식/디저트', '일품요리', '밥류', '국/탕류', '김치류', '면/만두류', '나물/무침류', '찌개/전골류'];
const recommendTabs = ['전체', '임박한 재료'];
const recipePageSize = 10;
const recipeResultPageSize = 10;
const listPageSize = 10;
const formatRadiusLabel = (radiusKm: number) => (radiusKm < 1 ? `${Math.round(radiusKm * 1000)}m` : `${radiusKm}km`);
const setupAllergies = ['계란', '메밀', '땅콩', '대두', '밀', '고등어', '게', '새우', '돼지고기', '우유', '복숭아', '토마토'];
const setupPrefer = ['소고기', '돼지고기', '닭고기', '새우', '김치', '두부', '양파', '대파'];
const setupDislikes = ['오이', '고수', '가지', '당근', '양파', '대파', '마늘', '생강'];
const radiusOptions = [0.5, 1, 3, 5, 10];
const shareAllowedCategories = ['채소/과일', '쌀/면/빵', '소스/조미료/오일', '가공식품'];
const shareBlockedCategories = ['정육/계란', '해산물', '유제품', '건강기능식품', '의약품', '주류'];
const shareBlockedKeywords = ['술', '맥주', '소주', '와인', '막걸리', '담배', '전자담배', '약', '의약품', '감기약', '진통제', '연고', '한약', '건강기능식품', '건기식', '영양제', '비타민', '홍삼', '분유', '이유식', '해외직구', '직구', '개봉한', '개봉됨', '뜯은', '소분', '조리', '반찬', '수제'];
const shareSafetyChecklist = [
  '소비기한이 지났거나 상태가 변한 식품이 아닙니다.',
  '개봉, 소분, 직접 조리한 음식이 아닙니다.',
  '주류, 의약품, 건강기능식품, 해외직구 식품이 아닙니다.',
  '냉장/냉동 보관이 필요한 품목은 나눔하지 않습니다.',
  '알레르기 유발 가능성이나 특이사항을 숨기지 않습니다.',
];
const REPORT_REASONS = ['부적절한 대화', '거래 약속 불이행', '스팸/광고', '기타'];
const SHARE_REPORT_REASONS = ['금지 품목', '식품 안전 문제', '허위 정보', '스팸/광고', '기타'];
const setupStorageKey = 'mulmumulmu:setup-preferences';
const setupCompleteStorageKey = 'mulmumulmu:setup-complete';
const profileStorageKey = 'mulmumulmu:profile';
const LEGACY_APPS_IN_TOSS_BANNER_AD_GROUP_ID = 'ait.v2.live.8fd5ab56c28d4873';
const featurePathByTab: Record<TabKey, string> = {
  fridge: '/home',
  market: '/share',
  recipe: '/recipe',
  chat: '/chat',
  info: '/my',
};
const tabByFeaturePath: Record<string, TabKey> = {
  '/': 'fridge',
  '/home': 'fridge',
  '/share': 'market',
  '/market': 'market',
  '/recipe': 'recipe',
  '/chat': 'chat',
  '/my': 'info',
};
const koreanRegionCollator = new Intl.Collator('ko-KR');
const sortRegionsByName = <T extends { name: string; code: string }>(regions: T[]) => (
  [...regions].sort((left, right) => {
    const nameOrder = koreanRegionCollator.compare(left.name, right.name);
    return nameOrder === 0 ? left.code.localeCompare(right.code) : nameOrder;
  })
);
const activeSiList = sortRegionsByName(administrativeRegions.si as SiRegion[]);
const activeGuList = sortRegionsByName(administrativeRegions.gu as GuRegion[]);
const activeDongList = sortRegionsByName(administrativeRegions.dong as DongRegion[]);
const defaultMapCenter = { latitude: 37.5665, longitude: 126.9780 };
const LEGACY_KAKAO_MAP_JAVASCRIPT_KEY = '6203781008cd1b44c6276736d0be9cac';

const getKakaoMapJavascriptKey = () => {
  const configured = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY as string | undefined;
  return configured?.trim() || LEGACY_KAKAO_MAP_JAVASCRIPT_KEY;
};

const getAppsInTossBannerAdGroupId = () => {
  const configured = import.meta.env.VITE_APPS_IN_TOSS_BANNER_AD_GROUP_ID as string | undefined;
  return configured?.trim() || LEGACY_APPS_IN_TOSS_BANNER_AD_GROUP_ID;
};

const readStoredSetupPreferences = () => {
  try {
    const stored = window.localStorage.getItem(setupStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      allergies: Array.isArray(parsed?.allergies) ? parsed.allergies : [],
      prefers: Array.isArray(parsed?.prefers) ? parsed.prefers : [],
      dislikes: Array.isArray(parsed?.dislikes) ? parsed.dislikes : [],
    };
  } catch {
    return null;
  }
};

const normalizeStringArray = (value: unknown): string[] => (
  Array.isArray(value)
    ? value.map(item => String(item ?? '').trim()).filter(Boolean)
    : []
);

const normalizePreferenceSettings = (payload: any) => ({
  allergies: normalizeStringArray(payload?.allergies ?? payload?.allergyIngredients ?? payload?.allergy_ingredients),
  prefers: normalizeStringArray(payload?.preferIngredients ?? payload?.prefer_ingredients ?? payload?.prefers),
  dislikes: normalizeStringArray(payload?.dispreferIngredients ?? payload?.disprefer_ingredients ?? payload?.dislikes),
});

const hasAnySetupPreference = (payload: { allergies: string[]; prefers: string[]; dislikes: string[] }) => (
  payload.allergies.length > 0 || payload.prefers.length > 0 || payload.dislikes.length > 0
);

const readStoredSetupCompleted = () => {
  try {
    return window.localStorage.getItem(setupCompleteStorageKey) === 'true';
  } catch {
    return false;
  }
};

const markStoredSetupCompleted = () => {
  try {
    window.localStorage.setItem(setupCompleteStorageKey, 'true');
  } catch {
    // Local persistence is only a fallback for first-entry gating.
  }
};

const writeStoredSetupPreferences = (payload: { allergies: string[]; prefers: string[]; dislikes: string[] }) => {
  try {
    window.localStorage.setItem(setupStorageKey, JSON.stringify(payload));
  } catch {
    // Local persistence is only a fallback for edit hydration.
  }
};

const clearStoredUserState = () => {
  try {
    window.localStorage.removeItem(setupStorageKey);
    window.localStorage.removeItem(setupCompleteStorageKey);
    window.localStorage.removeItem(profileStorageKey);
  } catch {
    // Storage can be unavailable in restricted previews.
  }
};

const readStoredProfile = () => {
  try {
    const stored = window.localStorage.getItem(profileStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      nickname: typeof parsed?.nickname === 'string' ? parsed.nickname : '물무',
      profileImage: typeof parsed?.profileImage === 'string' ? parsed.profileImage : '',
    };
  } catch {
    return null;
  }
};

const writeStoredProfile = (payload: { nickname: string; profileImage: string }) => {
  try {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(payload));
  } catch {
    // Backend profile endpoints are not exposed in this codebase yet.
  }
};

const categoryVisuals: Record<string, { image: string; color: string }> = {
  '정육/계란': { image: meatEggIcon, color: '#FFF3E0' },
  해산물: { image: seafoodIcon, color: '#E6F4FF' },
  '채소/과일': { image: vegetableFruitIcon, color: '#EAF8EF' },
  유제품: { image: dairyIcon, color: '#F2F4FF' },
  '쌀/면/빵': { image: riceNoodleBreadIcon, color: '#FFF8E1' },
  '소스/조미료/오일': { image: sauceIcon, color: '#FFF0F0' },
  가공식품: { image: processedFoodIcon, color: '#F4F0FF' },
  기타: { image: otherIcon, color: '#F2F4F6' },
};

const recipeVisuals: Record<string, { image: string; color: string }> = {
  반찬: { image: sideDishIcon, color: '#FFF0F0' },
  '후식/디저트': { image: dessertIcon, color: '#FFF3E8' },
  일품요리: { image: mainDishIcon, color: '#F0F6FF' },
  밥류: { image: riceIcon, color: '#FFF8E1' },
  '국/탕류': { image: soupIcon, color: '#EAF7FF' },
  김치류: { image: kimchiIcon, color: '#FFECEC' },
  '면/만두류': { image: noodleIcon, color: '#F4F1FF' },
  '나물/무침류': { image: namulIcon, color: '#EAF8EF' },
  '찌개/전골류': { image: stewIcon, color: '#FFF3E0' },
};

const getDdayNumber = (dday: string) => {
  const text = String(dday ?? '').trim();
  if (text === 'D-Day') return 0;
  const labeled = text.match(/^D([+-])(\d+)$/);
  if (labeled) {
    const value = Number.parseInt(labeled[2] ?? '', 10);
    if (Number.isNaN(value)) return Number.MAX_SAFE_INTEGER;
    return labeled[1] === '+' ? -value : value;
  }
  const value = Number.parseInt(text.replace(/^D-/, ''), 10);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
};

const getDdayFromDate = (expirationDate?: string | null) => {
  const expiration = parseDateInputValue(expirationDate);
  if (!expiration) return undefined;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfExpiration = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate());
  return Math.round((startOfExpiration.getTime() - startOfToday.getTime()) / 86400000);
};

const formatDdayLabel = (value?: unknown, expirationDate?: string | null) => {
  const raw = String(value ?? '').trim();
  let day: number | undefined;
  if (raw) {
    if (raw === 'D-Day') {
      day = 0;
    } else {
      const labeled = raw.match(/^D([+-])(\d+)$/);
      if (labeled) {
        const parsed = Number.parseInt(labeled[2] ?? '', 10);
        day = labeled[1] === '+' ? -parsed : parsed;
      } else {
        const parsed = Number.parseInt(raw.replace(/^D-/, ''), 10);
        day = Number.isNaN(parsed) ? undefined : parsed;
      }
    }
  }
  day ??= getDdayFromDate(expirationDate);
  if (day == null || Number.isNaN(day)) return 'D-?';
  if (day === 0) return 'D-Day';
  return day < 0 ? `D+${Math.abs(day)}` : `D-${day}`;
};

const getDdayClass = (dday: string) => {
  const day = getDdayNumber(dday);
  if (day <= 3) return 'danger';
  if (day <= 7) return 'warning';
  return 'primary';
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message) return fallback;
  if (/failed to fetch|networkerror|load failed|json|unexpected token|unexpected end/i.test(message)) {
    return `${fallback} 네트워크 상태를 확인한 뒤 다시 시도해 주세요.`;
  }
  return message;
};
const isLocalPreviewHost = () => (
  typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
);
const formatTimeAgo = (value: unknown) => {
  const timestamp = Date.parse(String(value ?? ''));
  if (!Number.isFinite(timestamp)) return '';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return '방금 전';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return formatDate(new Date(timestamp));
};
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const normalizeDateInputValue = (value?: string | null) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dotted = text.match(/^(\d{2}|\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (dotted) {
    const rawYear = Number(dotted[1] ?? '');
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    return `${year}-${(dotted[2] ?? '').padStart(2, '0')}-${(dotted[3] ?? '').padStart(2, '0')}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : formatDate(parsed);
};
const parseDateInputValue = (value?: string | null) => {
  const normalized = normalizeDateInputValue(value);
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return undefined;
  const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

function TossAdSlot() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'rendered' | 'unsupported' | 'no-fill' | 'failed'>('idle');

  useEffect(() => {
    const adGroupId = getAppsInTossBannerAdGroupId();
    if (!adGroupId || !slotRef.current) {
      setStatus('unsupported');
      return undefined;
    }

    let cancelled = false;
    let destroy: undefined | (() => void);
    const initialize = () => new Promise<typeof TossAds | null>((resolve) => {
      if (!TossAds?.initialize?.isSupported?.()) {
        resolve(null);
        return;
      }
      TossAds.initialize({
        callbacks: {
          onInitialized: () => resolve(TossAds),
          onInitializationFailed: () => resolve(null),
        },
      });
    });

    void initialize()
      .then((ads) => {
        if (cancelled || !ads?.attachBanner?.isSupported?.() || !slotRef.current) {
          setStatus('unsupported');
          return;
        }
        const attachment = ads.attachBanner(adGroupId, slotRef.current, {
          theme: 'light',
          tone: 'blackAndWhite',
          variant: 'expanded',
          callbacks: {
            onAdRendered: () => setStatus('rendered'),
            onNoFill: () => setStatus('no-fill'),
            onAdFailedToRender: () => setStatus('failed'),
          },
        });
        destroy = attachment?.destroy;
      })
      .catch(() => setStatus('failed'));

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return (
    <section className={`ad-slot ${status === 'rendered' ? 'rendered' : ''}`} aria-label="광고 영역">
      <div ref={slotRef} className="toss-banner-slot" aria-label="토스 배너 광고" />
    </section>
  );
}

const normalizeIngredient = (item: any, index: number): Ingredient => {
  const dday = item?.dDay ?? item?.dday;
  const expirationDate = item?.expirationDate ?? item?.date ?? '';
  return {
    id: String(item?.userIngredientId ?? item?.id ?? item?.ingredientId ?? `ingredient-${index}`),
    userIngredientId: item?.userIngredientId ?? item?.id ?? item?.ingredientId ?? null,
    name: item?.ingredient ?? item?.name ?? item?.productName ?? item?.product_name ?? '이름 없는 재료',
    category: item?.category ?? '기타',
    dday: formatDdayLabel(dday, expirationDate),
    date: expirationDate,
    purchaseDate: item?.purchaseDate ?? item?.purchase_date ?? '',
    status: item?.status ?? '미사용',
    quantity: item?.quantity ?? 1,
  };
};

const toText = (value: unknown) => (value == null ? '' : String(value).trim());
const toNumberOrUndefined = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const normalizeImageUri = (value?: string | null) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) return trimmed;
  return `data:image/jpeg;base64,${trimmed}`;
};
const getFirstAlbumImage = async (maxWidth = 1280) => {
  const images = await fetchAlbumPhotos({ base64: true, maxCount: 1, maxWidth });
  return normalizeImageUri(images[0]?.dataUri);
};
const ingredientLabel = (item: any) => {
  if (typeof item === 'string') return item.trim();
  const name = toText(item?.name ?? item?.ingredientName ?? item?.ingredient ?? item?.title);
  const amount = [item?.amount, item?.unit].map(toText).filter(Boolean).join(' ');
  return [name, amount].filter(Boolean).join(' ');
};
const stringList = (value: any): string[] => (
  Array.isArray(value)
    ? value.map(ingredientLabel).filter(Boolean)
    : []
);
const formatRecipeAmount = (amount: unknown, unit: unknown) => {
  const amountText = toText(amount).replace(/\.0$/, '');
  const unitText = toText(unit);
  return `${amountText}${unitText}`.trim();
};

const normalizeRecipe = (item: any, index: number): Recipe => {
  const matched = stringList(item?.matchDetails?.matched ?? item?.match_details?.matched ?? item?.matchedIngredients ?? item?.matched_ingredients);
  const missing = stringList(item?.matchDetails?.missing ?? item?.match_details?.missing ?? item?.missingIngredients ?? item?.missing_ingredients);
  return {
    recipeId: String(item?.recipeId ?? item?.recipe_id ?? item?.id ?? `recipe-${index}`),
    title: item?.title ?? item?.name ?? '레시피',
    category: item?.category ?? '추천',
    ingredients: stringList(item?.ingredients ?? item?.ingredientList ?? item?.recipeIngredients),
    imageUrl: item?.imageUrl ?? item?.image_url ?? item?.thumbnailUrl ?? item?.thumbnail_url ?? item?.image,
    score: item?.score,
    hasAll: item?.hasAll ?? item?.has_all,
    matchDetails: matched.length > 0 || missing.length > 0 ? { matched, missing } : undefined,
  };
};

const normalizeSharePost = (item: any, index: number): SharePost => {
  const rawPostId = item?.postId ?? item?.post_id ?? item?.id;
  const rawNeighborhood = item?.locationName ?? item?.display_address ?? item?.displayAddress ?? item?.full_address ?? item?.fullAddress ?? item?.neighborhood;
  return ({
  id: String(rawPostId ?? `share-${index}`),
  postId: rawPostId == null ? undefined : String(rawPostId),
  title: item?.title ?? item?.postTitle ?? '제목 없음',
  food: item?.ingredientName ?? item?.ingredient_name ?? item?.ingredient ?? item?.food ?? '나눔',
  category: item?.category ?? '기타',
  neighborhood: rawNeighborhood && !String(rawNeighborhood).includes('로컬') ? rawNeighborhood : '위치 정보 없음',
  distance: item?.distance == null ? '' : Number(item.distance) < 1 ? `${Math.round(Number(item.distance) * 1000)}m` : `${Number(item.distance).toFixed(1)}km`,
  timeAgo: (item?.timeAgo ?? formatTimeAgo(item?.createdAt ?? item?.created_at ?? item?.createTime)) || '방금 전',
  description: item?.content ?? item?.description ?? '',
  imageUrl: item?.imageUrl ?? item?.image_url ?? item?.image ?? item?.thumbnailUrl ?? item?.thumbnail_url,
  authorName: item?.authorName ?? item?.author ?? item?.writerNickName ?? item?.writerNickname ?? item?.sellerNickName ?? item?.sellerNickname ?? item?.nickname ?? item?.userNickname,
  sellerId: item?.sellerId ?? item?.seller_id ?? item?.ownerId ?? item?.owner_id,
  sellerName: item?.sellerName ?? item?.sellerNickname ?? item?.sellerNickName ?? item?.ownerName,
  sellerProfileImageUrl: item?.sellerProfileImageUrl ?? item?.sellerProfileImage ?? item?.seller_profile_image_url ?? item?.profileImageUrl ?? item?.profileImage ?? item?.userProfileImageUrl,
  expirationDate: item?.expirationDate ?? item?.expiration_date ?? item?.expiredAt ?? item?.date,
  latitude: toNumberOrUndefined(item?.latitude ?? item?.lat ?? item?.location?.latitude ?? item?.location?.lat ?? item?.shareLocation?.latitude ?? item?.shareLocation?.lat ?? item?.coordinate?.latitude ?? item?.coordinate?.lat),
  longitude: toNumberOrUndefined(item?.longitude ?? item?.lng ?? item?.lon ?? item?.location?.longitude ?? item?.location?.lng ?? item?.location?.lon ?? item?.shareLocation?.longitude ?? item?.shareLocation?.lng ?? item?.shareLocation?.lon ?? item?.coordinate?.longitude ?? item?.coordinate?.lng ?? item?.coordinate?.lon),
  createdAt: item?.createdAt ?? item?.created_at,
  });
};

const getServerPostId = (post?: SharePost | null) => post?.postId ?? null;

const getMapLevelForRadius = (radiusKm: number) => {
  if (radiusKm <= 0.5) return 4;
  if (radiusKm <= 1) return 5;
  if (radiusKm <= 3) return 6;
  if (radiusKm <= 5) return 7;
  if (radiusKm <= 10) return 8;
  return 9;
};

function KakaoMapPanel({ center, radiusKm, posts, onSelect }: { center: { latitude: number; longitude: number }; radiusKm: number; posts: SharePost[]; onSelect: (post: SharePost) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const kakaoKey = getKakaoMapJavascriptKey();
  const coordinatePosts = useMemo(() => posts.filter(post => post.latitude != null && post.longitude != null), [posts]);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    setMapFailed(false);
    if (!kakaoKey || !containerRef.current) {
      return undefined;
    }
    let cancelled = false;
    const scriptId = 'kakao-map-sdk';
    const loadScript = () => new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        if ((window as any).kakao?.maps) resolve();
        else existing.addEventListener('load', () => resolve(), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoKey)}&autoload=false`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Kakao map script failed'));
      document.head.appendChild(script);
    });
    void loadScript().then(() => {
      const kakao = (window as any).kakao;
      if (cancelled || !containerRef.current || !kakao?.maps) return;
      kakao.maps.load(() => {
        if (cancelled || !containerRef.current) return;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.latitude, center.longitude),
          level: getMapLevelForRadius(radiusKm),
        });
        const centerLatLng = new kakao.maps.LatLng(center.latitude, center.longitude);
        new kakao.maps.Marker({
          map,
          position: centerLatLng,
          title: '내 위치',
        });
        const circle = new kakao.maps.Circle({
          map,
          center: centerLatLng,
          radius: radiusKm * 1000,
          strokeWeight: 2,
          strokeColor: '#3182f6',
          strokeOpacity: 0.72,
          strokeStyle: 'solid',
          fillColor: '#3182f6',
          fillOpacity: 0.08,
        });
        const bounds = circle.getBounds();
        coordinatePosts.forEach((post) => {
          if (post.latitude != null && post.longitude != null) {
            bounds.extend(new kakao.maps.LatLng(post.latitude, post.longitude));
          }
        });
        map.setBounds(bounds, 18, 18, 18, 18);
        coordinatePosts.forEach((post) => {
          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(post.latitude, post.longitude),
            title: post.title,
          });
          kakao.maps.event.addListener(marker, 'click', () => onSelect(post));
        });
      });
    }).catch(() => {
      if (!cancelled) setMapFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [center.latitude, center.longitude, coordinatePosts, kakaoKey, onSelect, radiusKm]);

  if (kakaoKey && !mapFailed) {
    return <div ref={containerRef} className="market-map-canvas" aria-label="내 주변 나눔 지도" />;
  }

  const project = (post: SharePost) => {
    const latDiff = ((post.latitude ?? center.latitude) - center.latitude) * 420;
    const lngDiff = ((post.longitude ?? center.longitude) - center.longitude) * 520;
    return {
      left: `${Math.max(8, Math.min(88, 50 + lngDiff))}%`,
      top: `${Math.max(12, Math.min(82, 50 - latDiff))}%`,
    };
  };

  return (
    <div className="market-map-canvas" aria-label="내 주변 나눔 지도">
      <span>반경 {formatRadiusLabel(radiusKm)}</span>
      <i className="market-map-radius-ring" aria-hidden="true" style={{ width: `${Math.min(86, 28 + radiusKm * 5)}%`, height: `${Math.min(86, 28 + radiusKm * 5)}%` }} />
      {coordinatePosts.slice(0, 8).map((post, index) => (
        <button
          className="market-map-marker"
          key={`${post.id}-marker`}
          style={project(post)}
          type="button"
          aria-label={`${post.title} 지도 마커`}
          onClick={() => onSelect(post)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}

const normalizeRecipeDetail = (detail: any, fallback: Recipe) => {
  const ingredients = detail?.ingredients ?? detail?.ingredientList ?? detail?.recipeIngredients ?? fallback.ingredients;
  const steps = detail?.steps ?? detail?.manuals ?? detail?.cookingSteps ?? [];
  const ingredientRows = Array.isArray(ingredients)
    ? ingredients.map((item: any) => {
      if (typeof item === 'string') {
        return { name: item, amount: '', label: item };
      }
      const name = item?.name ?? item?.ingredientName ?? item?.ingredient ?? '';
      const amount = formatRecipeAmount(item?.amount, item?.unit);
      return { name, amount, label: [name, amount].filter(Boolean).join(' ') };
    }).filter((item: { label: string }) => item.label.length > 0)
    : fallback.ingredients.map(name => ({ name, amount: '', label: name }));
  const orderedSteps = Array.isArray(steps)
    ? steps
      .slice()
      .sort((a: any, b: any) => {
        if (typeof a === 'string' || typeof b === 'string') return 0;
        return Number(a?.stepOrder ?? a?.order ?? a?.step ?? 0) - Number(b?.stepOrder ?? b?.order ?? b?.step ?? 0);
      })
      .map((item: any, index: number) => ({
        order: typeof item === 'string' ? index + 1 : Number(item?.stepOrder ?? item?.order ?? item?.step ?? index + 1),
        text: typeof item === 'string' ? item : item?.description ?? item?.content ?? item?.manual ?? item?.text ?? '',
      }))
      .filter((item: { text: string }) => item.text.length > 0)
    : [];
  return {
    title: detail?.title ?? detail?.name ?? fallback.title,
    category: detail?.category ?? fallback.category,
    imageUrl: detail?.imageUrl ?? detail?.image_url ?? detail?.thumbnailUrl ?? detail?.thumbnail_url ?? detail?.image ?? fallback.imageUrl,
    ingredients: ingredientRows.map((item: { label: string }) => item.label),
    ingredientRows,
    steps: orderedSteps,
    manual: orderedSteps.length > 0 ? orderedSteps.map((item: { text: string }) => item.text).join('\n') : detail?.manual ?? detail?.content ?? '',
  };
};

const normalizeIngredientItems = (data: any): Ingredient[] => {
  const items = data?.items ?? data?.result?.items ?? data?.data?.items ?? data?.result ?? data?.data ?? data;
  return Array.isArray(items) ? items.map(normalizeIngredient) : [];
};

const extractIngredientNames = (data: any): string[] => {
  const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? data?.result ?? data?.data ?? data;
  return Array.isArray(names) ? names.map((name: unknown) => String(name).trim()).filter(Boolean) : [];
};

const getLocationLabel = (location: any) => (
  location?.display_address
  ?? location?.displayAddress
  ?? location?.full_address
  ?? location?.fullAddress
  ?? location?.location?.display_address
  ?? location?.location?.displayAddress
  ?? location?.location?.full_address
  ?? location?.location?.fullAddress
  ?? location?.shareLocation?.display_address
  ?? location?.shareLocation?.displayAddress
  ?? location?.shareLocation?.full_address
  ?? location?.shareLocation?.fullAddress
  ?? location?.name
  ?? location?.address
  ?? ''
);

const getLocationCoordinate = (location: any) => ({
  latitude: toNumberOrUndefined(location?.latitude ?? location?.lat ?? location?.location?.latitude ?? location?.location?.lat ?? location?.shareLocation?.latitude ?? location?.shareLocation?.lat ?? location?.coordinate?.latitude ?? location?.coordinate?.lat),
  longitude: toNumberOrUndefined(location?.longitude ?? location?.lng ?? location?.lon ?? location?.location?.longitude ?? location?.location?.lng ?? location?.location?.lon ?? location?.shareLocation?.longitude ?? location?.shareLocation?.lng ?? location?.shareLocation?.lon ?? location?.coordinate?.longitude ?? location?.coordinate?.lng ?? location?.coordinate?.lon),
});

const getStartedChatRoomId = (chat: any) => (
  chat?.chatRoomId
  ?? chat?.roomId
  ?? chat?.id
  ?? chat?.chatRoom?.chatRoomId
  ?? chat?.result?.chatRoomId
  ?? chat?.result?.roomId
  ?? chat?.result?.id
  ?? chat?.data?.chatRoomId
  ?? chat?.data?.roomId
  ?? chat?.data?.id
);

const getSharePolicyViolation = ({
  ingredientName,
  ingredientCategory,
  category,
  title,
  content,
  expirationDate,
}: {
  ingredientName?: string;
  ingredientCategory?: string;
  category?: string;
  title?: string;
  content?: string;
  expirationDate?: string;
}) => {
  const categoryText = `${ingredientCategory || ''} ${category || ''}`;
  if (category && !shareAllowedCategories.includes(category)) {
    return '현재는 채소/과일, 쌀/면/빵, 미개봉 가공식품, 미개봉 조미료 중심으로 등록해주세요.';
  }
  if (shareBlockedCategories.some(blockedCategory => categoryText.includes(blockedCategory))) {
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
  if (shareBlockedKeywords.some(keyword => joinedText.includes(keyword.toLowerCase()))) {
    return '주류, 의약품, 건강기능식품, 개봉/소분/조리 식품은 나눔할 수 없어요.';
  }
  return null;
};

function SplashScreen({
  onComplete,
  onFirstLogin,
}: {
  onComplete: (token: string | null) => void;
  onFirstLogin: (token: string | null) => void;
}) {
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState('토스 로그인 상태를 확인하고 있어요.');
  const [error, setError] = useState('');
  const requestedRef = useRef(false);

  const startLogin = async () => {
    setBusy(true);
    setError('');
    setStatus('필요하면 토스 로그인 및 약관 동의 화면으로 이동해요.');
    try {
      const { authorizationCode, referrer } = await appLogin();
      const session = await exchangeTossLogin({ authorizationCode, referrer });
      if (session.firstLogin === true || session.firstLogin === 'true') {
        onFirstLogin(session.accessToken);
        return;
      }
      onComplete(session.accessToken);
    } catch (caughtError) {
      if (isLocalPreviewHost()) {
        await startLocalBackendLogin();
        return;
      }
      setStatus('토스 로그인을 완료하지 못했어요.');
      setError(getErrorMessage(caughtError, '잠시 후 다시 시도해 주세요.'));
      setBusy(false);
    }
  };

  const startLocalBackendLogin = async () => {
    setBusy(true);
    setError('');
    setStatus('로컬 백엔드 세션을 발급하고 있어요.');
    try {
      const session = await loginWithLocalBackend();
      onComplete(session.accessToken);
    } catch (caughtError) {
      setStatus('로컬 백엔드 로그인에 실패했어요.');
      setError(getErrorMessage(caughtError, '백엔드가 localhost:8080에서 실행 중인지 확인해 주세요.'));
      setBusy(false);
    }
  };

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;
    void startLogin();
  }, []);

  return (
    <main className="splash-screen">
      <section className="splash-content">
        <img className="splash-logo" src={logoUrl} alt="" />
        <span className="ait-badge">토스 미니앱</span>
        <h1>물무물무</h1>
        <p>영수증으로 식재료를 등록하고 지금 만들 수 있는 레시피를 확인해요.</p>
        <div className="status-box">
          {busy ? <span className="spinner" /> : null}
          <strong>{status}</strong>
          {error ? <small>{error}</small> : null}
        </div>
      </section>
      {!busy ? (
        <footer className="splash-actions">
          <Button display="block" onClick={startLogin}>토스 로그인 다시 시도</Button>
          {isLocalPreviewHost() ? (
            <button className="text-button" type="button" onClick={startLocalBackendLogin}>로컬 백엔드로 보기</button>
          ) : null}
        </footer>
      ) : null}
    </main>
  );
}

function PreferenceIngredientPicker({
  selectedItems,
  onChange,
  quickItems,
  placeholder,
  helperText,
  allowNone = false,
}: {
  selectedItems: string[];
  onChange: (items: string[]) => void;
  quickItems: string[];
  placeholder: string;
  helperText: string;
  allowNone?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(ingredientCategories[1] ?? '정육/계란');
  const [categoryItems, setCategoryItems] = useState<string[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addItem = (name: string) => {
    const value = name.trim();
    if (!value || selectedItems.includes(value)) return;
    onChange([...selectedItems, value]);
    setSearch('');
    setSuggestions([]);
  };
  const removeItem = (name: string) => {
    onChange(selectedItems.filter(item => item !== name));
  };
  const loadCategory = async (category: string) => {
    setActiveCategory(category);
    setCategoryLoading(true);
    setMessage('');
    try {
      const data = await getIngredientsByCategory(category);
      setCategoryItems(extractIngredientNames(data));
    } catch (caughtError) {
      setCategoryItems([]);
      setMessage(getErrorMessage(caughtError, '표준 식재료 목록을 불러오지 못했어요.'));
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    const keyword = search.trim();
    if (!keyword) {
      setSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchIngredients(keyword);
        if (active) setSuggestions(extractIngredientNames(data).filter(name => !selectedItems.includes(name)));
      } catch {
        if (active) setSuggestions([]);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, selectedItems]);

  const openPicker = () => {
    setPickerVisible(true);
    void loadCategory(activeCategory);
  };
  const categorySelectOptions = ingredientCategories
    .filter(category => category !== '전체')
    .map(category => ({ name: category, value: category }));
  const ingredientSelectOptions = categoryLoading
    ? [{ name: '식재료를 불러오는 중이에요.', value: '__loading__', disabled: true }]
    : categoryItems.length === 0
      ? [{ name: '표시할 식재료가 없어요.', value: '__empty__', disabled: true }]
      : categoryItems.map(name => ({
        name: selectedItems.includes(name) ? `선택됨 · ${name}` : name,
        value: name,
      }));

  return (
    <section className="preference-picker">
      {allowNone ? (
        <button className={`choice-chip none-chip ${selectedItems.length === 0 ? 'selected' : ''}`} type="button" onClick={() => onChange([])}>
          없음
        </button>
      ) : null}
      {selectedItems.length > 0 ? (
        <div className="selected-preference-list">
          {selectedItems.map(item => (
            <button key={item} type="button" onClick={() => removeItem(item)}>
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="chip-grid setup-quick-grid">
        {quickItems.map(item => {
          const active = selectedItems.includes(item);
          return (
            <button className={`choice-chip ${active ? 'selected' : ''}`} key={item} type="button" onClick={() => active ? removeItem(item) : addItem(item)}>
              {item}
            </button>
          );
        })}
      </div>
      <label className="setup-search-field">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder={placeholder} />
        <span aria-hidden="true">⌕</span>
      </label>
      <p className="field-guide-text">{helperText}</p>
      {suggestions.length > 0 ? (
        <div className="suggestion-list">
          {suggestions.map(name => <button key={name} type="button" onClick={() => addItem(name)}>{name}</button>)}
        </div>
      ) : null}
      <button className="category-picker-button" type="button" onClick={openPicker}>
        <strong>카테고리에서 표준 식재료 고르기</strong>
        <small>검색이 어렵다면 목록에서 선택하세요.</small>
      </button>
      {message ? <p className="inline-message">{message}</p> : null}
      <BottomSheet
        className="setup-picker-sheet"
        open={pickerVisible}
        onClose={() => setPickerVisible(false)}
        maxHeight="82vh"
        header={<BottomSheet.Header>표준 식재료 선택</BottomSheet.Header>}
        headerDescription={<BottomSheet.HeaderDescription>카테고리와 식재료를 순서대로 선택해요.</BottomSheet.HeaderDescription>}
      >
        <div className="tds-picker-section">
          <strong>분류</strong>
          <BottomSheet.Select
            options={categorySelectOptions}
            value={activeCategory}
            onChange={(event) => {
              void loadCategory(event.target.value);
            }}
          />
        </div>
        <div className="tds-picker-section">
          <strong>식재료</strong>
          <BottomSheet.Select
            options={ingredientSelectOptions}
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value === '__loading__' || value === '__empty__') return;
              if (selectedItems.includes(value)) {
                removeItem(value);
              } else {
                addItem(value);
              }
            }}
          />
        </div>
        <div className="tds-picker-actions">
          <Button display="block" onClick={() => setPickerVisible(false)}>닫기</Button>
        </div>
      </BottomSheet>
    </section>
  );
}

function SetupScreen({
  kind,
  selected,
  onChange,
  onNext,
  onSkip,
}: {
  kind: 'allergy' | 'prefer' | 'dislike';
  selected: string[];
  onChange: (items: string[]) => void;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const title = kind === 'allergy' ? '알레르기가 있는 식재료를 선택해주세요' : kind === 'prefer' ? '선호하는 식재료를 선택해주세요' : '비선호 식재료를 선택해주세요';
  const subtitle = kind === 'allergy' ? '선택한 식재료는 레시피 추천에서 제외할 수 있도록 표준 식재료명으로 저장해요.' : kind === 'prefer' ? '좋아하는 식재료를 추천 점수에 반영해요. 선택하지 않아도 앱을 사용할 수 있어요.' : '싫어하는 식재료는 추천 점수를 낮추는 데 사용해요.';
  const options = kind === 'prefer' ? setupPrefer : kind === 'dislike' ? setupDislikes : setupAllergies;
  const placeholder = kind === 'allergy' ? '알레르기 식재료 검색' : kind === 'prefer' ? '선호 식재료 검색' : '비선호 식재료 검색';
  const helperText = kind === 'allergy' ? '직접 문자를 저장하지 않고, 정규화된 식재료 목록에서만 선택해요.' : kind === 'prefer' ? '추천 품질을 위해 레시피와 같은 표준 식재료명으로 저장해요.' : '사용자 입력값도 레시피 추천과 같은 표준 식재료명으로 맞춰 저장해요.';

  return (
    <main className="setup-screen">
      <header className="page-header">
        <p className="eyebrow">맞춤 설정</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      <PreferenceIngredientPicker selectedItems={selected} onChange={onChange} quickItems={options} placeholder={placeholder} helperText={helperText} allowNone={kind === 'allergy'} />
      <footer className="bottom-actions">
        {onSkip ? <button className="text-button" type="button" onClick={onSkip}>건너뛰기</button> : null}
        <Button display="block" onClick={onNext}>{kind === 'dislike' ? '시작하기' : '다음'}</Button>
      </footer>
    </main>
  );
}

function ProfileSetupScreen({
  onComplete,
}: {
  onComplete: (nickname: string) => Promise<void>;
}) {
  const storedProfile = readStoredProfile();
  const [nickname, setNickname] = useState(storedProfile?.nickname ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const normalizedNickname = nickname.trim();
  const isValid = normalizedNickname.length >= 2 && normalizedNickname.length <= 12;

  useEffect(() => {
    let active = true;
    void getMyProfile()
      .then((profile) => {
        if (!active) return;
        const currentNickname = profile?.nickName ?? profile?.nickname ?? profile?.name;
        if (currentNickname && !nickname.trim()) {
          setNickname(String(currentNickname));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (!isValid) {
      setMessage('사용자명은 2~12자로 입력해 주세요.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await onComplete(normalizedNickname);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '사용자명을 저장하지 못했어요.'));
      setBusy(false);
    }
  };

  return (
    <main className="setup-screen profile-setup-screen">
      <header className="page-header">
        <p className="eyebrow">프로필 설정</p>
        <h1>사용자명을 정해주세요</h1>
        <p>나눔 게시글과 채팅에서 상대방에게 보여지는 이름이에요.</p>
      </header>
      <section className="profile-setup-card">
        <label>
          사용자명
          <input
            value={nickname}
            maxLength={12}
            onChange={event => {
              setNickname(event.target.value);
              setMessage('');
            }}
            placeholder="예: 나연"
          />
        </label>
        <small>한글, 영문, 숫자를 조합해 2~12자로 입력해요.</small>
      </section>
      {message ? <p className="setup-error inline-message">{message}</p> : null}
      <footer className="bottom-actions">
        <Button display="block" disabled={busy || !isValid} onClick={submit}>{busy ? '저장 중' : '완료'}</Button>
      </footer>
    </main>
  );
}

function MarketScreen({
  goTo,
  locationRevision,
  listRevision,
  browseLocation,
  onBrowseLocationChange,
}: {
  goTo: (route: ViewRoute) => void;
  locationRevision: number;
  listRevision: number;
  browseLocation: BrowseLocation | null;
  onBrowseLocationChange: (location: BrowseLocation | null) => void;
}) {
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [radius, setRadius] = useState(0.5);
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [locationName, setLocationName] = useState('주소 설정 필요');
  const [locationAddress, setLocationAddress] = useState('주소를 설정하면 근처 나눔을 보여드려요.');
  const [locationCoordinate, setLocationCoordinate] = useState(defaultMapCenter);
  const [hasSavedLocation, setHasSavedLocation] = useState(false);
  const [locationRequiredVisible, setLocationRequiredVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPosts = async (nextPage = 0) => {
    setLoading(true);
    try {
      const data = await fetchSharePosts({
        radiusKm: radius,
        page: nextPage,
        size: listPageSize,
        latitude: browseLocation?.latitude,
        longitude: browseLocation?.longitude,
      });
      const payload = data?.result ?? data?.data ?? data;
      const items = data?.items ?? data?.result?.items ?? data?.data?.items ?? [];
      if (Array.isArray(items)) {
        const normalized = items.map(normalizeSharePost);
        setPosts(normalized);
        setPage(nextPage);
        setHasNext(Boolean(payload?.hasNext));
        setTotalCount(typeof payload?.totalCount === 'number' ? payload.totalCount : normalized.length);
        setMessage('');
      }
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '근처 나눔 게시글을 불러오지 못했어요.'));
      setPosts([]);
      setHasNext(false);
      setTotalCount(null);
    } finally {
      setLoading(false);
    }
  };

  const loadLocation = async () => {
    try {
      const data = await getMyShareLocation();
      const result = data?.result ?? data?.data ?? data;
      const label = getLocationLabel(result);
      const { latitude, longitude } = getLocationCoordinate(result);
      if (label || (latitude != null && longitude != null)) {
        const fallbackLabel = label || '저장된 위치';
        setLocationName(fallbackLabel);
        setLocationAddress(label || result?.address || fallbackLabel);
        if (latitude != null && longitude != null) {
          setLocationCoordinate({ latitude, longitude });
        }
        setHasSavedLocation(true);
        return true;
      }
    } catch {
      setLocationName('주소 설정 필요');
      setLocationAddress('주소를 설정하면 근처 나눔을 보여드려요.');
    }
    setHasSavedLocation(false);
    return false;
  };

  const handleUseCurrentLocation = async () => {
    try {
      const current = await getCurrentLocation({ accuracy: Accuracy.Balanced });
      const result = await updateShareLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        verificationLatitude: current.coords.latitude,
        verificationLongitude: current.coords.longitude,
      });
      const label = getLocationLabel(result) || '현재 위치';
            setLocationName(label);
            setLocationAddress(result?.full_address ?? result?.fullAddress ?? '현재 위치 기준으로 근처 나눔을 보여줘요.');
            setLocationCoordinate({ latitude: current.coords.latitude, longitude: current.coords.longitude });
            setHasSavedLocation(true);
            onBrowseLocationChange(null);
            setMessage('');
            void loadPosts(0);
    } catch (sdkError) {
      if (!navigator.geolocation) {
        setMessage(getErrorMessage(sdkError, '현재 위치를 설정하지 못했어요.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          void updateShareLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            verificationLatitude: position.coords.latitude,
            verificationLongitude: position.coords.longitude,
          }).then((result) => {
            const label = getLocationLabel(result) || '현재 위치';
            setLocationName(label);
            setLocationAddress(result?.full_address ?? result?.fullAddress ?? '현재 위치 기준으로 근처 나눔을 보여줘요.');
            setLocationCoordinate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setHasSavedLocation(true);
            onBrowseLocationChange(null);
            setMessage('');
            void loadPosts(0);
          }).catch(caughtError => {
            setMessage(getErrorMessage(caughtError, '현재 위치를 저장하지 못했어요.'));
          });
        },
        () => setMessage('위치 권한을 허용하면 현재 위치 기준으로 볼 수 있어요.'),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  };

  const handleRadiusChange = (nextRadius: number) => {
    setRadius(nextRadius);
    setRadiusModalVisible(false);
  };

  const handleWriteClick = () => {
    if (!hasSavedLocation) {
      setLocationRequiredVisible(true);
      return;
    }
    goTo({ view: 'marketWrite' });
  };

  useEffect(() => {
    if (hasSavedLocation) {
      void loadPosts(0);
    }
  }, [radius, hasSavedLocation, browseLocation]);

  useEffect(() => {
    void loadLocation().then((loaded) => {
      if (loaded) {
        void loadPosts(0);
      }
    });
  }, [locationRevision, listRevision, browseLocation]);

  const activeLocationName = browseLocation?.label ?? locationName;
  const activeLocationAddress = browseLocation?.address ?? locationAddress;
  const activeLocationCoordinate = browseLocation ? { latitude: browseLocation.latitude, longitude: browseLocation.longitude } : locationCoordinate;
  const activeLocationMode = browseLocation ? '둘러보기 위치' : '현재 위치 기준';
  const visiblePosts = posts.filter(post => [post.title, post.food, post.category, post.neighborhood].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const marketTotalPages = Math.max(1, totalCount == null ? page + (hasNext ? 2 : 1) : Math.ceil(totalCount / listPageSize));
  const marketCanGoNext = hasNext || (totalCount != null && page + 1 < marketTotalPages);
  const marketPostList = (
    <>
      <div className="market-post-list">
        {loading ? (
          <p className="empty-text">근처 나눔을 불러오는 중이에요.</p>
        ) : visiblePosts.length === 0 ? (
          <p className="empty-text">근처 나눔 게시글이 없어요.</p>
        ) : visiblePosts.map(post => {
          const visual = categoryVisuals[post.category] ?? categoryVisuals.기타;
          return (
            <button className="market-post-card" key={post.id} type="button" onClick={() => goTo({ view: 'marketDetail', post })}>
              <span className="market-post-image" style={{ backgroundColor: visual?.color }}>
                <img src={post.imageUrl || visual?.image} alt="" />
              </span>
              <div className="market-post-info">
                <div className="market-post-title-row">
                  <strong>{post.title}</strong>
                  <em>{post.distance}</em>
                </div>
                <small>{post.neighborhood}{post.timeAgo ? ` · ${post.timeAgo}` : ''}{post.category ? ` · ${post.category}` : ''}</small>
                <p>{post.description || '상세 내용은 게시글에서 확인해주세요.'}</p>
              </div>
            </button>
          );
        })}
      </div>
      {!loading && visiblePosts.length > 0 ? (
        <div className="list-pagination market-pagination">
          <button type="button" disabled={page === 0 || loading} onClick={() => loadPosts(Math.max(0, page - 1))}>이전</button>
          <span>{page + 1} / {marketTotalPages}</span>
          <button type="button" disabled={!marketCanGoNext || loading} onClick={() => loadPosts(page + 1)}>다음</button>
        </div>
      ) : null}
    </>
  );

  return (
    <section className="screen market-screen">
      <header className="market-header">
        <div className="market-header-top">
          <div>
            <h1>나눔</h1>
            <button className="market-location-link" type="button" onClick={() => goTo({ view: 'locationSetting' })}>
              {activeLocationName}
            </button>
          </div>
          <button
            className={`icon-button ${searchVisible ? 'active' : ''}`}
            type="button"
            aria-label="나눔 검색"
            onClick={() => setSearchVisible(value => !value)}
          >
            ⌕
          </button>
        </div>
        {searchVisible ? (
          <div className="market-search-container">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="나눔 품목이나 동네를 검색하세요" />
            {search ? <button type="button" aria-label="검색어 지우기" onClick={() => setSearch('')}>×</button> : null}
          </div>
        ) : null}
      </header>

      <div className="market-content">
        {message ? <p className="inline-message market-message">{message}</p> : null}
        <section className="market-map-card">
          <div className="market-map-header">
            <div>
              <span>{activeLocationMode}</span>
              <button type="button" onClick={() => goTo({ view: 'locationSetting' })}>{activeLocationAddress}</button>
            </div>
            <button className="market-current-location" type="button" onClick={handleUseCurrentLocation}>
              현재 위치
            </button>
          </div>
          <KakaoMapPanel center={activeLocationCoordinate} radiusKm={radius} posts={visiblePosts} onSelect={(post) => goTo({ view: 'marketDetail', post })} />
          <div className="market-map-footer">
            <p>반경 {formatRadiusLabel(radius)} 안의 나눔 {visiblePosts.length}건을 보여줘요.</p>
            <button
              className="market-radius-chip"
              type="button"
              aria-label={`현재 나눔 반경 ${formatRadiusLabel(radius)}, 반경 변경`}
              onClick={() => setRadiusModalVisible(true)}
            >
              {formatRadiusLabel(radius)} <span aria-hidden="true">⌄</span>
            </button>
          </div>
        </section>

        <div className="market-section-header">
          <h2>근처 나눔 게시글</h2>
          <span>{visiblePosts.length}개</span>
        </div>

        {marketPostList}
        <TossAdSlot />
      </div>

      <button className="market-write-button" type="button" onClick={handleWriteClick}>+ 글쓰기</button>
      <ConfirmDialog
        open={locationRequiredVisible}
        title="나눔 위치 설정"
        description="나눔 글을 작성하려면 나눔 위치를 먼저 설정해야 해요."
        onClose={() => setLocationRequiredVisible(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setLocationRequiredVisible(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton onClick={() => {
          setLocationRequiredVisible(false);
          goTo({ view: 'locationSetting' });
        }}>위치 설정하기</ConfirmDialog.ConfirmButton>}
      />
      {radiusModalVisible ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setRadiusModalVisible(false)}>
          <section
            className="radius-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="radius-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="radius-modal-header">
              <div>
                <h2 id="radius-modal-title">나눔 반경 설정</h2>
                <p>가까운 동네부터 넓은 지역까지 필요한 만큼 조정해요.</p>
              </div>
              <button type="button" aria-label="나눔 반경 설정 닫기" onClick={() => setRadiusModalVisible(false)}>×</button>
            </header>
            <div className="radius-panel">
              <div className="radius-header">
                <span>현재 반경</span>
                <strong>{formatRadiusLabel(radius)}</strong>
              </div>
              <div className="radius-track" aria-hidden="true">
                <span style={{ width: `${(radiusOptions.indexOf(radius) / (radiusOptions.length - 1)) * 100}%` }} />
              </div>
              <div className="radius-options" role="group" aria-label="나눔 반경 설정">
                {radiusOptions.map(value => (
                  <button
                    className={value === radius ? 'selected' : ''}
                    key={value}
                    type="button"
                    onClick={() => handleRadiusChange(value)}
                  >
                    {formatRadiusLabel(value)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function RecipeScreen({ goTo }: { goTo: (route: ViewRoute) => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const browseMode = Boolean(search.trim() || activeCategory);
  const visibleRecipes = recipes;
  const totalPages = totalCount == null
    ? Math.max(page + (hasNext ? 2 : 1), 1)
    : Math.max(Math.ceil(totalCount / recipePageSize), 1);
  const canGoNext = hasNext && page + 1 < totalPages;

  const loadRecipes = async (nextPage = 0) => {
    setLoading(true);
    try {
      const data = await fetchRecipes({ category: activeCategory ?? '전체', keyword: search.trim(), page: nextPage, size: recipePageSize });
      const payload = data?.result ?? data?.data ?? data;
      const result = Array.isArray(payload) ? payload : payload?.recipes ?? payload?.items;
      if (Array.isArray(result)) {
        setRecipes(result.map(normalizeRecipe));
        setPage(typeof payload?.page === 'number' ? payload.page : nextPage);
        setHasNext(Boolean(payload?.hasNext));
        setTotalCount(typeof payload?.totalCount === 'number' ? payload.totalCount : null);
        setMessage('');
      } else {
        setRecipes([]);
        setPage(0);
        setHasNext(false);
        setTotalCount(null);
        setMessage('레시피 목록 응답 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.');
      }
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '레시피를 불러오지 못했어요.'));
      setRecipes([]);
      setHasNext(false);
      setTotalCount(null);
    } finally {
      setLoading(false);
    }
  };

  const submitRecipeSearch = () => {
    const keyword = searchDraft.trim();
    setSearch(keyword);
    setActiveCategory(null);
    setPage(0);
  };

  useEffect(() => {
    const keyword = searchDraft.trim();
    const timer = window.setTimeout(() => {
      if (keyword === search) return;
      setSearch(keyword);
      if (keyword) setActiveCategory(null);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, search]);

  useEffect(() => {
    void loadRecipes(0);
  }, [activeCategory, search]);

  const recipeListContent = (
    <>
      <div className="recipe-list">
        {loading ? <p className="empty-text">레시피를 불러오는 중이에요.</p> : visibleRecipes.map(recipe => {
          const visual = recipeVisuals[recipe.category] ?? recipeVisuals.반찬;
          return (
            <button className="recipe-card" key={recipe.recipeId} type="button" onClick={() => goTo({ view: 'recipeDetail', recipe })}>
              <span style={{ backgroundColor: visual?.color }}>
                <img src={recipe.imageUrl || visual?.image} alt="" />
              </span>
              <div>
                <strong>{recipe.title}</strong>
                <small>{recipe.ingredients.join(', ') || recipe.category}</small>
                {recipe.matchDetails ? <p>맞는 재료: {recipe.matchDetails.matched.join(', ') || '없음'}</p> : null}
              </div>
            </button>
          );
        })}
      </div>
      {!loading && visibleRecipes.length === 0 && !message ? <p className="empty-text">표시할 레시피가 없어요</p> : null}
      {visibleRecipes.length > 0 ? (
        <div className="recipe-pagination">
          <button type="button" disabled={page === 0 || loading} onClick={() => loadRecipes(Math.max(0, page - 1))}>이전</button>
          <span>{page + 1} / {totalPages}</span>
          <button type="button" disabled={!canGoNext || loading} onClick={() => loadRecipes(page + 1)}>다음</button>
        </div>
      ) : null}
    </>
  );

  return (
    <section className="screen">
      <header className="page-header compact">
        <h1>레시피</h1>
        <form className="search-control recipe-search-control" onSubmit={event => {
          event.preventDefault();
          submitRecipeSearch();
        }}>
          <input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="레시피명 또는 재료명으로 검색" />
          <button type="submit" aria-label="레시피 검색">⌕</button>
        </form>
      </header>
      {message ? <p className="inline-message">{message}</p> : null}
      {!browseMode ? (
        <>
          <button className="recommend-banner" type="button" onClick={() => goTo({ view: 'recipeRecommend' })}>
            <span>
              <strong>내 식자재로 레시피 추천받기</strong>
              <small>보유 재료와 알레르기 설정을 먼저 반영해요</small>
            </span>
            <span>›</span>
          </button>
          <h2 className="section-title">카테고리별로 찾기</h2>
          <div className="recipe-category-grid">
            {recipeCategories.map(category => {
              const visual = recipeVisuals[category] ?? recipeVisuals.반찬;
              return (
                <button key={category} type="button" onClick={() => {
                  setSearch('');
                  setSearchDraft('');
                  setActiveCategory(category);
                  setPage(0);
                }}>
                  <span style={{ backgroundColor: visual?.color }}>
                    <img src={visual?.image} alt="" />
                  </span>
                  {category}
                </button>
              );
            })}
          </div>
          <h2 className="section-title">전체 레시피</h2>
          {recipeListContent}
          <TossAdSlot />
        </>
      ) : (
        <>
          <div className="recipe-browse-header">
            <button className="back-button" type="button" onClick={() => {
              setActiveCategory(null);
              setSearch('');
              setSearchDraft('');
              setPage(0);
              setTotalCount(null);
            }}>카테고리로 돌아가기</button>
            <h2>{search ? `"${search}" 검색 결과` : activeCategory ?? '검색 결과'}</h2>
          </div>
          {recipeListContent}
        </>
      )}
    </section>
  );
}

function ChatScreen({ goTo }: { goTo: (route: ViewRoute) => void }) {
  const [active, setActive] = useState<'all' | 'take' | 'give'>('all');
  const [chats, setChats] = useState<Chat[]>([]);
  const [message, setMessage] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmChatIds, setDeleteConfirmChatIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const getActionableChatRoomId = (chat: Chat) => chat.chatRoomId ?? null;

  const loadChats = async (nextPage = 0) => {
    setLoading(true);
    try {
      const data = await fetchChats({ type: active, page: nextPage, size: 10 });
      const payload = data?.result ?? data?.data ?? data;
      const items = data?.items ?? data?.result?.items ?? data?.data?.items ?? [];
      if (Array.isArray(items)) {
        const normalized = items.map((item: any, index: number) => ({
          id: String(item.chatRoomId ?? item.id ?? index),
          chatRoomId: item.chatRoomId == null ? undefined : String(item.chatRoomId),
          postId: item.postId == null ? undefined : String(item.postId),
          opponentId: item.opponentId == null ? undefined : String(item.opponentId),
          name: item.senderNicName ?? item.senderNickName ?? item.name ?? '상대방',
          lastMessage: item.lastMessage ?? '아직 메시지가 없어요.',
          time: item.sendTime ? new Date(item.sendTime).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '',
          type: item.type ?? 'take',
        }));
        setChats(normalized);
        setPage(nextPage);
        setHasNext(Boolean(payload?.hasNext));
        setTotalCount(typeof payload?.totalCount === 'number' ? payload.totalCount : normalized.length);
        setMessage('');
      }
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '채팅 목록을 불러오지 못했어요.'));
      setChats([]);
      setHasNext(false);
      setTotalCount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectionMode(false);
    setSelectedChatIds([]);
    void loadChats(0);
  }, [active]);

  const visibleChats = chats;
  const chatTotalPages = Math.max(1, totalCount == null ? page + (hasNext ? 2 : 1) : Math.ceil(totalCount / listPageSize));
  const chatCanGoNext = hasNext || (totalCount != null && page + 1 < chatTotalPages);
  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(current => current.includes(chatId) ? current.filter(id => id !== chatId) : [...current, chatId]);
  };
  const deleteSelectedChats = async (chatIds = deleteConfirmChatIds) => {
    if (chatIds.length === 0 || deletingSelected) return;
    try {
      setDeletingSelected(true);
      await deleteChatRooms(chatIds);
      setChats(current => current.filter(chat => !chat.chatRoomId || !chatIds.includes(chat.chatRoomId)));
      setSelectedChatIds([]);
      setSelectionMode(false);
      setDeleteConfirmChatIds([]);
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '선택한 채팅방을 삭제하지 못했어요.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  return (
    <section className="screen">
      <header className="page-header compact">
        <h1>대화</h1>
        <div className="chat-filter-tabs">
          <SegmentedControl
            value={active}
            onChange={value => setActive(value as 'all' | 'take' | 'give')}
            alignment="fluid"
            size="small"
          >
            <SegmentedControl.Item value="all">전체</SegmentedControl.Item>
            <SegmentedControl.Item value="take">나눔받기</SegmentedControl.Item>
            <SegmentedControl.Item value="give">나눔하기</SegmentedControl.Item>
          </SegmentedControl>
        </div>
      </header>
      <div className="list-actions">
        {visibleChats.length > 0 ? <button type="button" onClick={() => {
          setSelectionMode(value => !value);
          setSelectedChatIds([]);
        }}>{selectionMode ? '선택 취소' : '채팅 선택'}</button> : null}
        {selectionMode ? <span>{selectedChatIds.length}개 선택됨</span> : null}
        {selectionMode ? <button type="button" disabled={selectedChatIds.length === 0} onClick={() => setDeleteConfirmChatIds(selectedChatIds)}>선택 삭제</button> : null}
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="chat-list">
        {loading ? <p className="empty-text">채팅 목록을 불러오고 있어요.</p> : visibleChats.map(chat => {
          const chatRoomId = getActionableChatRoomId(chat);
          const isSelected = chatRoomId != null && selectedChatIds.includes(chatRoomId);
          return (
          <ListRow
            className={`chat-row ${isSelected ? 'selected' : ''}`}
            key={chat.id}
            withTouchEffect
            disabled={chatRoomId == null}
            disabledStyle="type2"
            left={selectionMode ? <span className={`check ${isSelected ? 'on' : ''}`}>{isSelected ? '✓' : ''}</span> : <span className="chat-avatar">{chat.name.slice(0, 1)}</span>}
            contents={<ListRow.Texts type="2RowTypeA" top={chat.name} bottom={chat.lastMessage} />}
            right={chat.time ? <small>{chat.time}</small> : undefined}
            onClick={() => chatRoomId == null ? setMessage('채팅방 정보를 확인할 수 없어요.') : selectionMode ? toggleChatSelection(chatRoomId) : goTo({ view: 'chatRoom', chat })}
          />
        );
        })}
      </div>
      {!loading && visibleChats.length === 0 && !message ? <p className="empty-text">채팅이 아직 존재하지 않아요.</p> : null}
      {!loading && visibleChats.length > 0 ? (
        <div className="list-pagination chat-pagination">
          <button type="button" disabled={page === 0 || loading} onClick={() => loadChats(Math.max(0, page - 1))}>이전</button>
          <span>{page + 1} / {chatTotalPages}</span>
          <button type="button" disabled={!chatCanGoNext || loading} onClick={() => loadChats(page + 1)}>다음</button>
        </div>
      ) : null}
      <TossAdSlot />
      <ConfirmDialog
        open={deleteConfirmChatIds.length > 0}
        title="채팅방 삭제"
        description={`선택한 채팅방 ${deleteConfirmChatIds.length}개를 내 목록에서 삭제할까요? 내 채팅 목록에서만 삭제되고, 신고 및 운영 확인을 위해 대화 기록은 서버에 보관됩니다.`}
        onClose={() => setDeleteConfirmChatIds([])}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setDeleteConfirmChatIds([])}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={deletingSelected} onClick={() => void deleteSelectedChats()}>{deletingSelected ? '삭제 중' : '삭제'}</ConfirmDialog.ConfirmButton>}
      />
    </section>
  );
}

function MyInfoScreen({ onRestartSetup, onAccountDeleted, goTo }: { onRestartSetup: () => void; onAccountDeleted: () => void; goTo: (route: ViewRoute) => void }) {
  const storedProfile = readStoredProfile();
  const [nickname, setNickname] = useState(storedProfile?.nickname ?? '물무');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(storedProfile?.nickname ?? '물무');
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileImage, setProfileImage] = useState(storedProfile?.profileImage ?? '');
  const [message, setMessage] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    writeStoredProfile({ nickname, profileImage });
  }, [nickname, profileImage]);

  useEffect(() => {
    let active = true;
    void getMyProfile()
      .then((profile) => {
        if (!active) return;
        const nextNickname = profile?.nickName ?? profile?.nickname ?? nickname;
        const nextImage = profile?.profileImageUrl ?? profile?.profileImage ?? profile?.imageUrl ?? profileImage;
        setNickname(nextNickname);
        setDraft(nextNickname);
        setProfileImage(nextImage ?? '');
        writeStoredProfile({ nickname: nextNickname, profileImage: nextImage ?? '' });
      })
      .catch((caughtError) => {
        if (!active || storedProfile) return;
        setMessage(getErrorMessage(caughtError, '프로필을 불러오지 못했어요.'));
      });
    return () => {
      active = false;
    };
  }, []);

  const saveProfileImage = async (uri: string) => {
    if (!uri || photoSaving) return;
    try {
      setPhotoSaving(true);
      const updated = await updateProfilePicture(uri);
      const nextImage = updated?.profileImageUrl ?? updated?.profileImage ?? updated?.imageUrl ?? uri;
      setProfileImage(nextImage);
      writeStoredProfile({ nickname, profileImage: nextImage });
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '프로필 사진을 저장하지 못했어요.'));
    } finally {
      setPhotoSaving(false);
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const uri = await getFirstAlbumImage(720);
      if (uri) {
        await saveProfileImage(uri);
      }
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '갤러리에서 프로필 사진을 가져오지 못했어요.'));
    }
  };
  const handleProfilePhotoClick = () => {
    if (photoSaving) return;
    if (isLocalPreviewHost()) {
      profileFileInputRef.current?.click();
      return;
    }
    void pickProfilePhoto();
  };
  const saveNickname = async () => {
    const nextNickname = draft.trim();
    if (!nextNickname) {
      setNicknameError('닉네임을 입력해 주세요.');
      return;
    }
    if (profileSaving) return;
    try {
      setProfileSaving(true);
      setNicknameError('');
      await updateNickname({ oldNickName: nickname, newNickName: nextNickname });
      setNickname(nextNickname);
      writeStoredProfile({ nickname: nextNickname, profileImage });
      setEditing(false);
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '닉네임을 저장하지 못했어요.'));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <section className="screen my-info">
      <header className="page-header compact">
        <h1>내 정보</h1>
      </header>
      <div className="profile-section">
        <button className="avatar" type="button" aria-label="프로필 사진 변경" disabled={photoSaving} onClick={handleProfilePhotoClick}>
          {profileImage ? <img src={profileImage} alt="" /> : null}
        </button>
        <input
          ref={profileFileInputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const uri = String(reader.result ?? '');
              void saveProfileImage(uri);
            };
            reader.readAsDataURL(file);
          }}
        />
        <div className="nickname-row">
          <strong>{nickname}</strong>
          <button type="button" onClick={() => {
            setDraft(nickname);
            setEditing(true);
          }}>수정</button>
        </div>
      </div>
      <section className="menu-card">
        <h2>맞춤 설정</h2>
        <button type="button" onClick={onRestartSetup}>
          <span>
            <strong>알레르기 / 식성 수정</strong>
            <small>추천에서 제외할 재료와 선호 음식을 관리해요</small>
          </span>
          <em>›</em>
        </button>
      </section>
      <section className="menu-card">
        <h2>거래</h2>
        <button type="button" onClick={() => goTo({ view: 'myPosts' })}><strong>내가 쓴 글</strong><em>›</em></button>
        <button type="button" onClick={() => goTo({ view: 'myShareHistory' })}><strong>나눔 내역</strong><em>›</em></button>
        <button type="button" onClick={() => goTo({ view: 'hiddenSharePosts' })}><strong>숨긴 나눔글</strong><em>›</em></button>
      </section>
      <section className="menu-card">
        <h2>서비스</h2>
        <AccountDeleteFlow onDeleted={onAccountDeleted} />
      </section>
      {message ? <p className="inline-message">{message}</p> : null}
      {editing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2>닉네임 수정</h2>
            <input value={draft} onChange={event => setDraft(event.target.value)} placeholder="새 닉네임을 입력해주세요" />
            {nicknameError ? <p className="inline-message" role="alert">{nicknameError}</p> : null}
            <div className="dialog-actions">
              <button type="button" onClick={() => {
                setNicknameError('');
                setEditing(false);
              }}>취소</button>
              <button type="button" disabled={profileSaving} onClick={() => void saveNickname()}>{profileSaving ? '저장 중' : '저장'}</button>
            </div>
          </div>
        </div>
      ) : null}
      <TossAdSlot />
    </section>
  );
}

function ShellHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="page-header compact detail-header">
      <button className="text-back-button" type="button" onClick={onBack}>이전</button>
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right ? <div className="detail-header-right">{right}</div> : null}
    </header>
  );
}

function DirectInputView({ onBack, onSaved }: { onBack: () => void; onSaved: (item: Ingredient) => void }) {
  const [ingredient, setIngredient] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDate(new Date()));
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedStandard, setSelectedStandard] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [activeIngredientCategory, setActiveIngredientCategory] = useState('채소/과일');
  const [message, setMessage] = useState('');
  const [predictionMessage, setPredictionMessage] = useState('');
  const directCategorySelectOptions = ingredientCategories
    .filter(item => item !== '전체')
    .map(item => ({ name: item, value: item }));

  const loadCategoryIngredients = async (nextCategory: string) => {
    setActiveIngredientCategory(nextCategory);
    try {
      const data = await getIngredientsByCategory(nextCategory);
      const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? [];
      setCategorySuggestions(Array.isArray(names) ? names : []);
    } catch {
      setCategorySuggestions([]);
    }
  };

  const selectStandardIngredient = (name: string, nextCategory = category) => {
    setIngredient(name);
    setCategory(nextCategory);
    setSelectedStandard(true);
    setSuggestions([]);
    setPredictionMessage('');
  };

  useEffect(() => {
    const keyword = ingredient.trim();
    if (selectedStandard || keyword.length === 0) {
      setSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchIngredients(keyword);
        const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? [];
        if (!cancelled) {
          setSuggestions(Array.isArray(names) ? names : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ingredient, selectedStandard]);

  useEffect(() => {
    if (!selectedStandard || !ingredient.trim() || !purchaseDate || expirationDate) {
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPredictionMessage('소비기한 예측 중이에요.');
      try {
        const data = await predictIngredientExpirations({ purchaseDate, ingredients: [ingredient.trim()] });
        const predictions = data?.result?.ingredients ?? data?.ingredients ?? data?.data?.ingredients ?? [];
        const predicted = Array.isArray(predictions)
          ? predictions.find((item: any) => item?.ingredientName === ingredient.trim() || item?.ingredient === ingredient.trim())?.expirationDate ?? predictions[0]?.expirationDate
          : null;
        if (!cancelled && predicted) {
          const normalizedPrediction = normalizeDateInputValue(predicted);
          setExpirationDate(normalizedPrediction);
          setPredictionMessage(`자동 계산된 소비기한: ${normalizedPrediction}`);
        }
      } catch {
        if (!cancelled) {
          setPredictionMessage('소비기한 예측에 실패했어요. 직접 입력해 주세요.');
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ingredient, purchaseDate, selectedStandard, expirationDate]);

  const submit = async () => {
    if (!ingredient.trim() || !expirationDate || !category) {
      setMessage('식재료명, 카테고리, 소비기한을 모두 입력해 주세요.');
      return;
    }
    if (!selectedStandard) {
      setMessage('검색 결과나 카테고리 목록에서 표준 식재료를 선택해 주세요.');
      return;
    }
    const item = { ingredient: ingredient.trim(), category, purchaseDate, expirationDate };
    try {
      await createIngredients([item]);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 서버에 저장하지 못했어요.'));
      return;
    }
    onSaved(normalizeIngredient(item, Date.now()));
  };

  return (
    <section className="screen direct-input-screen">
      <ShellHeader title="식재료 추가" onBack={onBack} />
      <section className="direct-input-card">
        <TextField
          variant="box"
          label="식재료"
          labelOption="sustain"
          value={ingredient}
          onChange={event => {
            setIngredient(event.target.value);
            setSelectedStandard(false);
            setExpirationDate('');
            setPredictionMessage('');
          }}
          placeholder="표준 식재료를 검색하거나 선택해주세요"
        />
        {suggestions.length > 0 ? (
          <div className="suggestion-list">
            {suggestions.map(name => (
              <button key={name} type="button" onClick={() => selectStandardIngredient(name)}>
                {name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="form-grid-two">
          <WheelDatePicker
            title="구매일자"
            triggerLabel="구매일자"
            format="yyyy-MM-dd"
            value={parseDateInputValue(purchaseDate)}
            initialDate={parseDateInputValue(purchaseDate)}
            onChange={(date) => {
              setPurchaseDate(formatDate(date));
              setExpirationDate('');
              setPredictionMessage('');
            }}
          />
          <TextField.Button
            variant="box"
            label="카테고리"
            labelOption="sustain"
            value={category || '선택'}
            onClick={() => setCategorySelectOpen(true)}
          />
        </div>
        <div className={`date-picker-field ${expirationDate ? 'has-value' : 'is-empty'}`}>
          <span>소비기한</span>
          <WheelDatePicker
            title="소비기한"
            triggerLabel=""
            format="yyyy-MM-dd"
            value={parseDateInputValue(expirationDate)}
            initialDate={parseDateInputValue(expirationDate) ?? parseDateInputValue(purchaseDate)}
            onChange={(date) => setExpirationDate(formatDate(date))}
          />
        </div>
      </section>
      {ingredient && !selectedStandard ? <p className="selection-hint">표준 재료 선택 필요</p> : null}
      {predictionMessage ? <p className="prediction-hint">{predictionMessage}</p> : null}
      <button className="category-picker-button" type="button" onClick={() => {
        setCategoryPickerOpen(current => !current);
        void loadCategoryIngredients(activeIngredientCategory);
      }}>
        <strong>카테고리에서 표준 식재료 고르기</strong>
        <small>검색이 어렵다면 목록에서 선택하세요.</small>
      </button>
      {categoryPickerOpen ? (
        <section className="category-picker-panel">
          <div className="category-picker-tabs">
            {ingredientCategories.filter(item => item !== '전체').map(item => (
              <button className={activeIngredientCategory === item ? 'selected' : ''} key={item} type="button" onClick={() => void loadCategoryIngredients(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="category-ingredient-list">
            {categorySuggestions.length === 0 ? <p>표시할 식재료가 없어요.</p> : categorySuggestions.map(name => (
              <button key={`${activeIngredientCategory}-${name}`} type="button" onClick={() => {
                selectStandardIngredient(name, activeIngredientCategory);
                setCategoryPickerOpen(false);
              }}>
                {name}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {categorySelectOpen ? (
        <BottomSheet
          className="direct-category-sheet"
          open={categorySelectOpen}
          onClose={() => setCategorySelectOpen(false)}
          header={<BottomSheet.Header>카테고리</BottomSheet.Header>}
        >
          <div className="tds-picker-section">
            <BottomSheet.Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setCategorySelectOpen(false);
              }}
              options={directCategorySelectOptions}
            />
          </div>
        </BottomSheet>
      ) : null}
      {message ? <p className="inline-message">{message}</p> : null}
      <Button display="block" onClick={submit}>저장하기</Button>
    </section>
  );
}

void DirectInputView;

type DirectInputItem = {
  name: string;
  rawName: string;
  purchaseDate: string;
  expirationDate: string;
  category: string;
  selected: boolean;
};

function DirectInputDetailView({
  initialItems = [],
  purchaseDate: initialPurchaseDate,
  onBack,
  onSaved,
}: {
  initialItems?: any[];
  purchaseDate?: string;
  onBack: () => void;
  onSaved: (items: Ingredient[]) => void;
}) {
  const getMappedIngredientName = (item?: any) => item?.ingredientName ?? item?.normalized_name ?? item?.ingredient ?? item?.name ?? '';
  const isMappedIngredient = (item?: any) => (
    item?.mapping_status === 'MAPPED'
    || item?.ingredientId != null
    || item?.ingredientName != null
    || item?.normalized_name != null
    || item?.selected === true
  );
  const makeInputItem = (item?: any): DirectInputItem => ({
    name: getMappedIngredientName(item) || item?.product_name || '',
    rawName: item?.raw_product_name ?? item?.product_name ?? '',
    purchaseDate: normalizeDateInputValue(item?.purchaseDate ?? initialPurchaseDate) || formatDate(new Date()),
    expirationDate: normalizeDateInputValue(item?.expirationDate ?? item?.date),
    category: item?.category ?? '',
    selected: isMappedIngredient(item),
  });
  const [items, setItems] = useState<DirectInputItem[]>(initialItems.length > 0 ? initialItems.map(makeInputItem) : [makeInputItem()]);
  const [editingIndex, setEditingIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [activeIngredientCategory, setActiveIngredientCategory] = useState('채소/과일');
  const [ingredientCategoryIndex, setIngredientCategoryIndex] = useState<Map<string, string>>(new Map());
  const [existingIngredientNames, setExistingIngredientNames] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [predictionMessage, setPredictionMessage] = useState('');
  const currentItem = items[editingIndex] ?? items[0];
  const directCategorySelectOptions = ingredientCategories
    .filter(item => item !== '전체')
    .map(item => ({ name: item, value: item }));
  const standardIngredientSelectOptions = categorySuggestions.map(name => ({ name, value: name }));

  const updateItem = (index: number, patch: Partial<DirectInputItem>) => {
    setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const loadCategoryIngredients = async (nextCategory: string) => {
    setActiveIngredientCategory(nextCategory);
    try {
      const data = await getIngredientsByCategory(nextCategory);
      const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? [];
      setCategorySuggestions(Array.isArray(names) ? names : []);
    } catch {
      setCategorySuggestions([]);
    }
  };
  const selectStandardIngredient = (name: string, nextCategory = ingredientCategoryIndex.get(name) || currentItem?.category || activeIngredientCategory) => {
    updateItem(editingIndex, { name, category: nextCategory, selected: true, expirationDate: '' });
    setSuggestions([]);
    setPredictionMessage('');
  };
  const addBlankItem = () => {
    setItems(current => [...current, makeInputItem()]);
    setEditingIndex(items.length);
  };
  const removeItem = (index: number) => {
    setItems(current => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [makeInputItem()];
    });
    setEditingIndex(current => Math.max(0, Math.min(current, items.length - 2)));
  };

  useEffect(() => {
    void fetchMyIngredients({ sort: 'date&ascending' }).then((data) => {
      setExistingIngredientNames(new Set(normalizeIngredientItems(data).map(item => item.name).filter(Boolean)));
    }).catch(() => setExistingIngredientNames(new Set()));
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all(ingredientCategories.filter(item => item !== '전체').map(async (categoryName) => {
      try {
        const data = await getIngredientsByCategory(categoryName);
        const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? [];
        return Array.isArray(names) ? names.map((name: string) => [name, categoryName] as const) : [];
      } catch {
        return [];
      }
    })).then((entriesByCategory) => {
      if (active) {
        setIngredientCategoryIndex(new Map(entriesByCategory.flat()));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ingredientCategoryIndex.size === 0) return;
    setItems(current => current.map(item => {
      const canonicalCategory = ingredientCategoryIndex.get(item.name);
      return canonicalCategory ? { ...item, category: canonicalCategory, selected: true } : item;
    }));
  }, [ingredientCategoryIndex]);

  useEffect(() => {
    const keyword = currentItem?.name.trim() ?? '';
    if (keyword.length === 0) {
      setSuggestions([]);
      return undefined;
    }
    const exactCanonicalName = ingredientCategoryIndex.has(keyword) ? keyword : '';
    if (currentItem?.selected && exactCanonicalName.length === 0) {
      setSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchIngredients(keyword);
        const names = data?.ingredientNames ?? data?.result?.ingredientNames ?? data?.data?.ingredientNames ?? data?.ingredient_names ?? [];
        const mergedNames = [exactCanonicalName, ...(Array.isArray(names) ? names : [])].filter(Boolean);
        if (!cancelled) setSuggestions(Array.from(new Set(mergedNames)));
      } catch {
        if (!cancelled) setSuggestions(exactCanonicalName ? [exactCanonicalName] : []);
      }
    }, exactCanonicalName ? 0 : 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentItem?.name, currentItem?.selected, editingIndex, ingredientCategoryIndex]);

  useEffect(() => {
    const targets = items
      .map((item, index) => ({ ...item, index }))
      .filter(item => item.selected && item.name.trim() && item.purchaseDate && !item.expirationDate);
    if (targets.length === 0) {
      setPredictionMessage('');
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPredictionMessage('소비기한 예측 중이에요.');
      try {
        const predictionsByIndex: Record<number, string> = {};
        const grouped = targets.reduce<Record<string, typeof targets>>((acc, item) => {
          acc[item.purchaseDate] = [...(acc[item.purchaseDate] ?? []), item];
          return acc;
        }, {});
        await Promise.all(Object.entries(grouped).map(async ([purchaseDate, groupItems]) => {
          const data = await predictIngredientExpirations({ purchaseDate, ingredients: groupItems.map(item => item.name.trim()) });
          const predictions = data?.result?.ingredients ?? data?.ingredients ?? data?.data?.ingredients ?? [];
          const byName = new Map<string, string>((Array.isArray(predictions) ? predictions : [])
            .map((item: any): [string, string] => [String(item.ingredientName ?? item.ingredient ?? ''), normalizeDateInputValue(item.expirationDate)])
            .filter(([name, date]) => Boolean(name && date)));
          groupItems.forEach(item => {
            const date = byName.get(item.name.trim());
            if (date) predictionsByIndex[item.index] = date;
          });
        }));
        if (!cancelled) {
          setItems(current => current.map((item, index) => predictionsByIndex[index] && !item.expirationDate ? { ...item, expirationDate: predictionsByIndex[index] } : item));
          setPredictionMessage(Object.keys(predictionsByIndex).length > 0 ? '소비기한 예측이 반영됐어요.' : '소비기한 예측에 실패했어요. 직접 입력해 주세요.');
        }
      } catch {
        if (!cancelled) setPredictionMessage('소비기한 예측에 실패했어요. 직접 입력해 주세요.');
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [items]);

  const submit = async () => {
    const hasPendingPrediction = items.some(item => item.selected && item.name.trim() && item.purchaseDate && !item.expirationDate);
    if (hasPendingPrediction) {
      setMessage('소비기한 예측이 끝난 뒤 다시 저장해주세요!');
      return;
    }
    const payload = items.map(item => ({
      ingredient: item.name.trim(),
      purchaseDate: item.purchaseDate,
      expirationDate: item.expirationDate,
      category: item.category,
    })).filter(item => item.ingredient || item.expirationDate || item.category);
    const duplicateNames = payload
      .map(item => item.ingredient)
      .filter(Boolean)
      .filter((name, index, names) => existingIngredientNames.has(name) || names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      setMessage(`${[...new Set(duplicateNames)].join(', ')}은 이미 추가된 식재료예요.`);
      return;
    }
    if (items.some(item => item.name.trim() && !item.selected)) {
      setMessage('검색 결과나 카테고리 목록에서 표준 식재료를 선택해 주세요.');
      return;
    }
    if (payload.length === 0 || payload.some(item => !item.ingredient || !item.purchaseDate || !item.expirationDate || !item.category)) {
      setMessage('모든 항목의 식재료명, 구매일자, 카테고리, 소비기한을 입력해 주세요.');
      return;
    }
    try {
      await createIngredients(payload);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 서버에 저장하지 못했어요.'));
      return;
    }
    onSaved(payload.map(normalizeIngredient));
  };

  return (
    <section className="screen direct-input-screen">
      <ShellHeader title="식재료 추가" onBack={onBack} />
      <section className="direct-input-card">
        {items.length > 1 ? (
          <div className="detected-panel">
            <strong>인식된 품목 {items.length}개</strong>
            <small>각 품목을 눌러 구매일자와 카테고리를 확인해 주세요.</small>
            <div>{items.map((item, index) => <button className={editingIndex === index ? 'selected' : ''} key={`${item.name}-${index}`} type="button" onClick={() => setEditingIndex(index)}>{item.name || `품목 ${index + 1}`}</button>)}</div>
          </div>
        ) : null}
        <TextField
          variant="box"
          label="식재료"
          labelOption="sustain"
          value={currentItem?.name ?? ''}
          onChange={event => {
            updateItem(editingIndex, { name: event.target.value, selected: false, expirationDate: '' });
            setPredictionMessage('');
          }}
          placeholder="표준 식재료를 검색하거나 선택해주세요"
        />
        {suggestions.length > 0 ? <div className="suggestion-list">{suggestions.map(name => <button key={name} type="button" onClick={() => selectStandardIngredient(name)}>{name}</button>)}</div> : null}
        {currentItem?.name && !currentItem.selected ? <p className="selection-hint">표준 재료 선택 필요</p> : null}
        <div className="form-grid-two">
          <WheelDatePicker
            title="구매일자"
            triggerLabel="구매일자"
            format="yyyy-MM-dd"
            value={parseDateInputValue(currentItem?.purchaseDate)}
            initialDate={parseDateInputValue(currentItem?.purchaseDate)}
            onChange={(date) => updateItem(editingIndex, { purchaseDate: formatDate(date), expirationDate: '' })}
          />
          <TextField.Button
            variant="box"
            label="카테고리"
            labelOption="sustain"
            value={currentItem?.category || '선택'}
            onClick={() => setCategorySelectOpen(true)}
          />
        </div>
        <div className={`date-picker-field ${currentItem?.expirationDate ? 'has-value' : 'is-empty'}`}>
          <span>소비기한</span>
          <WheelDatePicker
            title="소비기한"
            triggerLabel=""
            format="yyyy-MM-dd"
            value={parseDateInputValue(currentItem?.expirationDate)}
            initialDate={parseDateInputValue(currentItem?.expirationDate) ?? parseDateInputValue(currentItem?.purchaseDate)}
            min={parseDateInputValue(currentItem?.purchaseDate)}
            onChange={(date) => updateItem(editingIndex, { expirationDate: formatDate(date) })}
          />
        </div>
        {predictionMessage ? <p className="prediction-hint">{predictionMessage}</p> : null}
        <button className="category-picker-button" type="button" onClick={() => {
          setCategoryPickerOpen(true);
          void loadCategoryIngredients(activeIngredientCategory);
        }}>
          <strong>카테고리에서 표준 식재료 고르기</strong>
          <small>검색이 어렵다면 목록에서 선택하세요.</small>
        </button>
        {categoryPickerOpen ? (
          <BottomSheet
            className="direct-standard-sheet"
            open={categoryPickerOpen}
            onClose={() => setCategoryPickerOpen(false)}
            header={<BottomSheet.Header>표준 식재료 선택</BottomSheet.Header>}
          >
            <div className="tds-picker-section">
              <strong className="edit-label">카테고리</strong>
              <BottomSheet.Select
                value={activeIngredientCategory}
                onChange={(event) => {
                  void loadCategoryIngredients(event.target.value);
                }}
                options={directCategorySelectOptions}
              />
            </div>
            <div className="tds-picker-section">
              <strong className="edit-label">식재료</strong>
              {standardIngredientSelectOptions.length === 0 ? <p className="empty-text">표시할 식재료가 없어요.</p> : (
                <BottomSheet.Select
                  value={standardIngredientSelectOptions.some(option => option.value === currentItem?.name) ? currentItem?.name : ''}
                  onChange={(event) => {
                    selectStandardIngredient(event.target.value, activeIngredientCategory);
                    setCategoryPickerOpen(false);
                  }}
                  options={standardIngredientSelectOptions}
                />
              )}
            </div>
          </BottomSheet>
        ) : null}
        {categorySelectOpen ? (
          <BottomSheet
            className="direct-category-sheet"
            open={categorySelectOpen}
            onClose={() => setCategorySelectOpen(false)}
            header={<BottomSheet.Header>카테고리</BottomSheet.Header>}
          >
            <div className="tds-picker-section">
              <BottomSheet.Select
                value={currentItem?.category ?? ''}
                onChange={(event) => {
                  updateItem(editingIndex, { category: event.target.value });
                  setCategorySelectOpen(false);
                }}
                options={directCategorySelectOptions}
              />
            </div>
          </BottomSheet>
        ) : null}
        <div className="list-actions">
          <button type="button" onClick={addBlankItem}>품목 추가</button>
          {items.length > 1 ? <button type="button" onClick={() => removeItem(editingIndex)}>현재 품목 삭제</button> : null}
        </div>
      </section>
      {message ? <p className="inline-message">{message}</p> : null}
      <Button display="block" onClick={submit}>완료</Button>
    </section>
  );
}

function ReceiptGalleryView({ onBack, onAnalyze }: { onBack: () => void; onAnalyze: (image: { dataUri?: string; uri?: string }) => void }) {
  const showLocalFilePicker = isLocalPreviewHost();
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState(showLocalFilePicker ? '' : '갤러리 불러오는 중...');

  const openNativeAlbum = async () => {
    setMessage('갤러리 불러오는 중...');
    try {
      const permission = await fetchAlbumPhotos.getPermission();
      if (permission === 'denied') {
        setMessage('사진첩 권한이 거부되어 있어요. 권한 요청 후 다시 선택해 주세요.');
        return;
      }
      const dataUri = await getFirstAlbumImage(1280);
      if (dataUri) {
        setPreview(dataUri);
        setMessage('선택한 영수증을 확인한 뒤 분석을 시작해 주세요.');
        return;
      }
      setMessage('선택한 사진이 없어요.');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '갤러리 접근 권한이 필요해요. 로컬 브라우저라면 아래 파일 선택을 사용해 주세요.'));
    }
  };

  useEffect(() => {
    if (!showLocalFilePicker) {
      void openNativeAlbum();
    }
  }, [showLocalFilePicker]);

  return (
    <section className="screen form-screen">
      <ShellHeader title="영수증 등록" subtitle="갤러리에서 영수증 이미지를 선택해요." onBack={onBack} />
      {message ? <p className="inline-message">{message}</p> : null}
      {!showLocalFilePicker ? (
        <>
          <button className="secondary-action" type="button" onClick={openNativeAlbum}>앱 사진첩 다시 열기</button>
          <button className="secondary-action" type="button" onClick={async () => {
            const permission = await fetchAlbumPhotos.openPermissionDialog();
            setMessage(permission === 'allowed' ? '사진첩 권한이 허용됐어요. 다시 사진을 선택해 주세요.' : '사진첩 권한이 필요해요.');
          }}>사진첩 권한 요청하기</button>
        </>
      ) : null}
      {showLocalFilePicker ? <label className="file-picker">
        <input type="file" accept="image/*" onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setPreview(String(reader.result ?? ''));
          reader.readAsDataURL(file);
        }} />
        로컬 파일 선택
      </label> : null}
      {preview ? <img className="receipt-preview" src={preview} alt="선택한 영수증" /> : null}
      <Button display="block" disabled={!preview} onClick={() => onAnalyze({ dataUri: preview })}>분석하기</Button>
    </section>
  );
}

function ReceiptCameraView({ onBack, onCapture }: { onBack: () => void; onCapture: (image: { dataUri?: string; uri?: string }) => void }) {
  const [message, setMessage] = useState('');
  const capture = async () => {
    try {
      const permission = await openCamera.getPermission();
      if (permission === 'denied') {
        setMessage('카메라 권한이 거부되어 있어요. 권한 요청 후 다시 촬영해 주세요.');
        return;
      }
      const image = await openCamera({ base64: true, maxWidth: 1280 });
      onCapture(image);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '영수증을 촬영하지 못했어요.'));
    }
  };

  return (
    <section className="screen form-screen receipt-camera-screen">
      <ShellHeader title="영수증 촬영" subtitle="영수증 전체가 보이도록 밝은 곳에서 촬영해요." onBack={onBack} />
      <section className="receipt-camera-guide">
        <strong>촬영 가이드</strong>
        <p>가게명, 구매일자, 품목명이 잘리지 않게 화면 안에 맞춰주세요.</p>
        <small>흔들림이나 그림자가 있으면 인식 결과가 부정확할 수 있어요.</small>
      </section>
      {message ? <p className="inline-message">{message}</p> : null}
      <button className="secondary-action" type="button" onClick={async () => {
        const permission = await openCamera.openPermissionDialog();
        setMessage(permission === 'allowed' ? '카메라 권한이 허용됐어요. 다시 촬영해 주세요.' : '카메라 권한이 필요해요.');
      }}>카메라 권한 요청하기</button>
      <Button display="block" onClick={capture}>영수증 촬영하기</Button>
    </section>
  );
}

function ReceiptLoadingView({ image, onBack, onComplete }: { image: { dataUri?: string; uri?: string }; onBack: () => void; onComplete: (items: any[], purchaseDate?: string) => void }) {
  const [message, setMessage] = useState('영수증을 분석하고 있어요.');

  useEffect(() => {
    let active = true;
    let fallbackTimer: number | undefined;
    const run = async () => {
      try {
        const analyzed = await analyzeReceiptImage(image);
        const result = analyzed?.result ?? analyzed?.data ?? analyzed;
        const foodItems = result?.food_items ?? [];
        if (active) onComplete(Array.isArray(foodItems) ? foodItems : [], normalizeDateInputValue(result?.purchased_at ?? result?.purchaseDate));
      } catch (caughtError) {
        if (!active) return;
        setMessage(getErrorMessage(caughtError, '영수증 분석에 실패했어요.'));
        fallbackTimer = window.setTimeout(() => {
          if (active) onComplete([]);
        }, 700);
      }
    };
    void run();
    return () => {
      active = false;
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
    };
  }, [image, onComplete]);

  return (
    <section className="screen detail-screen center-screen">
      <ShellHeader title="영수증 분석" onBack={onBack} />
      <span className="spinner" />
      <p>{message}</p>
      <small className="field-guide-text">AI가 인식한 식재료명과 분류, 소비기한은 틀릴 수 있어요. 저장하기 전에 다음 화면에서 꼭 확인해 주세요.</small>
    </section>
  );
}

function ReceiptResultView({ items, onBack, onSaved }: { items: Ingredient[]; onBack: () => void; onSaved: (items: Ingredient[]) => void }) {
  const [message, setMessage] = useState('');
  const save = async () => {
    const purchaseDate = new Date().toISOString().slice(0, 10);
    let expirationByName = new Map<string, string>();
    try {
      const predicted = await predictIngredientExpirations({ purchaseDate, ingredients: items.map(item => item.name) });
      const predictions = predicted?.result?.ingredients ?? predicted?.ingredients ?? predicted?.data?.ingredients ?? [];
      if (Array.isArray(predictions)) {
        const entries: Array<[string, string]> = predictions
          .map((item: any): [string, string] => [
            String(item.ingredientName ?? item.ingredient ?? ''),
            String(item.expirationDate ?? ''),
          ])
          .filter(([name, date]) => name.length > 0 && date.length > 0);
        expirationByName = new Map(entries);
      }
    } catch {
      expirationByName = new Map();
    }
    const payload = items.map(item => ({
      ingredient: item.name,
      category: item.category,
      purchaseDate,
      expirationDate: expirationByName.get(item.name) ?? item.date ?? purchaseDate,
    }));
    try {
      await createIngredients(payload);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 서버에 저장하지 못했어요.'));
      return;
    }
    onSaved(payload.map(normalizeIngredient));
  };

  return (
    <section className="screen detail-screen">
      <ShellHeader title="영수증 결과" subtitle="인식된 식재료를 확인해요." onBack={onBack} />
      <div className="item-list">{items.map(item => <article className="ingredient-row" key={item.id}><span className="item-copy"><strong>{item.name}</strong><small>{item.category}</small></span><span className="item-meta"><em className={`dday ${getDdayClass(item.dday)}`}>{item.dday}</em></span></article>)}</div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="sticky-actions"><Button display="block" onClick={save}>냉장고에 저장</Button></div>
    </section>
  );
}

function RecipeRecommendView({ ingredients, onBack, onComplete }: { ingredients: Ingredient[]; onBack: () => void; onComplete: (recipes: Recipe[] | undefined, selectedIngredients: string[]) => void }) {
  const [message, setMessage] = useState('');
  const [backendIngredients, setBackendIngredients] = useState<Ingredient[]>(ingredients);
  const [activeTab, setActiveTab] = useState(recommendTabs[0]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(() => ingredients.slice(0, 2).map(item => item.id));

  useEffect(() => {
    let active = true;
    void fetchMyIngredients({ sort: 'date&ascending' }).then((data) => {
      if (active) {
        const normalized = normalizeIngredientItems(data);
        const seenNames = new Set<string>();
        const uniqueByName = normalized.filter((item) => {
          const key = item.name.trim();
          if (!key || seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        });
        setBackendIngredients(uniqueByName);
        setSelectedIngredientIds(uniqueByName.slice(0, 2).map(item => item.id));
      }
    }).catch((caughtError) => {
      if (active) {
        setMessage(getErrorMessage(caughtError, '내 식자재를 불러오지 못했어요.'));
        setBackendIngredients(ingredients);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredIngredients = activeTab === '임박한 재료'
    ? backendIngredients.filter(item => getDdayNumber(item.dday) <= 3)
    : backendIngredients;

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredientIds(current => (
      current.includes(ingredientId)
        ? current.filter(item => item !== ingredientId)
        : [...current, ingredientId]
    ));
  };

  const run = () => {
    const names = [...new Set(backendIngredients
      .filter(item => selectedIngredientIds.includes(item.id))
      .map(item => item.name))];
    if (names.length === 0) {
      setMessage('재료를 선택해주세요.');
      return;
    }
    onComplete(undefined, names);
  };
  return (
    <section className="screen form-screen recipe-recommend-screen">
      <ShellHeader title="레시피 추천" onBack={onBack} />
      <div className="segmented recommend-tabs">
        {recommendTabs.map(tab => (
          <button className={activeTab === tab ? 'active' : ''} key={tab} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <div className="recommend-ingredient-list">
        {filteredIngredients.length === 0 ? (
          <p className="empty-text">{activeTab === '임박한 재료' ? '임박한 재료가 없어요.' : '등록된 재료가 없어요.'}</p>
        ) : filteredIngredients.map(item => {
          const selected = selectedIngredientIds.includes(item.id);
          return (
            <button className={`recommend-ingredient-row ${selected ? 'selected' : ''}`} key={item.id} type="button" onClick={() => toggleIngredient(item.id)}>
              <span className={`check ${selected ? 'on' : ''}`}>{selected ? '✓' : ''}</span>
              <span>
                <strong>{item.name}</strong>
                {getDdayNumber(item.dday) <= 3 ? <small>임박한 재료</small> : null}
              </span>
            </button>
          );
        })}
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="sticky-actions">
        <Button display="block" disabled={selectedIngredientIds.length === 0} onClick={run}>선택한 재료로 레시피 추천받기</Button>
      </div>
    </section>
  );
}

function RecipeResultView({
  recipes,
  selectedIngredients = [],
  allergies = [],
  preferIngredients = [],
  dispreferIngredients = [],
  onBack,
  goTo,
}: {
  recipes?: Recipe[];
  selectedIngredients?: string[];
  allergies?: string[];
  preferIngredients?: string[];
  dispreferIngredients?: string[];
  onBack: () => void;
  goTo: (route: ViewRoute) => void;
}) {
  const [activeTab, setActiveTab] = useState<'전체' | '내 재료로만' | '재료 추가 필요'>('전체');
  const [activeIngredients, setActiveIngredients] = useState(selectedIngredients);
  const [resultRecipes, setResultRecipes] = useState<Recipe[]>(recipes ?? []);
  const [loading, setLoading] = useState(!recipes);
  const [message, setMessage] = useState('');
  const [resultPage, setResultPage] = useState(0);

  useEffect(() => {
    setActiveIngredients(selectedIngredients);
  }, [selectedIngredients]);

  useEffect(() => {
    if (recipes) {
      setResultRecipes(recipes);
      setLoading(false);
      setMessage('');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setMessage('');
    void requestRecommendations({ ingredients: selectedIngredients, allergies, preferIngredients, dispreferIngredients })
      .then((data) => {
        if (!active) return;
        const result = data?.data?.recommendations ?? data?.result?.recommendations ?? [];
        setResultRecipes(Array.isArray(result) ? result.map(normalizeRecipe) : []);
      })
      .catch((caughtError) => {
        if (active) {
          setMessage(getErrorMessage(caughtError, '레시피 추천을 불러오지 못했어요.'));
          setResultRecipes([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recipes, selectedIngredients, allergies, preferIngredients, dispreferIngredients]);

  const filteredRecipes = resultRecipes.filter(recipe => {
    const missingCount = recipe.matchDetails?.missing?.length ?? 0;
    const activeSet = new Set(activeIngredients);
    const ingredientMatched = activeSet.size === 0 || (recipe.matchDetails?.matched ?? []).some(name => activeSet.has(name));
    if (activeTab === '내 재료로만') return (recipe.hasAll === true || missingCount === 0) && ingredientMatched;
    if (activeTab === '재료 추가 필요') return missingCount > 0 && ingredientMatched;
    return ingredientMatched;
  });
  const totalResultPages = Math.max(1, Math.ceil(filteredRecipes.length / recipeResultPageSize));
  const pagedRecipes = filteredRecipes.slice(resultPage * recipeResultPageSize, (resultPage + 1) * recipeResultPageSize);

  useEffect(() => {
    setResultPage(0);
  }, [activeTab, activeIngredients, resultRecipes]);

  useEffect(() => {
    if (resultPage > totalResultPages - 1) {
      setResultPage(Math.max(0, totalResultPages - 1));
    }
  }, [resultPage, totalResultPages]);

  const toggleActiveIngredient = (name: string) => {
    setActiveIngredients(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  };
  return (
    <section className="screen detail-screen">
      <ShellHeader title="추천 결과" subtitle={selectedIngredients.length > 0 ? `${selectedIngredients.length}개 재료 기준 추천이에요.` : '지금 만들기 좋은 순서예요.'} onBack={onBack} />
      <section className="recipe-result-summary">
        <div>
          <strong>추천 기준</strong>
          <small>필요 재료의 절반 이상을 보유한 레시피만 추천하고, 알레르기 설정을 함께 반영했어요.</small>
        </div>
        <div className="selected-ingredient-strip">
          {selectedIngredients.length === 0 ? <span>선택한 재료 없음</span> : selectedIngredients.map(name => (
            <button className={activeIngredients.includes(name) ? 'active' : ''} key={name} type="button" onClick={() => toggleActiveIngredient(name)}>{name}</button>
          ))}
        </div>
      </section>
      <div className="segmented recommend-tabs">
        {(['전체', '내 재료로만', '재료 추가 필요'] as const).map(tab => (
          <button className={activeTab === tab ? 'active' : ''} key={tab} type="button" onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="recipe-list">
        {loading ? <p className="empty-text">추천 레시피를 불러오고 있어요.</p> : filteredRecipes.length === 0 ? <p className="empty-text">필요 재료의 절반 이상을 보유한 추천 레시피가 없어요.</p> : pagedRecipes.map(recipe => {
          const missing = recipe.matchDetails?.missing ?? [];
          const matched = recipe.matchDetails?.matched ?? [];
          return (
            <button className="recipe-card recipe-result-card" key={recipe.recipeId} type="button" onClick={() => goTo({ view: 'recipeDetail', recipe, selectedIngredients: activeIngredients })}>
              <span><img src={recipe.imageUrl || (recipeVisuals[recipe.category] ?? recipeVisuals.반찬)?.image} alt="" /></span>
              <div>
                <strong>{recipe.title}</strong>
                <span className="recipe-match-summary">
                  <em>보유 {matched.length}개</em>
                  <em className={missing.length > 0 ? 'needs' : 'ready'}>{missing.length > 0 ? `부족 ${missing.length}개` : '바로 가능'}</em>
                </span>
                <small>보유 재료: {matched.length > 0 ? matched.join(', ') : '확인 필요'}</small>
                {missing.length > 0 ? <p className="missing-text">추가 필요: {missing.join(', ')}</p> : <p className="matched-text">내 재료로 만들 수 있어요</p>}
              </div>
            </button>
          );
        })}
      </div>
      {!loading && filteredRecipes.length > 0 ? (
        <div className="recipe-pagination recipe-result-pagination">
          <button type="button" disabled={resultPage === 0} onClick={() => setResultPage(page => Math.max(0, page - 1))}>이전</button>
          <span>{resultPage + 1} / {totalResultPages}</span>
          <button type="button" disabled={resultPage >= totalResultPages - 1} onClick={() => setResultPage(page => Math.min(totalResultPages - 1, page + 1))}>다음</button>
        </div>
      ) : null}
    </section>
  );
}

function RecipeDetailView({ recipe, selectedIngredients = [], onBack }: { recipe: Recipe; selectedIngredients?: string[]; onBack: () => void }) {
  const [detail, setDetail] = useState<any>(normalizeRecipeDetail(recipe, recipe));
  useEffect(() => {
    void getRecipeDetail(recipe.recipeId)
      .then((data) => setDetail(normalizeRecipeDetail(data, recipe)))
      .catch(() => setDetail(normalizeRecipeDetail(recipe, recipe)));
  }, [recipe]);
  const visual = recipeVisuals[detail.category] ?? recipeVisuals.반찬;
  const selectedSet = new Set(selectedIngredients);
  const missingSet = new Set(recipe.matchDetails?.missing ?? []);
  return (
    <section className="screen detail-screen recipe-detail-screen">
      <ShellHeader title={detail.title} subtitle={detail.category} onBack={onBack} />
      <div className="recipe-detail-hero" style={{ backgroundColor: visual?.color }}>
        <img src={detail.imageUrl || visual?.image} alt="" />
      </div>
      <section className="summary-card recipe-ingredient-card">
        <h2>필요한 재료</h2>
        <div className="ingredient-detail-list">
          {detail.ingredientRows.length === 0 ? <p>재료 정보 없음</p> : detail.ingredientRows.map((item: any, index: number) => (
            <div className={missingSet.has(item.name) ? 'missing' : selectedSet.has(item.name) ? 'matched' : ''} key={`${item.label}-${index}`}>
              <strong>{item.name}</strong>
              <small>{missingSet.has(item.name) ? `추가 필요 · ${item.amount || '분량 정보 없음'}` : selectedSet.has(item.name) ? `보유 중 · ${item.amount || '분량 정보 없음'}` : item.amount || '분량 정보 없음'}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="summary-card recipe-step-card">
        <h2>조리 방법</h2>
        {detail.steps.length > 0 ? (
          <ol>
            {detail.steps.map((item: any, index: number) => <li key={`${item.order}-${index}`}>{item.text}</li>)}
          </ol>
        ) : (
          <p>{detail.manual || '상세 조리 방법은 레시피 서버 응답에 따라 표시돼요.'}</p>
        )}
      </section>
    </section>
  );
}

function LocationSettingView({ onBack, onSaved, onBrowse }: { onBack: () => void; onSaved: () => void; onBrowse: (location: BrowseLocation) => void }) {
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedSiCode, setSelectedSiCode] = useState(activeSiList[0]?.code ?? '');
  const [selectedGuCode, setSelectedGuCode] = useState('');
  const [selectedDongCode, setSelectedDongCode] = useState('');
  const [message, setMessage] = useState('');
  const [savedLocationLabel, setSavedLocationLabel] = useState('');

  const guOptions = activeGuList.filter(item => item.siCode === selectedSiCode);
  const dongOptions = selectedGuCode ? activeDongList.filter(item => item.guCode === selectedGuCode) : [];
  const selectedDong = activeDongList.find(item => item.code === selectedDongCode);

  useEffect(() => {
    void getMyShareLocation().then((location) => {
      const label = getLocationLabel(location);
      if (label) {
        setMessage(`현재 설정: ${label}`);
      }
    }).catch(() => undefined);
  }, []);

  const selectSi = (siCode: string) => {
    setSelectedSiCode(siCode);
    setSelectedGuCode('');
    setSelectedDongCode('');
  };

  const selectGu = (guCode: string) => {
    setSelectedGuCode(guCode);
    setSelectedDongCode('');
  };

  const saveCoordinate = async (coordinate: { latitude: number; longitude: number }) => {
    const result = await updateShareLocation({
      ...coordinate,
      verificationLatitude: coordinate.latitude,
      verificationLongitude: coordinate.longitude,
    });
    onSaved();
    const label = result?.display_address ?? result?.full_address ?? selectedDong?.fullName ?? '선택한 위치';
    setMessage(`위치 설정 완료: ${label}`);
    setSavedLocationLabel(label);
  };

  const browseSelectedLocation = async () => {
    if (!selectedDong || resolving) {
      setMessage('시/도, 시/군/구, 읍/면/동을 순서대로 선택해 주세요.');
      return;
    }
    setResolving(true);
    try {
      const candidates = await searchShareLocations(selectedDong.fullName);
      const candidate = Array.isArray(candidates)
        ? candidates.find(item => item.full_address === selectedDong.fullName) ?? candidates[0]
        : null;
      const { latitude, longitude } = getLocationCoordinate(candidate);
      if (!candidate || latitude == null || longitude == null) {
        setMessage('선택한 행정구역의 좌표를 찾지 못했어요.');
        return;
      }
      onBrowse({
        label: candidate?.display_address ?? selectedDong.name,
        address: candidate?.full_address ?? selectedDong.fullName,
        latitude,
        longitude,
      });
      onSaved();
      const label = candidate?.display_address ?? selectedDong.name;
      setMessage(`둘러보기 위치 설정: ${label}`);
      setSavedLocationLabel(label);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '선택한 동네를 둘러보기 위치로 설정하지 못했어요.'));
    } finally {
      setResolving(false);
    }
  };

  const useCurrent = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const current = await getCurrentLocation({ accuracy: Accuracy.Balanced });
      await saveCoordinate({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    } catch (sdkError) {
      if (!navigator.geolocation) {
        setMessage(getErrorMessage(sdkError, '현재 위치를 설정하지 못했어요.'));
        setLoading(false);
        return;
      }
      try {
        const current = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        await saveCoordinate({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      } catch (caughtError) {
        setMessage(getErrorMessage(caughtError, '현재 위치를 설정하지 못했어요.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen location-screen">
      <ShellHeader title="나눔 위치 설정" onBack={onBack} />
      {message ? <p className="inline-message">{message}</p> : null}
      <section className="location-selector-fields">
        <div className="region-selector-grid">
          <section className="region-list" aria-label="시/도 선택">
            <strong>시/도</strong>
            <div>
              {activeSiList.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={item.code === selectedSiCode ? 'selected' : ''}
                  onClick={() => selectSi(item.code)}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="region-list" aria-label="시/군/구 선택">
            <strong>시/군/구</strong>
            <div>
              {guOptions.length === 0 ? (
                <p className="empty-text">시/도를 선택해 주세요.</p>
              ) : guOptions.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={item.code === selectedGuCode ? 'selected' : ''}
                  onClick={() => selectGu(item.code)}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <section className="dong-selector-panel" aria-label="읍/면/동 선택">
          {dongOptions.length === 0 ? (
            <p className="empty-text">시/군/구를 선택하면 읍/면/동이 표시돼요.</p>
          ) : (
            <div className="dong-choice-list">
              {dongOptions.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={`dong-choice ${item.code === selectedDongCode ? 'selected' : ''}`}
                  onClick={() => setSelectedDongCode(item.code)}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>
      <section className="location-actions">
        <Button
          className="location-action-button"
          display="block"
          variant="weak"
          disabled={!selectedDong || resolving}
          onClick={browseSelectedLocation}
        >
          {resolving ? '위치 변환 중' : selectedDong ? `${selectedDong.name} 둘러보기` : '읍/면/동을 선택해 주세요'}
        </Button>
        <Button className="location-action-button" display="block" disabled={loading} onClick={useCurrent}>{loading ? '위치 인증 중' : '현재 위치로 인증하기'}</Button>
      </section>
      {savedLocationLabel ? (
        <ConfirmDialog
          open={Boolean(savedLocationLabel)}
          title="위치 설정 완료"
          description={`${savedLocationLabel} 기준으로 주변 나눔을 보여드릴게요.`}
          onClose={onBack}
          confirmButton={<ConfirmDialog.ConfirmButton onClick={onBack}>확인</ConfirmDialog.ConfirmButton>}
        />
      ) : null}
    </section>
  );
}

function MarketWriteView({ post, onBack, onSaved }: { post?: SharePost; onBack: () => void; onSaved?: () => void }) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [ingredientName, setIngredientName] = useState(post?.food ?? '');
  const [category, setCategory] = useState(post?.category && shareAllowedCategories.includes(post.category) ? post.category : '채소/과일');
  const [expirationDate, setExpirationDate] = useState(post?.expirationDate ?? '');
  const [content, setContent] = useState(post?.description ?? '');
  const [ownedIngredients, setOwnedIngredients] = useState<Ingredient[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(post?.imageUrl ?? null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [foodDropdownVisible, setFoodDropdownVisible] = useState(false);
  const [safetyNoticeVisible, setSafetyNoticeVisible] = useState(true);
  const [finalConfirmVisible, setFinalConfirmVisible] = useState(false);
  const [policyBlockMessage, setPolicyBlockMessage] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const selectedFoodObject = ownedIngredients.find(item => item.name === ingredientName);
  const selectedIngredientCategory = selectedFoodObject?.category ?? category;
  const selectedFoodVisual = categoryVisuals[selectedIngredientCategory] ?? categoryVisuals.기타;
  const policyViolation = getSharePolicyViolation({
    ingredientName,
    ingredientCategory: selectedIngredientCategory,
    category,
    title,
    content,
    expirationDate,
  });

  useEffect(() => {
    let active = true;
    void fetchMyIngredients({ sort: 'date&ascending' }).then((data) => {
      if (active) {
        setOwnedIngredients(normalizeIngredientItems(data));
      }
    }).catch((caughtError) => {
      if (active) {
        setMessage(getErrorMessage(caughtError, '내 식자재를 불러오지 못했어요.'));
        setOwnedIngredients([]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll = photoModalVisible || foodDropdownVisible || safetyNoticeVisible || finalConfirmVisible;
    document.body.classList.toggle('modal-scroll-locked', shouldLockScroll);
    return () => {
      document.body.classList.remove('modal-scroll-locked');
    };
  }, [photoModalVisible, foodDropdownVisible, safetyNoticeVisible, finalConfirmVisible]);

  const selectOwnedIngredient = (item: Ingredient) => {
    setIngredientName(item.name);
    setCategory(item.category);
    setExpirationDate(item.date ?? '');
    setMessage('');
  };

  const handleSubmit = () => {
    if (!title.trim() || !ingredientName.trim() || !category || !expirationDate || !content.trim()) {
      setMessage('제목, 나눔 품목, 분류, 소비기한, 설명을 모두 입력해 주세요.');
      return;
    }
    if (!selectedFoodObject && !post) {
      setMessage('내 식자재에서 나눔 품목을 선택해 주세요.');
      return;
    }
    if (policyViolation) {
      setMessage('');
      setPolicyBlockMessage(policyViolation);
      return;
    }
    setFinalConfirmVisible(true);
  };
  const submit = async () => {
    if (submitting) return;
    setFinalConfirmVisible(false);
    try {
      setSubmitting(true);
      if (post?.postId ?? post?.id) {
        await updateSharePost({ postId: post.postId ?? post.id, title, ingredientName, category, expirationDate, content, imageUri });
      } else {
        await createSharePost({ title, ingredientName, category, expirationDate, content, imageUri });
      }
      onSaved?.();
      onBack();
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '나눔 글을 저장하지 못했어요.'));
    } finally {
      setSubmitting(false);
    }
  };
  const takeSharePhoto = async () => {
    try {
      const image = await openCamera({ base64: true, maxWidth: 1280 });
      const uri = normalizeImageUri(image.dataUri);
      if (uri) {
        setImageUri(uri);
      }
      setPhotoModalVisible(false);
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '카메라로 사진을 등록하지 못했어요.'));
    }
  };
  const pickSharePhoto = async () => {
    try {
      const uri = await getFirstAlbumImage(1280);
      if (uri) {
        setImageUri(uri);
      }
      setPhotoModalVisible(false);
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '갤러리에서 사진을 등록하지 못했어요.'));
    }
  };
  return (
    <section className="screen form-screen market-write-screen">
      <ShellHeader title={post ? '나눔 글 수정' : '나눔 글쓰기'} onBack={onBack} />
      <section className="share-guidance-section">
        <button className="photo-box" type="button" onClick={() => setPhotoModalVisible(true)}>
          {imageUri ? <img src={imageUri} alt="선택한 나눔 사진" /> : ingredientName ? <span className="photo-category-fallback" style={{ backgroundColor: selectedFoodVisual?.color }}><img src={selectedFoodVisual?.image} alt="" />{ingredientName}</span> : <span>사진 등록</span>}
        </button>
        <section className="policy-box">
          <strong>나눔 가능 품목 안내</strong>
          <p>무료 나눔이어도 식품 안전 기준을 지켜야 해요. 현재는 채소/과일, 쌀/면/빵, 미개봉 가공식품, 미개봉 조미료 중심으로 등록해주세요.</p>
        </section>
      </section>
      <section className="share-form-section">
        <TextField
          variant="box"
          label="제목"
          labelOption="sustain"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="나눔글 제목"
        />
        <div className="share-two-column-row">
          <TextField.Button
            variant="box"
            label="나눔 품목"
            labelOption="sustain"
            value={ingredientName || '내 식재료'}
            onClick={() => setFoodDropdownVisible(true)}
          />
          <div className="tds-picker-section read-only-form-section">
            <strong className="edit-label">분류</strong>
            <div className="readonly-field" aria-label="분류">{category || '자동 분류'}</div>
          </div>
        </div>
        <div className={`date-picker-field ${expirationDate ? 'has-value' : 'is-empty'}`}>
          <span>소비기한</span>
          <WheelDatePicker
            title="소비기한"
            triggerLabel=""
            format="yyyy-MM-dd"
            value={parseDateInputValue(expirationDate)}
            initialDate={parseDateInputValue(expirationDate)}
            onChange={(date) => setExpirationDate(formatDate(date))}
          />
        </div>
        <TextArea
          variant="box"
          label="설명"
          labelOption="sustain"
          value={content}
          onChange={event => setContent(event.target.value)}
          height={112}
        />
      </section>
      <section className="share-submit-section">
        {message ? <p className="inline-message" role="alert">{message}</p> : null}
        <Button display="block" disabled={submitting} onClick={handleSubmit}>{submitting ? (post ? '수정 중' : '등록 중') : post ? '나눔글 수정하기' : '나눔글 등록하기'}</Button>
      </section>
      {photoModalVisible ? (
        <BottomSheet
          className="share-photo-sheet"
          open={photoModalVisible}
          onClose={() => setPhotoModalVisible(false)}
          header={<BottomSheet.Header>사진 등록</BottomSheet.Header>}
        >
          <div className="sheet-action-list">
            <Button display="block" onClick={takeSharePhoto}>카메라</Button>
            <Button display="block" variant="weak" onClick={pickSharePhoto}>앱 사진첩</Button>
            {isLocalPreviewHost() ? (
            <label className="file-picker">
              <input type="file" accept="image/*" onChange={event => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setImageUri(String(reader.result ?? ''));
                  setPhotoModalVisible(false);
                };
                reader.readAsDataURL(file);
              }} />
              갤러리
            </label>
            ) : null}
            <Button display="block" variant="weak" onClick={() => setPhotoModalVisible(false)}>닫기</Button>
          </div>
        </BottomSheet>
      ) : null}
      {safetyNoticeVisible ? (
        <BottomSheet
          className="share-safety-sheet"
          open={safetyNoticeVisible}
          onClose={onBack}
          header={<BottomSheet.Header>{post ? '수정 전 나눔 기준을 확인해주세요' : '나눔 가능한 식재료인지 확인해주세요'}</BottomSheet.Header>}
        >
          <div className="agreement-sheet-content">
            <p>무료 나눔이어도 식품 안전 기준을 지켜야 합니다. 아래 항목에 동의해야 나눔글을 작성할 수 있어요.</p>
            {shareSafetyChecklist.map(item => <small key={item}>✓ {item}</small>)}
            <Button display="block" onClick={() => setSafetyNoticeVisible(false)}>{post ? '동의하고 수정하기' : '동의하고 작성하기'}</Button>
            <Button display="block" variant="weak" onClick={onBack}>작성하지 않기</Button>
          </div>
        </BottomSheet>
      ) : null}
      {finalConfirmVisible ? (
        <BottomSheet
          className="share-final-confirm-sheet"
          open={finalConfirmVisible}
          onClose={() => setFinalConfirmVisible(false)}
          header={<BottomSheet.Header>{post ? '이 내용으로 나눔글을 수정할까요?' : '이 내용으로 나눔글을 등록할까요?'}</BottomSheet.Header>}
        >
          <div className="agreement-sheet-content">
            <p>{post ? '수정 후에도 신고 또는 검수 결과에 따라 글이 숨김 처리될 수 있습니다.' : '등록 후에도 신고 또는 검수 결과에 따라 글이 숨김 처리될 수 있습니다.'} 품목명, 소비기한, 보관상태, 사진이 실제와 일치하는지 다시 확인해주세요.</p>
            {['품목 정보가 실제와 일치합니다.', '나눔 금지 품목이 아님을 확인했습니다.', '수령자는 섭취 전 상태를 직접 확인해야 함을 안내받았습니다.'].map(item => <small key={item}>✓ {item}</small>)}
            <Button display="block" disabled={submitting} onClick={submit}>{submitting ? (post ? '수정 중' : '등록 중') : post ? '동의하고 수정하기' : '동의하고 등록하기'}</Button>
            <Button display="block" variant="weak" onClick={() => setFinalConfirmVisible(false)}>다시 확인하기</Button>
          </div>
        </BottomSheet>
      ) : null}
      <ConfirmDialog
        open={Boolean(policyBlockMessage)}
        title="나눔 제한 품목"
        description={<span className="share-policy-block-description">{policyBlockMessage}</span>}
        onClose={() => setPolicyBlockMessage('')}
        confirmButton={<ConfirmDialog.ConfirmButton onClick={() => setPolicyBlockMessage('')}>확인</ConfirmDialog.ConfirmButton>}
      />
      {foodDropdownVisible ? (
        <BottomSheet
          className="share-food-sheet"
          open={foodDropdownVisible}
          onClose={() => setFoodDropdownVisible(false)}
          header={<BottomSheet.Header>내 식재료</BottomSheet.Header>}
        >
          <div className="sheet-list">
            {ownedIngredients.length === 0 ? <p className="empty-text">나눔할 수 있는 식재료가 없어요.</p> : ownedIngredients.map(item => (
                <ListRow
                  key={item.id}
                  withTouchEffect
                  contents={<ListRow.Texts type="2RowTypeA" top={item.name} bottom={item.date ? `${item.date}까지` : item.category} />}
                  right={ingredientName === item.name ? '선택됨' : undefined}
                  onClick={() => {
                  selectOwnedIngredient(item);
                  setFoodDropdownVisible(false);
                }}
                />
            ))}
            <Button display="block" variant="weak" onClick={() => setFoodDropdownVisible(false)}>닫기</Button>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function MarketDetailView({ post, onBack, goTo }: { post: SharePost; onBack: () => void; goTo: (route: ViewRoute) => void }) {
  const [detail, setDetail] = useState<any>(post);
  const [message, setMessage] = useState('');
  const postId = getServerPostId(post);
  const [loadingDetail, setLoadingDetail] = useState(Boolean(postId));
  const [detailLoadFailed, setDetailLoadFailed] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [authorActionVisible, setAuthorActionVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState(SHARE_REPORT_REASONS[0]);
  const [reportContent, setReportContent] = useState('');
  useEffect(() => {
    let active = true;
    if (!postId) {
      setDetail(null);
      setDetailLoadFailed(true);
      setLoadingDetail(false);
      setMessage('나눔글 정보를 확인할 수 없어요.');
      return () => {
        active = false;
      };
    }
    setLoadingDetail(true);
    setDetailLoadFailed(false);
    void getShareDetail(postId)
      .then(data => {
        if (!active) return;
        setDetail(normalizeSharePost({ ...post, ...data }, 0));
        setDetailLoadFailed(false);
        setMessage('');
      })
      .catch((caughtError) => {
        if (!active) return;
        setDetail(null);
        setDetailLoadFailed(true);
        setMessage(getErrorMessage(caughtError, '나눔 상세를 불러오지 못했어요.'));
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });
    return () => {
      active = false;
    };
  }, [post, postId]);
  const start = async () => {
    if (startingChat) return;
    if (!postId || detailLoadFailed) {
      setMessage('나눔글을 다시 불러온 뒤 채팅을 시작해주세요.');
      return;
    }
    try {
      setStartingChat(true);
      const chat = await startChat(postId);
      const chatRoomId = getStartedChatRoomId(chat);
      if (chatRoomId == null) throw new Error('채팅방 정보를 받지 못했어요.');
      const opponentName = detail?.sellerName ?? detail?.authorName ?? post.sellerName ?? post.authorName ?? '상대방';
      const opponentId = detail?.sellerId ?? post.sellerId;
      goTo({ view: 'chatRoom', chat: { id: String(chatRoomId), chatRoomId: String(chatRoomId), postId, opponentId, name: opponentName, lastMessage: '', time: '', type: 'take' }, post: detail ?? post });
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '채팅을 시작하지 못했어요.'));
    } finally {
      setStartingChat(false);
    }
  };
  const report = async () => {
    if (!postId || detailLoadFailed) {
      setMessage('나눔글을 다시 불러온 뒤 신고해주세요.');
      return;
    }
    try {
      await reportSharePost({
        postId,
        title: detail?.title ?? post.title,
        content: [reportReason, reportContent].filter(Boolean).join('\n'),
      });
      setReportVisible(false);
      setReportReason(SHARE_REPORT_REASONS[0]);
      setReportContent('');
      setMessage('신고가 접수됐어요.');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '나눔 글을 신고하지 못했어요.'));
    }
  };
  const hideForMe = async () => {
    if (!postId) {
      setMessage('나눔글 정보를 확인할 수 없어요.');
      setActionMenuVisible(false);
      return;
    }
    try {
      await hideSharePost(postId);
      setActionMenuVisible(false);
      onBack();
    } catch (caughtError) {
      setActionMenuVisible(false);
      setMessage(getErrorMessage(caughtError, '나눔 글을 숨기지 못했어요.'));
    }
  };
  const detailFood = detail?.food ?? post.food;
  const detailCategory = detail?.category ?? post.category;
  const detailExpirationDate = detail?.expirationDate ?? post.expirationDate;
  const detailAuthor = detail?.authorName ?? detail?.sellerName ?? post.authorName ?? '작성자';
  const detailSellerId = detail?.sellerId ?? post.sellerId;
  const detailAuthorProfileImage = detail?.sellerProfileImageUrl ?? post.sellerProfileImageUrl;
  const detailNeighborhood = detail?.neighborhood ?? post.neighborhood;
  const detailDescription = detail?.description ?? post.description;
  const detailVisual = categoryVisuals[detailCategory] ?? categoryVisuals.기타;
  const detailImageUrl = detail?.imageUrl ?? post.imageUrl;
  return (
    <section className="screen detail-screen">
      <ShellHeader
        title={detail?.title ?? post.title}
        subtitle={detail?.neighborhood ?? post.neighborhood}
        onBack={onBack}
        right={<button className="header-menu-button" type="button" aria-label="나눔글 메뉴" onClick={() => setActionMenuVisible(true)}>☰</button>}
      />
      {detailLoadFailed ? (
        <>
          {message ? <p className="inline-message">{message}</p> : null}
          <p className="empty-text">나눔글을 불러오지 못했어요.</p>
        </>
      ) : (
      <>
      <div className={`share-detail-hero ${detailImageUrl ? '' : 'placeholder'}`}>
        {detailImageUrl ? (
          <img src={detailImageUrl} alt="" />
        ) : (
          <span style={{ backgroundColor: detailVisual?.color }}>
            <img src={detailVisual?.image} alt="" />
            <strong>{detailFood}</strong>
          </span>
        )}
      </div>
      {loadingDetail ? <p className="empty-text">나눔글을 불러오고 있어요.</p> : null}
      <div className="summary-card share-detail-card">
        <div className="share-detail-title-block">
          <strong>{detailFood}</strong>
          <small className="share-detail-meta-line">{detailCategory}{detailExpirationDate ? ` · ${detailExpirationDate}까지` : ''}</small>
        </div>
        <p>{detailDescription}</p>
        <button className="share-author-button" type="button" onClick={() => setAuthorActionVisible(true)}>
          <span className="share-author-avatar">
            {detailAuthorProfileImage ? <img src={detailAuthorProfileImage} alt="" /> : <span>{detailAuthor.slice(0, 1)}</span>}
          </span>
          <span className="share-author-row">
            <span>작성자</span>
            <strong>{detailAuthor}</strong>
            <small>{detailNeighborhood}</small>
          </span>
        </button>
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="sticky-actions"><Button display="block" disabled={startingChat || loadingDetail} onClick={start}>{startingChat ? '연결 중' : '채팅하기'}</Button></div>
      </>
      )}
      {actionMenuVisible ? (
        <BottomSheet
          className="share-action-sheet"
          open={actionMenuVisible}
          onClose={() => setActionMenuVisible(false)}
          header={<BottomSheet.Header>나눔글 메뉴</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>게시글을 숨기거나 문제가 있으면 신고할 수 있어요.</BottomSheet.HeaderDescription>}
        >
          <div className="chat-action-list">
            <button className="chat-action-row primary" type="button" onClick={() => void hideForMe()}>
              <span className="chat-action-icon" aria-hidden="true">−</span>
              <span className="chat-action-copy"><strong>나에게만 숨기기</strong><small>내 나눔 목록에서 이 글을 보지 않아요</small></span>
            </button>
            <button className="chat-action-row" type="button" onClick={() => {
              setActionMenuVisible(false);
              setReportVisible(true);
            }}>
              <span className="chat-action-icon" aria-hidden="true">!</span>
              <span className="chat-action-copy"><strong>신고하기</strong><small>금지 품목이나 식품 안전 문제를 신고해요</small></span>
            </button>
          </div>
        </BottomSheet>
      ) : null}
      {authorActionVisible ? (
        <BottomSheet
          className="share-author-sheet"
          open={authorActionVisible}
          onClose={() => setAuthorActionVisible(false)}
          header={<BottomSheet.Header>작성자</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>작성자의 다른 나눔글을 보거나 채팅을 시작할 수 있어요.</BottomSheet.HeaderDescription>}
        >
          <div className="share-author-sheet-content">
            <div className="share-author-profile">
              <span className="share-author-profile-image">
                {detailAuthorProfileImage ? <img src={detailAuthorProfileImage} alt="" /> : <span>{detailAuthor.slice(0, 1)}</span>}
              </span>
              <div>
                <strong>{detailAuthor}</strong>
                <small>{detailNeighborhood}</small>
              </div>
            </div>
            <div className="chat-action-list">
              <button className="chat-action-row primary" type="button" disabled={!detailSellerId} onClick={() => {
                if (!detailSellerId) return;
                setAuthorActionVisible(false);
                goTo({ view: 'authorPosts', sellerId: detailSellerId, sellerName: detailAuthor, sellerProfileImageUrl: detailAuthorProfileImage });
              }}>
                <span className="chat-action-icon" aria-hidden="true">≡</span>
                <span className="chat-action-copy"><strong>작성 게시글 보기</strong><small>이 작성자가 올린 나눔글을 확인해요</small></span>
              </button>
              <button className="chat-action-row" type="button" disabled={startingChat || loadingDetail} onClick={() => {
                setAuthorActionVisible(false);
                void start();
              }}>
                <span className="chat-action-icon" aria-hidden="true">↗</span>
                <span className="chat-action-copy"><strong>채팅하기</strong><small>이 나눔글로 대화를 시작해요</small></span>
              </button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
      {reportVisible ? (
        <BottomSheet
          className="share-report-sheet"
          open={reportVisible}
          onClose={() => setReportVisible(false)}
          header={<BottomSheet.Header>나눔 글 신고</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>식품 안전이나 거래 문제가 있으면 사유를 선택해 주세요.</BottomSheet.HeaderDescription>}
        >
          <div className="report-sheet-content">
            <div className="option-row">{SHARE_REPORT_REASONS.map(reason => <button className={reportReason === reason ? 'selected' : ''} key={reason} type="button" onClick={() => setReportReason(reason)}>{reason}</button>)}</div>
            <TextArea
              variant="box"
              label="상세 내용"
              labelOption="sustain"
              value={reportContent}
              onChange={event => setReportContent(event.target.value)}
              placeholder="상세 내용을 입력해주세요"
              height={96}
            />
            <Button display="block" onClick={report}>신고</Button>
            <Button display="block" variant="weak" onClick={() => setReportVisible(false)}>취소</Button>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function MyPostsView({ onBack, goTo }: { onBack: () => void; goTo: (route: ViewRoute) => void }) {
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SharePost | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [completionTarget, setCompletionTarget] = useState<SharePost | null>(null);
  const [completionChats, setCompletionChats] = useState<Chat[]>([]);
  const [loadingCompletionChats, setLoadingCompletionChats] = useState(false);
  const [completingChatRoomId, setCompletingChatRoomId] = useState<string | null>(null);

  const openPostEditor = async (post: SharePost) => {
    if (editingPostId) return;
    const postId = getServerPostId(post);
    if (!postId) {
      setMessage('수정할 나눔글 정보를 확인할 수 없어요.');
      return;
    }
    try {
      setEditingPostId(postId);
      const data = await getShareDetail(postId);
      goTo({ view: 'marketWrite', post: normalizeSharePost({ ...post, ...data }, 0), returnTo: 'myPosts' });
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '수정할 나눔글 상세를 불러오지 못했어요.'));
    } finally {
      setEditingPostId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    void getMyShareList('나눔 중')
      .then((data) => {
        setPosts((Array.isArray(data) ? data : []).map(normalizeSharePost));
        setMessage('');
      })
      .catch((caughtError) => {
        setMessage(getErrorMessage(caughtError, '내가 쓴 글을 불러오지 못했어요.'));
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const openCompletionSheet = async (post: SharePost) => {
    const postId = getServerPostId(post);
    if (!postId) {
      setMessage('완료 처리할 나눔글 정보를 확인할 수 없어요.');
      return;
    }
    setCompletionTarget(post);
    setCompletionChats([]);
    setLoadingCompletionChats(true);
    try {
      const data = await fetchChats({ type: 'give', page: 0, size: 50 });
      const items = data?.items ?? data?.result?.items ?? data?.data?.items ?? [];
      const normalized = (Array.isArray(items) ? items : [])
        .map((item: any, index: number): Chat => ({
          id: String(item.chatRoomId ?? item.id ?? index),
          chatRoomId: item.chatRoomId == null ? undefined : String(item.chatRoomId),
          postId: item.postId == null ? undefined : String(item.postId),
          opponentId: item.opponentId == null ? undefined : String(item.opponentId),
          name: item.senderNicName ?? item.senderNickName ?? item.name ?? '상대방',
          lastMessage: item.lastMessage ?? '아직 메시지가 없어요.',
          time: item.sendTime ? new Date(item.sendTime).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '',
          type: 'give',
        }))
        .filter(chat => chat.postId === postId && chat.chatRoomId);
      setCompletionChats(normalized);
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '완료 처리할 채팅 상대를 불러오지 못했어요.'));
    } finally {
      setLoadingCompletionChats(false);
    }
  };

  const completeWithChat = async (chat: Chat) => {
    const postId = getServerPostId(completionTarget);
    if (!postId || !chat.chatRoomId || completingChatRoomId) return;
    try {
      setCompletingChatRoomId(chat.chatRoomId);
      await completeShareSuccession({ postId, chatRoomId: chat.chatRoomId, type: '전체' });
      setPosts(current => current.filter(item => getServerPostId(item) !== postId));
      setCompletionTarget(null);
      setCompletionChats([]);
      setMessage('나눔 완료 처리됐어요. 나눔 내역에서 확인할 수 있어요.');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '나눔 완료 처리에 실패했어요.'));
    } finally {
      setCompletingChatRoomId(null);
    }
  };

  return (
    <section className="screen detail-screen">
      <ShellHeader title="내가 쓴 글" onBack={onBack} />
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="item-list">{loading ? <p className="empty-text">작성한 글을 불러오고 있어요.</p> : posts.length === 0 ? <p className="empty-text">작성한 글이 없어요.</p> : posts.map(post => {
        const visual = categoryVisuals[post.category] ?? categoryVisuals.기타;
        return (
        <article className="share-card my-post-card" key={post.id}>
          <span className="share-card-image" style={{ backgroundColor: visual?.color }}>
            <img src={post.imageUrl || visual?.image} alt="" />
          </span>
            <button type="button" onClick={() => goTo({ view: 'marketDetail', post })}>
            <div>
              <strong>{post.title}</strong>
              <p>{post.description || post.food}</p>
              <small>{post.expirationDate ? `${post.expirationDate}까지` : '소비기한 정보 없음'}</small>
            </div>
          </button>
          <button className="my-post-action complete" type="button" onClick={() => void openCompletionSheet(post)}>나눔 완료</button>
          <button className="my-post-action edit" type="button" disabled={editingPostId === getServerPostId(post) || getServerPostId(post) == null} onClick={() => void openPostEditor(post)}>{editingPostId === getServerPostId(post) ? '불러오는 중' : '수정'}</button>
          <button className="my-post-action delete" type="button" onClick={() => setDeleteTarget(post)}>삭제</button>
        </article>
      );})}</div>
      {deleteTarget ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <h2>나눔 글 삭제</h2>
            <p>{deleteTarget.title} 글을 삭제할까요?</p>
            <div className="dialog-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>취소</button>
              <button type="button" disabled={deletingPost} onClick={async () => {
                if (!deleteTarget || deletingPost) return;
                const target = deleteTarget;
            try {
                  setDeletingPost(true);
              const targetPostId = getServerPostId(target);
              if (!targetPostId) throw new Error('삭제할 나눔글 정보를 확인할 수 없어요.');
              await deleteMySharePost(targetPostId);
              setPosts(current => current.filter(item => item.id !== target.id));
                  setDeleteTarget(null);
              setMessage('');
            } catch (caughtError) {
              setMessage(getErrorMessage(caughtError, '나눔 글을 삭제하지 못했어요.'));
                } finally {
                  setDeletingPost(false);
            }
              }}>{deletingPost ? '삭제 중' : '삭제'}</button>
            </div>
          </div>
        </div>
      ) : null}
      {completionTarget ? (
        <BottomSheet
          className="share-completion-sheet"
          open={Boolean(completionTarget)}
          onClose={() => {
            setCompletionTarget(null);
            setCompletionChats([]);
          }}
          header={<BottomSheet.Header>나눔 완료</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>실제로 나눔받은 채팅 상대를 선택해 주세요.</BottomSheet.HeaderDescription>}
        >
          <div className="chat-action-list completion-chat-list">
            {loadingCompletionChats ? <p className="empty-text">채팅 상대를 불러오고 있어요.</p> : null}
            {!loadingCompletionChats && completionChats.length === 0 ? (
              <p className="empty-text">이 글로 대화한 상대가 없어요. 수령자 기록을 남기기 위해 채팅 후 완료 처리할 수 있어요.</p>
            ) : null}
            {completionChats.map(chat => (
              <button className="chat-action-row primary" key={chat.chatRoomId ?? chat.id} type="button" disabled={Boolean(completingChatRoomId)} onClick={() => void completeWithChat(chat)}>
                <span className="chat-action-icon" aria-hidden="true">✓</span>
                <span className="chat-action-copy">
                  <strong>{chat.name}</strong>
                  <small>{completingChatRoomId === chat.chatRoomId ? '완료 처리 중' : chat.lastMessage || '채팅 상대에게 나눔 완료'}</small>
                </span>
              </button>
            ))}
            <Button display="block" variant="weak" onClick={() => {
              setCompletionTarget(null);
              setCompletionChats([]);
            }}>닫기</Button>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function AuthorPostsView({ sellerId, sellerName, sellerProfileImageUrl, onBack, goTo }: { sellerId: string; sellerName: string; sellerProfileImageUrl?: string; onBack: () => void; goTo: (route: ViewRoute) => void }) {
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchUserSharePosts(sellerId)
      .then((data) => {
        setPosts((Array.isArray(data) ? data : []).map((item, index) => normalizeSharePost({
          ...item,
          sellerId,
          sellerName,
          sellerProfileImageUrl,
        }, index)));
        setMessage('');
      })
      .catch((caughtError) => {
        setMessage(getErrorMessage(caughtError, '작성자의 나눔글을 불러오지 못했어요.'));
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [sellerId, sellerName, sellerProfileImageUrl]);

  return (
    <section className="screen detail-screen">
      <ShellHeader title={`${sellerName}의 나눔`} onBack={onBack} />
      <div className="author-posts-profile">
        <span className="share-author-profile-image">
          {sellerProfileImageUrl ? <img src={sellerProfileImageUrl} alt="" /> : <span>{sellerName.slice(0, 1)}</span>}
        </span>
        <div>
          <strong>{sellerName}</strong>
          <small>작성한 나눔글</small>
        </div>
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="item-list">{loading ? <p className="empty-text">작성한 글을 불러오고 있어요.</p> : posts.length === 0 ? <p className="empty-text">작성한 나눔글이 없어요.</p> : posts.map(post => {
        const visual = categoryVisuals[post.category] ?? categoryVisuals.기타;
        return (
          <button className="market-post-card" key={post.id} type="button" onClick={() => goTo({ view: 'marketDetail', post })}>
            <span className="market-post-image" style={{ backgroundColor: visual?.color }}>
              <img src={post.imageUrl || visual?.image} alt="" />
            </span>
            <div className="market-post-info">
              <div className="market-post-title-row">
                <strong>{post.title}</strong>
              </div>
              <small>{post.neighborhood}{post.timeAgo ? ` · ${post.timeAgo}` : ''}{post.category ? ` · ${post.category}` : ''}</small>
              <p>{post.description || '상세 내용은 게시글에서 확인해주세요.'}</p>
            </div>
          </button>
        );
      })}</div>
    </section>
  );
}

function MyShareHistoryView({ onBack }: { onBack: () => void }) {
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    void getMyShareList('나눔 완료')
      .then((data) => {
        setPosts((Array.isArray(data) ? data : []).map(normalizeSharePost));
        setMessage('');
      })
      .catch((caughtError) => {
        setMessage(getErrorMessage(caughtError, '나눔 내역을 불러오지 못했어요.'));
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="screen detail-screen">
      <ShellHeader title="나눔 내역" onBack={onBack} />
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="item-list">
        {loading ? <p className="empty-text">나눔 내역을 불러오고 있어요.</p> : posts.length === 0 ? <p className="empty-text">나눔 완료한 내역이 없어요.</p> : posts.map(post => {
          const visual = categoryVisuals[post.category] ?? categoryVisuals.기타;
          return (
            <article className="share-card history-card" key={post.id}>
              <span className="share-card-image" style={{ backgroundColor: visual?.color }}>
                <img src={post.imageUrl || visual?.image} alt="" />
              </span>
              <div>
                <strong>{post.title}</strong>
                <p>{post.description || post.food}</p>
              </div>
              <em>나눔완료</em>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HiddenSharePostsView({ onBack, goTo }: { onBack: () => void; goTo: (route: ViewRoute) => void }) {
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unhidingPostId, setUnhidingPostId] = useState<string | null>(null);

  const loadHiddenPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchHiddenSharePosts();
      setPosts((Array.isArray(data) ? data : []).map(normalizeSharePost));
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '숨긴 나눔글을 불러오지 못했어요.'));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHiddenPosts();
  }, []);

  const unhide = async (post: SharePost) => {
    const postId = getServerPostId(post);
    if (!postId || unhidingPostId) return;
    try {
      setUnhidingPostId(postId);
      await unhideSharePost(postId);
      setPosts(current => current.filter(item => getServerPostId(item) !== postId));
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '숨김을 해제하지 못했어요.'));
    } finally {
      setUnhidingPostId(null);
    }
  };

  return (
    <section className="screen detail-screen">
      <ShellHeader title="숨긴 나눔글" onBack={onBack} />
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="item-list">
        {loading ? <p className="empty-text">숨긴 나눔글을 불러오고 있어요.</p> : posts.length === 0 ? <p className="empty-text">숨긴 나눔글이 없어요.</p> : posts.map(post => {
          const visual = categoryVisuals[post.category] ?? categoryVisuals.기타;
          const postId = getServerPostId(post);
          return (
            <article className="share-card hidden-share-card" key={post.id}>
              <span className="share-card-image" style={{ backgroundColor: visual?.color }}>
                <img src={post.imageUrl || visual?.image} alt="" />
              </span>
              <button type="button" onClick={() => goTo({ view: 'marketDetail', post })}>
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.description || post.food}</p>
                  <small>{post.neighborhood}{post.expirationDate ? ` · ${post.expirationDate}까지` : ''}</small>
                </div>
              </button>
              <button type="button" disabled={!postId || unhidingPostId === postId} onClick={() => void unhide(post)}>
                {unhidingPostId === postId ? '해제 중' : '숨김 해제'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChatRoomView({ chat, post, onBack, onShareCompleted }: { chat: Chat; post?: SharePost; onBack: () => void; onShareCompleted?: () => void }) {
  const [messages, setMessages] = useState<Array<{ id: string; content: string; mine?: boolean; time?: string; date?: string; isRead?: boolean; rawTime?: string }>>([]);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [messagePage, setMessagePage] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [completeSuccessVisible, setCompleteSuccessVisible] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportContent, setReportContent] = useState('');
  const [roomId, setRoomId] = useState(chat.chatRoomId ?? null);

  const normalizeChatMessage = (item: any, index: number) => {
    const rawTime = item.sendTime ?? item.createdAt ?? '';
    const date = rawTime ? new Date(rawTime).toLocaleDateString('ko-KR') : '';
    const time = rawTime ? new Date(rawTime).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '';
    const senderName = item.senderNicName ?? item.senderNickName ?? item.senderNickname;
    const senderId = item.senderId == null ? undefined : String(item.senderId);
    return {
      id: String(item.messageId ?? item.id ?? `${rawTime}-${index}`),
      content: item.content ?? item.message ?? '',
      mine: item.mine === true || item.sender === 'me' || item.senderType === 'ME' || (senderId != null && chat.opponentId != null ? senderId !== chat.opponentId : senderName != null && senderName !== chat.name),
      time,
      date,
      rawTime,
      isRead: item.isRead !== false,
    };
  };

  const loadMessages = async (targetPage = 0, appendOlder = false, silent = false, activeRoomId = roomId) => {
    if (appendOlder) setLoadingOlder(true);
    if (!appendOlder && targetPage === 0 && !silent) setLoading(true);
    if (!activeRoomId) {
      throw new Error('채팅방 정보를 확인할 수 없어요.');
    }
    try {
      const data = await getChatMessagesPage({ chatRoomId: activeRoomId, page: targetPage, size: 30 });
      const items = data?.items ?? data?.result?.items ?? data?.data?.items ?? [];
      const normalized = (Array.isArray(items) ? items : [])
        .map(normalizeChatMessage)
        .sort((left, right) => new Date(left.rawTime || 0).getTime() - new Date(right.rawTime || 0).getTime());
      setMessages(current => appendOlder ? [...normalized, ...current] : normalized);
      setMessagePage(targetPage);
      setHasOlderMessages(Boolean(data?.hasNext ?? data?.result?.hasNext ?? data?.data?.hasNext));
      if (appendOlder) {
        setMessage('');
      }
    } catch (caughtError) {
      if (appendOlder) {
        setMessage(getErrorMessage(caughtError, '이전 메시지를 불러오지 못했어요.'));
        return;
      }
      throw caughtError;
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    let active = true;
    const resolveRoomId = async () => {
      if (roomId) return roomId;
      const postId = getServerPostId(post) ?? chat.postId;
      if (!postId) {
        throw new Error('채팅방 정보를 확인할 수 없어요.');
      }
      const startedRoom = await startChat(postId);
      const resolvedRoomId = String(getStartedChatRoomId(startedRoom) ?? '');
      if (!resolvedRoomId) {
        throw new Error('채팅방 정보를 받지 못했어요.');
      }
      if (active) setRoomId(resolvedRoomId);
      return resolvedRoomId;
    };

    const refresh = async (silent = false) => {
      try {
        const activeRoomId = await resolveRoomId();
        if (active) {
          await loadMessages(0, false, silent, activeRoomId);
          void markChatAsRead(activeRoomId).catch(() => undefined);
          setMessage('');
        }
      } catch (caughtError) {
        if (active) {
          setMessage(getErrorMessage(caughtError, '채팅 메시지를 불러오지 못했어요.'));
          if (!silent) setMessages([]);
          setLoading(false);
        }
      }
    };
    void refresh(false);
    const timer = window.setInterval(() => {
      void refresh(true);
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [roomId, post, chat.postId]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    if (!roomId) {
      setMessage('채팅방 정보를 확인할 수 없어요.');
      return;
    }
    const content = draft.trim();
    setSending(true);
    setDraft('');
    try {
      await sendChatMessage({ chatRoomId: roomId, content });
      await loadMessages();
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '메시지를 보내지 못했어요.'));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };
  const completeShare = async () => {
    const shareCompletionPostId = getServerPostId(post) ?? chat.postId;
    if (!shareCompletionPostId) {
      setMessage('나눔 완료 처리할 게시글 정보가 없어요.');
      return;
    }
    if (!roomId) {
      setMessage('채팅방 정보를 확인할 수 없어요.');
      return;
    }
    try {
      setCompleting(true);
      await completeShareSuccession({ postId: shareCompletionPostId, chatRoomId: roomId, type: '전체' });
      setConfirmVisible(false);
      setMessage('나눔 완료 처리됐어요.');
      onShareCompleted?.();
      setCompleteSuccessVisible(true);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '나눔 완료 처리에 실패했어요.'));
    } finally {
      setCompleting(false);
    }
  };
  const reportRoom = async () => {
    if (reporting) return;
    try {
      setReporting(true);
      if (!roomId) throw new Error('채팅방 정보를 확인할 수 없어요.');
      await reportChat({ chatRoomId: roomId, reason: reportReason, content: reportContent });
      setReportVisible(false);
      setReportContent('');
      setReportReason(REPORT_REASONS[0]);
      setMessage('신고가 접수됐어요.');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '채팅을 신고하지 못했어요.'));
    } finally {
      setReporting(false);
    }
  };
  const blockRoom = async () => {
    if (blocking) return;
    try {
      setBlocking(true);
      if (!roomId) throw new Error('채팅방 정보를 확인할 수 없어요.');
      await blockChat(roomId);
      setBlockConfirmVisible(false);
      setReportVisible(false);
      setMessage('차단했어요.');
      onBack();
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '채팅을 차단하지 못했어요.'));
    } finally {
      setBlocking(false);
    }
  };
  const deleteRoom = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      if (!roomId) throw new Error('채팅방 정보를 확인할 수 없어요.');
      await deleteChatRoom(roomId);
      onBack();
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '채팅방을 삭제하지 못했어요.'));
    } finally {
      setDeleting(false);
    }
  };
  return (
    <section className="screen detail-screen chat-room">
      <ShellHeader
        title={chat.name}
        onBack={onBack}
        right={<button className="header-menu-button" type="button" aria-label="채팅방 메뉴" onClick={() => setActionMenuVisible(true)}>☰</button>}
      />
      {post ? (
        <article className="chat-post-card">
          <span className="chat-post-thumb">
            {post.imageUrl ? <img src={post.imageUrl} alt="" /> : <img src={(categoryVisuals[post.category] ?? categoryVisuals.기타)?.image} alt="" />}
          </span>
          <div>
            <strong>{post.title}</strong>
            <p>{post.food}{post.expirationDate ? ` · ${post.expirationDate}까지` : ''}</p>
            <small>{post.neighborhood}</small>
          </div>
        </article>
      ) : null}
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="message-list">
        {loading ? <p className="empty-text">메시지를 불러오고 있어요.</p> : null}
        {!loading && hasOlderMessages ? <button className="load-more-button" type="button" disabled={loadingOlder} onClick={() => loadMessages(messagePage + 1, true)}>{loadingOlder ? '불러오는 중' : '이전 메시지 더 보기'}</button> : null}
        {!loading && messages.length === 0 && !message ? <p className="empty-text">아직 메시지가 없어요.</p> : null}
        {!loading && messages.map((item, index) => {
          const previousMessage = messages[index - 1];
          const showDate = index === 0 || previousMessage?.date !== item.date;
          return (
            <div key={item.id}>
              {showDate && item.date ? <small className="date-separator">{item.date}</small> : null}
              <p className={item.mine ? 'mine' : ''}>{item.content}<small>{item.isRead ? '읽음' : '안읽음'} · {item.time}</small></p>
            </div>
          );
        })}
      </div>
      <div className="chat-compose">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="메시지 입력"
          aria-label="채팅 메시지"
        />
        <Button size="small" disabled={!draft.trim() || sending || roomId == null} onClick={send}>{sending ? '전송 중' : '전송'}</Button>
      </div>
      <ConfirmDialog
        open={confirmVisible}
        title="나눔을 완료할까요?"
        description={`${chat.name}님에게 나눔 완료로 처리됩니다.`}
        onClose={() => setConfirmVisible(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setConfirmVisible(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={completing} onClick={completeShare}>{completing ? '처리 중' : '완료'}</ConfirmDialog.ConfirmButton>}
      />
      <ConfirmDialog
        open={completeSuccessVisible}
        title="나눔 완료"
        description={`${chat.name}님과의 나눔을 완료 처리했어요.`}
        onClose={onBack}
        confirmButton={<ConfirmDialog.ConfirmButton onClick={onBack}>확인</ConfirmDialog.ConfirmButton>}
      />
      <ConfirmDialog
        open={deleteConfirmVisible}
        title="채팅방 삭제"
        description="내 채팅 목록에서만 삭제돼요. 신고 및 운영 확인을 위해 대화 기록은 서버에 보관됩니다."
        onClose={() => setDeleteConfirmVisible(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setDeleteConfirmVisible(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={deleting} onClick={deleteRoom}>{deleting ? '삭제 중' : '삭제'}</ConfirmDialog.ConfirmButton>}
      />
      <ConfirmDialog
        open={blockConfirmVisible}
        title="상대방 차단"
        description="차단하면 이 채팅방에서 더 이상 메시지를 주고받을 수 없어요. 차단할까요?"
        onClose={() => setBlockConfirmVisible(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setBlockConfirmVisible(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={blocking} onClick={blockRoom}>{blocking ? '차단 중' : '차단'}</ConfirmDialog.ConfirmButton>}
      />
      {actionMenuVisible ? (
        <BottomSheet
          className="chat-action-sheet"
          open={actionMenuVisible}
          onClose={() => setActionMenuVisible(false)}
          header={<BottomSheet.Header>채팅방 메뉴</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>{chat.name}님과의 대화 관리</BottomSheet.HeaderDescription>}
        >
          <div className="chat-action-list">
            {chat.type === 'give' ? (
              <button className="chat-action-row primary" type="button" onClick={() => {
                setActionMenuVisible(false);
                setConfirmVisible(true);
              }}>
                <span className="chat-action-icon" aria-hidden="true">✓</span>
                <span className="chat-action-copy"><strong>나눔 완료</strong><small>이 대화를 나눔 완료로 처리해요</small></span>
              </button>
            ) : null}
            <button className="chat-action-row" type="button" onClick={() => {
              setActionMenuVisible(false);
              setReportVisible(true);
            }}>
              <span className="chat-action-icon" aria-hidden="true">!</span>
              <span className="chat-action-copy"><strong>신고하기</strong><small>부적절한 대화나 약속 불이행을 신고해요</small></span>
            </button>
            <button className="chat-action-row" type="button" onClick={() => {
              setActionMenuVisible(false);
              setBlockConfirmVisible(true);
            }}>
              <span className="chat-action-icon" aria-hidden="true">−</span>
              <span className="chat-action-copy"><strong>차단하기</strong><small>이 상대와 더 이상 메시지를 주고받지 않아요</small></span>
            </button>
            <button className="chat-action-row danger" type="button" onClick={() => {
              setActionMenuVisible(false);
              setDeleteConfirmVisible(true);
            }}>
              <span className="chat-action-icon" aria-hidden="true">×</span>
              <span className="chat-action-copy"><strong>채팅방 삭제</strong><small>내 채팅 목록에서만 삭제돼요</small></span>
            </button>
          </div>
        </BottomSheet>
      ) : null}
      {reportVisible ? (
        <BottomSheet
          className="chat-report-sheet"
          open={reportVisible}
          onClose={() => setReportVisible(false)}
          header={<BottomSheet.Header>채팅 신고</BottomSheet.Header>}
          headerDescription={<BottomSheet.HeaderDescription>부적절한 대화나 약속 불이행이 있으면 신고할 수 있어요.</BottomSheet.HeaderDescription>}
        >
          <div className="report-sheet-content">
            <div className="option-row">{REPORT_REASONS.map(reason => <button className={reportReason === reason ? 'selected' : ''} key={reason} type="button" onClick={() => setReportReason(reason)}>{reason}</button>)}</div>
            <TextArea
              variant="box"
              label="상세 내용"
              labelOption="sustain"
              value={reportContent}
              onChange={event => setReportContent(event.target.value)}
              placeholder="상세 내용을 입력해주세요"
              height={96}
            />
            <button className="danger-text" type="button" onClick={() => {
              setReportVisible(false);
              setBlockConfirmVisible(true);
            }}>이 상대방 차단하기</button>
            <Button display="block" disabled={reporting} onClick={reportRoom}>{reporting ? '접수 중' : '신고'}</Button>
            <Button display="block" variant="weak" onClick={() => setReportVisible(false)}>취소</Button>
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function AccountDeleteFlow({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <>
      <button type="button" className="danger-text" onClick={() => setConfirming(true)}><strong>물무물무 서비스 탈퇴</strong><em>›</em></button>
      {message ? <p className="inline-message">{message}</p> : null}
      <ConfirmDialog
        open={confirming}
        title="회원 탈퇴"
        description="탈퇴 후 복구가 불가능합니다."
        onClose={() => setConfirming(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setConfirming(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={deleting} onClick={async () => {
          if (deleting) return;
          try {
            setDeleting(true);
            if (!isLocalPreviewHost()) {
              const { authorizationCode, referrer } = await appLogin();
              const session = await exchangeTossLogin({ authorizationCode, referrer });
              setMiniappAccessToken(session.accessToken);
            }
            await deleteAccount();
            setMiniappAccessToken(null);
            onDeleted();
          } catch (caughtError) {
            setMessage(getErrorMessage(caughtError, '회원 탈퇴를 처리하지 못했어요.'));
          } finally {
            setDeleting(false);
            setConfirming(false);
          }
        }}>{deleting ? '탈퇴 처리 중' : '탈퇴'}</ConfirmDialog.ConfirmButton>}
      />
    </>
  );
}

function MainApp({
  accessToken,
  allergies,
  prefers,
  dislikes,
  onRestartSetup,
  onAccountDeleted,
}: {
  accessToken: string | null;
  allergies: string[];
  prefers: string[];
  dislikes: string[];
  onRestartSetup: () => void;
  onAccountDeleted: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('fridge');
  const [fridgeSnapshot, setFridgeSnapshot] = useState<Ingredient[]>([]);
  const [marketLocationRevision, setMarketLocationRevision] = useState(0);
  const [marketListRevision, setMarketListRevision] = useState(0);
  const [browseLocation, setBrowseLocation] = useState<BrowseLocation | null>(null);
  const [route, setRoute] = useState<ViewRoute>({ view: 'tabs' });
  const [routeStack, setRouteStack] = useState<ViewRoute[]>([]);
  const goTo = (nextRoute: ViewRoute) => {
    setRouteStack(current => [...current, route]);
    setRoute(nextRoute);
  };
  const replaceRoute = (nextRoute: ViewRoute) => setRoute(nextRoute);
  const goBack = () => {
    setRouteStack(current => {
      const previous = current[current.length - 1];
      setRoute(previous ?? { view: 'tabs' });
      return current.slice(0, -1);
    });
  };
  const goBackToTabs = () => {
    setRouteStack([]);
    setRoute({ view: 'tabs' });
  };
  const switchTab = (nextTab: TabKey) => {
    setTab(nextTab);
    const nextPath = featurePathByTab[nextTab];
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.replaceState(null, '', nextPath);
    }
    goBackToTabs();
  };

  useEffect(() => {
    const initialTab = tabByFeaturePath[window.location.pathname];
    if (initialTab) {
      setTab(initialTab);
      if (window.location.pathname === '/') {
        window.history.replaceState(null, '', '/home');
      }
    }
  }, []);

  useEffect(() => {
    if (route.view === 'tabs' && routeStack.length === 0) {
      return undefined;
    }

    try {
      return graniteEvent.addEventListener('backEvent', {
        onEvent: () => {
          goBack();
        },
        onError: () => undefined,
      });
    } catch {
      return undefined;
    }
  }, [route.view, routeStack.length]);

  useEffect(() => {
    try {
      return graniteEvent.addEventListener('homeEvent', {
        onEvent: () => {
          goBackToTabs();
        },
        onError: () => undefined,
      });
    } catch {
      return undefined;
    }
  }, []);

  const content = {
    fridge: <FridgeMirror accessToken={accessToken} onSnapshot={setFridgeSnapshot} goTo={goTo} />,
    market: <MarketScreen goTo={goTo} locationRevision={marketLocationRevision} listRevision={marketListRevision} browseLocation={browseLocation} onBrowseLocationChange={setBrowseLocation} />,
    recipe: <RecipeScreen goTo={goTo} />,
    chat: <ChatScreen goTo={goTo} />,
    info: <MyInfoScreen onRestartSetup={onRestartSetup} onAccountDeleted={onAccountDeleted} goTo={goTo} />,
  }[tab];

  const routedContent = route.view === 'tabs' ? content : (
    route.view === 'directInput' ? <DirectInputDetailView initialItems={route.initialItems} purchaseDate={route.purchaseDate} onBack={goBack} onSaved={(items) => {
      setFridgeSnapshot(current => [...items, ...current]);
      goBackToTabs();
    }} /> :
    route.view === 'receiptCamera' ? <ReceiptCameraView onBack={goBack} onCapture={(image) => goTo({ view: 'receiptLoading', image })} /> :
    route.view === 'receiptGallery' ? <ReceiptGalleryView onBack={goBack} onAnalyze={(image) => goTo({ view: 'receiptLoading', image })} /> :
    route.view === 'receiptLoading' ? <ReceiptLoadingView image={route.image} onBack={goBack} onComplete={(items, purchaseDate) => replaceRoute({ view: 'directInput', initialItems: items, purchaseDate })} /> :
    route.view === 'receiptResult' ? <ReceiptResultView items={route.items} onBack={goBack} onSaved={(items) => {
      setFridgeSnapshot(items);
      goBackToTabs();
    }} /> :
    route.view === 'recipeRecommend' ? <RecipeRecommendView ingredients={fridgeSnapshot} onBack={goBack} onComplete={(recipes, selectedIngredients) => replaceRoute({ view: 'recipeResult', recipes, selectedIngredients })} /> :
    route.view === 'recipeResult' ? <RecipeResultView recipes={route.recipes} selectedIngredients={route.selectedIngredients} allergies={allergies} preferIngredients={prefers} dispreferIngredients={dislikes} onBack={goBack} goTo={goTo} /> :
    route.view === 'recipeDetail' ? <RecipeDetailView recipe={route.recipe} selectedIngredients={route.selectedIngredients} onBack={goBack} /> :
    route.view === 'locationSetting' ? <LocationSettingView onBack={goBack} onSaved={() => setMarketLocationRevision(revision => revision + 1)} onBrowse={(location) => setBrowseLocation(location)} /> :
    route.view === 'marketWrite' ? <MarketWriteView post={route.post} onSaved={() => setMarketListRevision(revision => revision + 1)} onBack={() => route.returnTo === 'myPosts' ? replaceRoute({ view: 'myPosts' }) : goBack()} /> :
    route.view === 'marketDetail' ? <MarketDetailView post={route.post} onBack={goBack} goTo={goTo} /> :
    route.view === 'authorPosts' ? <AuthorPostsView sellerId={route.sellerId} sellerName={route.sellerName} sellerProfileImageUrl={route.sellerProfileImageUrl} onBack={goBack} goTo={goTo} /> :
    route.view === 'myPosts' ? <MyPostsView onBack={goBack} goTo={goTo} /> :
    route.view === 'myShareHistory' ? <MyShareHistoryView onBack={goBack} /> :
    route.view === 'hiddenSharePosts' ? <HiddenSharePostsView onBack={goBack} goTo={goTo} /> :
    route.view === 'chatRoom' ? <ChatRoomView chat={route.chat} post={route.post} onBack={goBack} onShareCompleted={() => setMarketListRevision(revision => revision + 1)} /> :
    content
  );

  return (
    <main className="phone-shell">
      <div className={`app-content ${route.view !== 'tabs' ? 'routed' : ''}`}>{routedContent}</div>
      <nav className="bottom-tab" aria-label="주요 메뉴" hidden={route.view !== 'tabs'}>
        {tabs.map(item => (
          <button className={tab === item.key ? 'active' : ''} key={item.key} type="button" onClick={() => switchTab(item.key)}>
            <img src={item.icon} alt="" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function FridgeMirror({ accessToken, onSnapshot, goTo }: { accessToken: string | null; onSnapshot: (items: Ingredient[]) => void; goTo: (route: ViewRoute) => void }) {
  const [items, setItems] = useState<Ingredient[]>([]);

  useEffect(() => {
    onSnapshot(items);
  }, [items, onSnapshot]);

  return <FridgeScreenWithMirror accessToken={accessToken} setExternalItems={setItems} goTo={goTo} />;
}

function FridgeScreenWithMirror({ accessToken, setExternalItems, goTo }: { accessToken: string | null; setExternalItems: (items: Ingredient[]) => void; goTo: (route: ViewRoute) => void }) {
  return <FridgeScreenImpl accessToken={accessToken} setExternalItems={setExternalItems} goTo={goTo} />;
}

function FridgeScreenImpl({ accessToken, setExternalItems, goTo }: { accessToken: string | null; setExternalItems: (items: Ingredient[]) => void; goTo: (route: ViewRoute) => void }) {
  const [items, setItems] = useState<Ingredient[]>([]);

  useEffect(() => {
    setExternalItems(items);
  }, [items, setExternalItems]);

  return <FridgeScreenContent accessToken={accessToken} items={items} setItems={setItems} goTo={goTo} />;
}

function FridgeScreenContent({
  accessToken,
  items,
  setItems,
  goTo,
}: {
  accessToken: string | null;
  items: Ingredient[];
  setItems: Dispatch<SetStateAction<Ingredient[]>>;
  goTo: (route: ViewRoute) => void;
}) {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sortType, setSortType] = useState('날짜순(오름차순)');
  const [sortPickerVisible, setSortPickerVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [pendingDeleteIngredientIds, setPendingDeleteIngredientIds] = useState<Array<string | number>>([]);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState('');
  const [deletingIngredients, setDeletingIngredients] = useState(false);
  const [savingIngredient, setSavingIngredient] = useState(false);
  const [editIngredientSelected, setEditIngredientSelected] = useState(true);
  const [editIngredientSuggestions, setEditIngredientSuggestions] = useState<string[]>([]);
  const [editIngredientCategorySuggestions, setEditIngredientCategorySuggestions] = useState<string[]>([]);
  const [editIngredientPickerOpen, setEditIngredientPickerOpen] = useState(false);
  const [activeEditIngredientCategory, setActiveEditIngredientCategory] = useState('채소/과일');
  const [editIngredientCategoryIndex, setEditIngredientCategoryIndex] = useState<Map<string, string>>(new Map());
  const statusSelectOptions = ['미사용', '사용 중', '사용 완료'].map(status => ({ name: status, value: status }));
  const directCategorySelectOptions = ingredientCategories
    .filter(category => category !== '전체')
    .map(category => ({ name: category, value: category }));
  const editStandardIngredientSelectOptions = editIngredientCategorySuggestions.map(name => ({ name, value: name }));
  const fridgeSortSelectOptions = ['날짜순(오름차순)', '날짜순(내림차순)', '이름순(오름차순)', '이름순(내림차순)']
    .map(sort => ({ name: sort, value: sort }));

  const getSortParam = () => {
    if (sortType === '날짜순(내림차순)') return 'date&descending';
    if (sortType === '이름순(오름차순)') return 'name&ascending';
    if (sortType === '이름순(내림차순)') return 'name&descending';
    return 'date&ascending';
  };

  const loadIngredients = async (nextPage = 0, append = false) => {
    void append;
    setLoading(true);
    try {
      const data = await getMyIngredientsPage({
        accessToken,
        sort: getSortParam(),
        categories: selectedCategories,
        keyword: search,
        page: nextPage,
        size: listPageSize,
      });
      const payload = data?.result ?? data?.data ?? data;
      const result = payload?.items ?? payload;
      if (Array.isArray(result)) {
        const normalized = result.map(normalizeIngredient);
        setItems(normalized);
        setPage(nextPage);
        setHasNext(Boolean(payload?.hasNext));
        setTotalCount(typeof payload?.totalCount === 'number' ? payload.totalCount : normalized.length);
        setMessage('');
      } else {
        setMessage('식재료 목록 응답 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.');
        setItems([]);
        setHasNext(false);
        setTotalCount(null);
      }
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 불러오지 못했어요.'));
      setItems([]);
      setHasNext(false);
      setTotalCount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setHasNext(false);
    setTotalCount(null);
    void loadIngredients(0, false);
  }, [accessToken, selectedCategories, sortType, search]);

  const visibleItems = useMemo(() => items, [items]);
  const fridgeTotalPages = Math.max(1, totalCount == null ? page + (hasNext ? 2 : 1) : Math.ceil(totalCount / listPageSize));
  const fridgeCanGoNext = hasNext || (totalCount != null && page + 1 < fridgeTotalPages);

  const warningCount = countExpiringSoon(items);

  const toggleCategory = (category: string) => {
    if (category === '전체') {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories(current => (current.includes(category) ? current.filter(item => item !== category) : [...current, category]));
  };

  const submitSearch = () => {
    setSearch(searchDraft.trim());
  };
  const openEditModal = (item: Ingredient) => {
    setEditingItem({ ...item });
    setEditIngredientSelected(true);
    setEditIngredientSuggestions([]);
    setActiveEditIngredientCategory(item.category || '채소/과일');
    setEditVisible(true);
  };
  const loadEditCategoryIngredients = async (nextCategory: string) => {
    setActiveEditIngredientCategory(nextCategory);
    try {
      const data = await getIngredientsByCategory(nextCategory);
      setEditIngredientCategorySuggestions(extractIngredientNames(data));
    } catch {
      setEditIngredientCategorySuggestions([]);
    }
  };
  const selectEditStandardIngredient = (name: string, nextCategory = editIngredientCategoryIndex.get(name) || activeEditIngredientCategory) => {
    setEditingItem(current => current ? { ...current, name, category: nextCategory } : current);
    setEditIngredientSelected(true);
    setEditIngredientSuggestions([]);
  };

  useEffect(() => {
    let active = true;
    void Promise.all(ingredientCategories.filter(category => category !== '전체').map(async (categoryName) => {
      try {
        const data = await getIngredientsByCategory(categoryName);
        return extractIngredientNames(data).map((name): [string, string] => [name, categoryName]);
      } catch {
        return [];
      }
    })).then((entriesByCategory) => {
      if (active) {
        setEditIngredientCategoryIndex(new Map(entriesByCategory.flat()));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const keyword = editingItem?.name.trim() ?? '';
    if (!editVisible || editIngredientSelected || keyword.length === 0) {
      setEditIngredientSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchIngredients(keyword);
        if (active) {
          setEditIngredientSuggestions(extractIngredientNames(data));
        }
      } catch {
        if (active) {
          setEditIngredientSuggestions([]);
        }
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [editingItem?.name, editIngredientSelected, editVisible]);

  const saveEditingIngredient = async () => {
    if (!editingItem || savingIngredient) {
      return;
    }
    const backendId = editingItem.userIngredientId ?? editingItem.id;
    if (!backendId) {
      setMessage('수정할 식재료 정보를 찾지 못했어요. 목록을 새로고침한 뒤 다시 시도해주세요.');
      return;
    }
    if (!editingItem.name.trim()) {
      setMessage('식재료명을 입력해 주세요.');
      return;
    }
    if (!editIngredientSelected) {
      setMessage('검색 결과나 카테고리 목록에서 표준 식재료를 선택해 주세요.');
      return;
    }
    if (!editingItem.date) {
      setMessage('소비기한을 선택해 주세요.');
      return;
    }
    try {
      setSavingIngredient(true);
      await updateMyIngredient({
        userIngredientId: backendId,
        ingredient: editingItem.name.trim(),
        purchaseDate: editingItem.purchaseDate,
        expirationDate: editingItem.date,
        status: editingItem.status,
      });
      setItems(current => current.map(item => item.id === editingItem.id ? {
        ...editingItem,
        name: editingItem.name.trim(),
        dday: formatDdayLabel(undefined, editingItem.date),
      } : item));
      setEditVisible(false);
      setEditingItem(null);
      setMessage('');
      void loadIngredients(0, false);
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 수정하지 못했어요.'));
    } finally {
      setSavingIngredient(false);
    }
  };
  const deleteBackendIngredients = async (backendIds: Array<string | number>) => {
    if (backendIds.length === 0 || deletingIngredients) {
      setMessage('삭제할 식재료 정보를 찾지 못했어요.');
      return;
    }
    try {
      setDeletingIngredients(true);
      await deleteMyIngredients(backendIds);
      setItems(current => current.filter(item => !backendIds.includes(item.userIngredientId ?? item.id)));
      setSelectedIds([]);
      setSelectionMode(false);
      setEditVisible(false);
      setEditingItem(null);
      setPendingDeleteIngredientIds([]);
      setPendingDeleteLabel('');
      setMessage('');
    } catch (caughtError) {
      setMessage(getErrorMessage(caughtError, '식재료를 삭제하지 못했어요.'));
    } finally {
      setDeletingIngredients(false);
    }
  };

  return (
    <section className="screen">
      <header className="page-header compact">
        <div className="title-row">
          <div>
            <h1>내 식자재</h1>
            <p>소비기한이 3일 이내 식자재가 {warningCount}개 있어요.</p>
          </div>
          <button className={`icon-button ${selectionMode ? 'active' : ''}`} type="button" onClick={() => {
            setSelectionMode(current => !current);
            setSelectedIds([]);
          }}>
            {selectionMode ? '×' : '☰'}
          </button>
        </div>
        {selectionMode ? (
          <div className="selection-bar">
            <span>{selectedIds.length}개 선택됨</span>
            <button type="button" disabled={selectedIds.length === 0} onClick={async () => {
              const backendIds = items
                .filter(item => selectedIds.includes(item.id))
                .map(item => item.userIngredientId ?? item.id)
                .filter(Boolean) as Array<string | number>;
              if (backendIds.length !== selectedIds.length) {
                setMessage('일부 식재료의 삭제 ID를 찾지 못했어요. 목록을 새로고침한 뒤 다시 시도해주세요.');
                return;
              }
              setPendingDeleteIngredientIds(backendIds);
              setPendingDeleteLabel(`선택한 식재료 ${selectedIds.length}개를 삭제할까요?`);
            }}>삭제</button>
          </div>
        ) : null}
        <div className="toolbar-row fridge-toolbar-row">
          <button
            className="fridge-sort-trigger"
            type="button"
            aria-label="정렬"
            onClick={() => setSortPickerVisible(true)}
          >
            <span>{sortType}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          <form className="search-control fridge-search-control" onSubmit={event => {
            event.preventDefault();
            submitSearch();
          }}>
            <input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="검색어를 입력하세요" />
            <button type="submit" aria-label="식재료 검색">⌕</button>
          </form>
        </div>
        <div className="horizontal-chips">
          {ingredientCategories.map(category => (
            <button
              className={(category === '전체' && selectedCategories.length === 0) || selectedCategories.includes(category) ? 'selected' : ''}
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      {sortPickerVisible ? (
        <BottomSheet
          className="fridge-sort-sheet"
          open={sortPickerVisible}
          onClose={() => setSortPickerVisible(false)}
          header={<BottomSheet.Header>정렬</BottomSheet.Header>}
        >
          <div className="tds-picker-section">
            <BottomSheet.Select
              value={sortType}
              onChange={(event) => {
                setSortType(event.target.value);
                setSortPickerVisible(false);
              }}
              options={fridgeSortSelectOptions}
            />
          </div>
        </BottomSheet>
      ) : null}
      {message ? <p className="inline-message">{message}</p> : null}
      {loading ? <p className="empty-text">식재료를 불러오는 중이에요.</p> : null}
      <div className="item-list">
        {visibleItems.map(item => {
          const visual = categoryVisuals[item.category] ?? categoryVisuals.기타;
          const selected = selectedIds.includes(item.id);
          return (
            <button
              className={`ingredient-row ${selected ? 'selected' : ''}`}
              key={item.id}
              type="button"
              onClick={() => {
                if (selectionMode) {
                  setSelectedIds(current => (current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]));
                  return;
                }
                openEditModal(item);
              }}
            >
              {selectionMode ? <span className={`check ${selected ? 'on' : ''}`}>{selected ? '✓' : ''}</span> : null}
              <span className="item-image" style={{ backgroundColor: visual?.color }}>
                <img src={visual?.image} alt="" />
              </span>
              <span className="item-copy">
                <strong>{item.name}</strong>
                <small>{item.status ?? '미사용'} · {item.category}</small>
              </span>
              <span className="item-meta">
                <em className={`dday ${getDdayClass(item.dday)}`}>{item.dday}</em>
                <small>{item.date}</small>
              </span>
            </button>
          );
        })}
      </div>
      {!loading && visibleItems.length === 0 && !message ? (
        <div className="empty-state fridge-empty-state">
          <strong>{items.length === 0 ? '등록된 재료가 없어요.' : '조건에 맞는 재료가 없어요.'}</strong>
          <p>
            {items.length === 0
              ? "'추가' 버튼을 눌러 재료를 추가해 주세요."
              : '검색어나 카테고리를 다시 확인해 주세요.'}
          </p>
        </div>
      ) : null}
      {!loading && visibleItems.length > 0 ? (
        <div className="list-pagination fridge-pagination">
          <button type="button" disabled={page === 0 || loading} onClick={() => loadIngredients(Math.max(0, page - 1), false)}>이전</button>
          <span>{page + 1} / {fridgeTotalPages}</span>
          <button type="button" disabled={!fridgeCanGoNext || loading} onClick={() => loadIngredients(page + 1, false)}>다음</button>
        </div>
      ) : null}
      <TossAdSlot />

      <div className={`fab-menu ${addOpen ? 'open' : ''}`}>
        {addOpen ? (
          <div className="fab-options">
            <button type="button" onClick={() => {
              setAddOpen(false);
              goTo({ view: 'directInput' });
            }}>직접 입력</button>
            <button type="button" onClick={() => {
              setAddOpen(false);
              goTo({ view: 'receiptGallery' });
            }}>영수증 등록</button>
            <button type="button" onClick={async () => {
              setAddOpen(false);
              goTo({ view: 'receiptCamera' });
            }}>영수증 촬영</button>
          </div>
        ) : null}
        <button className="fab" type="button" onClick={() => setAddOpen(current => !current)}>{addOpen ? '×' : '+ 추가'}</button>
      </div>
      {editVisible && editingItem ? (
        <BottomSheet
          className="fridge-edit-sheet"
          open={editVisible}
          onClose={() => setEditVisible(false)}
          header={<BottomSheet.Header>식재료 수정</BottomSheet.Header>}
        >
          <div className="edit-ingredient-sheet">
            <Button
              display="block"
              variant="weak"
              onClick={() => {
                setPendingDeleteIngredientIds([editingItem.userIngredientId ?? editingItem.id]);
                setPendingDeleteLabel(`${editingItem.name || '이 식재료'}를 삭제할까요?`);
              }}
            >
              삭제
            </Button>
            <TextField
              variant="box"
              label="식재료명"
              labelOption="sustain"
              value={editingItem.name}
              onChange={event => {
                setEditingItem(current => current ? { ...current, name: event.target.value } : current);
                setEditIngredientSelected(false);
              }}
              placeholder="표준 식재료를 검색하거나 선택해주세요"
            />
            {editIngredientSuggestions.length > 0 ? (
              <div className="suggestion-list">
                {editIngredientSuggestions.map(name => (
                  <button key={name} type="button" onClick={() => selectEditStandardIngredient(name)}>
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
            {editingItem.name && !editIngredientSelected ? <p className="selection-hint">표준 재료 선택 필요</p> : null}
            <button className="category-picker-button" type="button" onClick={() => {
              setEditIngredientPickerOpen(true);
              void loadEditCategoryIngredients(activeEditIngredientCategory);
            }}>
              <strong>카테고리에서 표준 식재료 고르기</strong>
              <small>검색이 어렵다면 목록에서 선택하세요.</small>
            </button>
            <div className="tds-picker-section">
              <strong className="edit-label">사용 여부</strong>
              <BottomSheet.Select
                value={editingItem.status ?? '미사용'}
                onChange={event => setEditingItem(current => current ? { ...current, status: event.target.value } : current)}
                options={statusSelectOptions}
              />
            </div>
            <div className="tds-picker-section">
              <strong className="edit-label">표준 분류</strong>
              <div className="readonly-field" aria-label="표준 분류">{editingItem.category}</div>
            </div>
            <div className={`date-picker-field edit-expiration-field ${editingItem.date ? 'has-value' : 'is-empty'}`}>
              <span>소비기한</span>
              <WheelDatePicker
                title="소비기한"
                triggerLabel=""
                format="yyyy-MM-dd"
                value={parseDateInputValue(editingItem.date)}
                initialDate={parseDateInputValue(editingItem.date) ?? parseDateInputValue(editingItem.purchaseDate)}
                onChange={(date) => setEditingItem(current => current ? { ...current, date: formatDate(date) } : current)}
              />
            </div>
            <Button display="block" disabled={savingIngredient} onClick={() => void saveEditingIngredient()}>{savingIngredient ? '저장 중' : '저장'}</Button>
            <Button display="block" variant="weak" onClick={() => setEditVisible(false)}>취소</Button>
          </div>
        </BottomSheet>
      ) : null}
      {editIngredientPickerOpen ? (
        <BottomSheet
          className="fridge-standard-sheet"
          open={editIngredientPickerOpen}
          onClose={() => setEditIngredientPickerOpen(false)}
          header={<BottomSheet.Header>표준 식재료 선택</BottomSheet.Header>}
        >
          <div className="tds-picker-section">
            <strong className="edit-label">카테고리</strong>
            <BottomSheet.Select
              value={activeEditIngredientCategory}
              onChange={(event) => {
                void loadEditCategoryIngredients(event.target.value);
              }}
              options={directCategorySelectOptions}
            />
          </div>
          <div className="tds-picker-section">
            <strong className="edit-label">식재료</strong>
            {editStandardIngredientSelectOptions.length === 0 ? <p className="empty-text">표시할 식재료가 없어요.</p> : (
              <BottomSheet.Select
                value={editStandardIngredientSelectOptions.some(option => option.value === editingItem?.name) ? editingItem?.name : ''}
                onChange={(event) => {
                  selectEditStandardIngredient(event.target.value, activeEditIngredientCategory);
                  setEditIngredientPickerOpen(false);
                }}
                options={editStandardIngredientSelectOptions}
              />
            )}
          </div>
        </BottomSheet>
      ) : null}
      <ConfirmDialog
        open={pendingDeleteIngredientIds.length > 0}
        title="식재료 삭제"
        description={pendingDeleteLabel}
        onClose={() => {
          setPendingDeleteIngredientIds([]);
          setPendingDeleteLabel('');
        }}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => {
          setPendingDeleteIngredientIds([]);
          setPendingDeleteLabel('');
        }}>취소</ConfirmDialog.CancelButton>}
        confirmButton={<ConfirmDialog.ConfirmButton disabled={deletingIngredients} onClick={() => void deleteBackendIngredients(pendingDeleteIngredientIds)}>{deletingIngredients ? '삭제 중' : '삭제'}</ConfirmDialog.ConfirmButton>}
      />
    </section>
  );
}

export default function App() {
  const [root, setRoot] = useState<RootScreen>('splash');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [prefers, setPrefers] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [setupMode, setSetupMode] = useState<'firstLogin' | 'edit'>('firstLogin');
  const [setupInitial, setSetupInitial] = useState({ allergies: [] as string[], prefers: [] as string[], dislikes: [] as string[] });
  const [setupMessage, setSetupMessage] = useState('');

  const applyPreferenceSnapshot = (snapshot: { allergies: string[]; prefers: string[]; dislikes: string[] }) => {
    setAllergies(snapshot.allergies);
    setPrefers(snapshot.prefers);
    setDislikes(snapshot.dislikes);
    setSetupInitial(snapshot);
    writeStoredSetupPreferences(snapshot);
  };

  const loadPreferenceSnapshot = async () => {
    const remote = await getPreferenceSettings();
    const snapshot = normalizePreferenceSettings(remote);
    applyPreferenceSnapshot(snapshot);
    return snapshot;
  };

  const finishSetup = async () => {
    try {
      if (setupMode === 'firstLogin') {
        await saveFirstLoginIngredients({
          allergies,
          preferIngredients: prefers,
          dispreferIngredients: dislikes,
        });
      } else {
        await updateAllergies({ oldAllergy: setupInitial.allergies, newAllergy: allergies });
        await updatePreferenceIngredients({ type: 'prefer', oldPrefer: setupInitial.prefers, newPrefer: prefers });
        await updatePreferenceIngredients({ type: 'disprefer', oldPrefer: setupInitial.dislikes, newPrefer: dislikes });
      }
      const snapshot = { allergies, prefers, dislikes };
      applyPreferenceSnapshot(snapshot);
      setSetupMessage('');
      if (setupMode === 'firstLogin') {
        setRoot('profileSetup');
        return;
      }
      markStoredSetupCompleted();
      setRoot('main');
    } catch (caughtError) {
      setSetupMessage(getErrorMessage(caughtError, '초기 설정을 저장하지 못했어요.'));
    }
  };

  const finishProfileSetup = async (nickname: string) => {
    const storedProfile = readStoredProfile();
    let oldNickname = storedProfile?.nickname ?? '';
    try {
      const profile = await getMyProfile();
      oldNickname = profile?.nickName ?? profile?.nickname ?? profile?.name ?? oldNickname;
    } catch {
      // The nickname update endpoint needs the previous nickname. Stored profile is the fallback.
    }
    if (oldNickname && oldNickname !== nickname) {
      await updateNickname({ oldNickName: oldNickname, newNickName: nickname });
    }
    writeStoredProfile({ nickname, profileImage: storedProfile?.profileImage ?? '' });
    markStoredSetupCompleted();
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/home');
    }
    setRoot('main');
  };

  if (root === 'splash') {
    return (
      <SplashScreen
        onFirstLogin={(token) => {
          setMiniappAccessToken(token);
          setAccessToken(token);
          setSetupMode('firstLogin');
          setSetupInitial({ allergies: [], prefers: [], dislikes: [] });
          setAllergies([]);
          setPrefers([]);
          setDislikes([]);
          setRoot('allergy');
        }}
        onComplete={(token) => {
          setMiniappAccessToken(token);
          setAccessToken(token);
          void (async () => {
            const hadLocalSetup = readStoredSetupCompleted() || readStoredSetupPreferences() !== null;
            let snapshot = { allergies: [] as string[], prefers: [] as string[], dislikes: [] as string[] };
            try {
              snapshot = await loadPreferenceSnapshot();
            } catch {
              const stored = readStoredSetupPreferences();
              if (stored) {
                applyPreferenceSnapshot(stored);
                snapshot = stored;
              }
            }
            if (!hadLocalSetup && !hasAnySetupPreference(snapshot)) {
              setSetupMode('edit');
              setSetupInitial(snapshot);
              setRoot('allergy');
              return;
            }
            if (hasAnySetupPreference(snapshot)) {
              markStoredSetupCompleted();
            }
            setRoot('main');
          })();
        }}
      />
    );
  }

  if (root === 'allergy') {
    return <SetupScreen kind="allergy" selected={allergies} onChange={setAllergies} onNext={() => setRoot('prefer')} />;
  }

  if (root === 'prefer') {
    return <SetupScreen kind="prefer" selected={prefers} onChange={setPrefers} onNext={() => setRoot('dislike')} onSkip={() => setRoot('dislike')} />;
  }

  if (root === 'dislike') {
    return (
      <>
        <SetupScreen kind="dislike" selected={dislikes} onChange={setDislikes} onNext={() => void finishSetup()} onSkip={() => void finishSetup()} />
        {setupMessage ? <p className="setup-error inline-message">{setupMessage}</p> : null}
      </>
    );
  }

  if (root === 'profileSetup') {
    return <ProfileSetupScreen onComplete={finishProfileSetup} />;
  }

  return <MainApp accessToken={accessToken} allergies={allergies} prefers={prefers} dislikes={dislikes} onRestartSetup={() => {
    void loadPreferenceSnapshot()
      .catch(() => {
        const stored = readStoredSetupPreferences();
        applyPreferenceSnapshot(stored ?? { allergies, prefers, dislikes });
      })
      .finally(() => {
        setSetupMode('edit');
        setRoot('allergy');
      });
  }} onAccountDeleted={() => {
    setMiniappAccessToken(null);
    clearStoredUserState();
    setAccessToken(null);
    setAllergies([]);
    setPrefers([]);
    setDislikes([]);
    setSetupInitial({ allergies: [], prefers: [], dislikes: [] });
    setSetupMode('firstLogin');
    setRoot('splash');
  }} />;
}
