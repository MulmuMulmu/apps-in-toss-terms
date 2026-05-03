import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const apiSource = fs.readFileSync(path.join(root, 'src', 'services', 'miniappApi.ts'), 'utf8');
const authSource = fs.readFileSync(path.join(root, 'src', 'domain', 'auth.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const graniteSource = fs.readFileSync(path.join(root, 'granite.config.ts'), 'utf8');
const viteSource = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
const administrativeRegionsPath = path.join(root, 'src', 'data', 'administrativeRegions.json');

const requiredViews = [
  'DirectInputView',
  'ReceiptCameraView',
  'ReceiptGalleryView',
  'ReceiptLoadingView',
  'ReceiptResultView',
  'RecipeDetailView',
  'RecipeRecommendView',
  'RecipeResultView',
  'LocationSettingView',
  'MarketWriteView',
  'MarketDetailView',
  'MyPostsView',
  'MyShareHistoryView',
  'ChatRoomView',
  'AccountDeleteFlow',
];

for (const view of requiredViews) {
  assert.match(appSource, new RegExp(`function\\s+${view}\\b|const\\s+${view}\\b`), `${view} must be implemented in the WebView app`);
}

const requiredActions = [
  'createIngredient',
  'createIngredients',
  'updateMyIngredient',
  'deleteMyIngredients',
  'searchIngredients',
  'getIngredientsByCategory',
  'getMyIngredientsPage',
  'getNearExpiringIngredients',
  'predictIngredientExpirations',
  'saveFirstLoginIngredients',
  'getPreferenceSettings',
  'updateAllergies',
  'updatePreferenceIngredients',
  'getRecipeDetail',
  'getShareDetail',
  'createSharePost',
  'updateSharePost',
  'deleteMySharePost',
  'getMyShareList',
  'updateShareLocation',
  'getMyShareLocation',
  'searchShareLocations',
  'completeShareSuccession',
  'reportSharePost',
  'startChat',
  'getChatMessages',
  'getChatMessagesPage',
  'sendChatMessage',
  'markChatAsRead',
  'reportChat',
  'blockChat',
  'deleteChatRoom',
  'deleteChatRooms',
  'deleteAccount',
];

for (const action of requiredActions) {
  assert.match(apiSource, new RegExp(`export\\s+async\\s+function\\s+${action}\\b`), `${action} API wrapper must exist`);
}

assert.match(appSource, /type\s+ViewRoute\s*=/, 'WebView app must use explicit view routing');
assert.match(appSource, /goTo\(\{ view: 'receiptLoading'/, 'receipt analysis must route through loading view');
assert.match(appSource, /goTo\(\{ view: 'receiptCamera' \}\)/, 'receipt camera action must route through the dedicated camera guide screen');
assert.match(appSource, /goTo\(\{ view: 'chatRoom'/, 'chat list must open chat room view');
assert.match(appSource, /goTo\(\{ view: 'marketDetail'/, 'share list must open market detail view');
assert.match(appSource, /goTo\(\{ view: 'recipeDetail'/, 'recipe list must open recipe detail view');
assert.match(appSource, /setSearchVisible/, 'share screen must preserve the original toggleable search header');
assert.match(appSource, /setRadiusModalVisible/, 'share radius selector must preserve the original bottom-sheet flow');
assert.match(appSource, /className="radius-track"/, 'share radius selector must show the original gauge track');
assert.match(appSource, /className="market-radius-chip"/, 'share screen must use the dropdown-style radius chip');
assert.match(appSource, /className="market-write-button"/, 'share write action must use the dedicated fixed WebView write button');
assert.match(appSource, /locationRequiredVisible/, 'share write action must require a saved share location before opening the write form');
assert.match(appSource, /나눔 글을 작성하려면 나눔 위치를 먼저 설정해야 해요/, 'share write location gate must explain why writing is blocked');
assert.match(appSource, /setLocationRequiredVisible\(true\)/, 'share write action must show a location setup prompt when no location is saved');
assert.doesNotMatch(appSource, /<button className="fab" type="button" onClick=\{\(\) => goTo\(\{ view: 'marketWrite' \}\)\}>글쓰기<\/button>/, 'share write action must not be rendered as an in-flow generic FAB');
assert.match(appSource, /administrativeRegions/, 'location setting must use the administrative region dataset');
assert.match(appSource, /selectedSiCode/, 'location setting must preserve city/province selection');
assert.match(appSource, /selectedGuCode/, 'location setting must preserve district selection');
assert.match(appSource, /selectedDongCode/, 'location setting must preserve dong selection');
assert.doesNotMatch(appSource, /동 이름은 카카오 주소 변환 결과로 표시돼요/, 'location guide must not expose Kakao conversion implementation copy');
assert.match(appSource, /fridge-search-control/, 'fridge search must use an explicit search submit control');
assert.match(appSource, /recipe-search-control/, 'recipe search must use an inline icon submit control');
assert.doesNotMatch(appSource, /<button type="button" onClick=\{loadRecipes\}>검색<\/button>/, 'recipe search must not use a separate text search button');
assert.match(appSource, /categoryPickerOpen/, 'direct input must preserve standard ingredient picker flow');
assert.match(appSource, /표준 식재료/, 'direct input standard ingredient picker must keep a concise visible label');
assert.match(appSource, /카테고리에서 표준 식재료 고르기[\s\S]*검색이 어렵다면 목록에서 선택하세요\./, 'direct input standard ingredient picker must use the requested category-picker copy');
assert.match(appSource, /function\s+DirectInputDetailView[\s\S]*<TextField[\s\S]*label="식재료"[\s\S]*<WheelDatePicker[\s\S]*triggerLabel="구매일자"[\s\S]*<WheelDatePicker[\s\S]*title="소비기한"[\s\S]*triggerLabel=""[\s\S]*<BottomSheet\.Select[\s\S]*options=\{directCategorySelectOptions\}/, 'direct input detail form must use TDS TextField, WheelDatePicker, and BottomSheet.Select instead of native inputs');
assert.match(appSource, /function\s+DirectInputDetailView[\s\S]*categoryPickerOpen[\s\S]*className="direct-standard-sheet"[\s\S]*<BottomSheet\.Select[\s\S]*options=\{directCategorySelectOptions\}[\s\S]*<BottomSheet\.Select[\s\S]*options=\{standardIngredientSelectOptions\}/, 'direct input standard ingredient picker must use TDS BottomSheet.Select instead of expanding an inline list');
assert.doesNotMatch(appSource, /function\s+DirectInputDetailView[\s\S]*<label>구매일자<input type="date"/, 'direct input detail purchase date must not use a native date input');
assert.doesNotMatch(appSource, /function\s+DirectInputDetailView[\s\S]*<label>카테고리<select/, 'direct input detail category must not use a native select');
assert.match(appSource, /function\s+DirectInputView[\s\S]*className=\{`date-picker-field \$\{expirationDate \? 'has-value' : 'is-empty'\}`\}/, 'direct input expiry date picker must expose empty/value state for stable positioning');
assert.match(appSource, /function\s+DirectInputDetailView[\s\S]*className=\{`date-picker-field \$\{currentItem\?\.expirationDate \? 'has-value' : 'is-empty'\}`\}/, 'receipt direct input expiry date picker must expose empty/value state for stable positioning');
assert.match(appSource, /predictIngredientExpirations/, 'direct input must integrate expiration prediction');
assert.match(appSource, /purchaseDate,\s*expirationDate/, 'direct input must keep the legacy purchase date in the ingredient create payload');
assert.match(appSource, /initialItems/, 'direct input must accept receipt-recognized initial items');
assert.match(appSource, /editingIndex/, 'direct input must support editing each recognized receipt item');
assert.match(appSource, /인식된 품목/, 'direct input must show recognized receipt item chips');
assert.doesNotMatch(appSource, /영수증 표기명:/, 'receipt direct input must not show raw receipt display names in the edit form');
assert.match(appSource, /item\?\.normalized_name != null[\s\S]*canonicalCategory \? \{ \.\.\.item, category: canonicalCategory, selected: true \}/, 'receipt mapped normalized ingredients must be auto-selected as standard ingredients');
assert.doesNotMatch(appSource, /표준 식재료명: \{currentItem\.name\}/, 'receipt direct input must use selectable candidate chips instead of a selected-standard label');
assert.match(appSource, /const exactCanonicalName = ingredientCategoryIndex\.has\(keyword\) \? keyword : ''[\s\S]*const mergedNames = \[exactCanonicalName,[\s\S]*\]\.filter\(Boolean\)[\s\S]*setSuggestions\(Array\.from\(new Set\(mergedNames\)\)\)/, 'receipt direct input must merge exact canonical and containing backend candidates under the field');
assert.match(appSource, /existingIngredientNames/, 'direct input must block duplicate ingredient saves like Expo');
assert.match(appSource, /ingredientCategoryIndex/, 'direct input must auto-map selected standard ingredients back to their canonical categories');
assert.match(appSource, /normalizeDateInputValue/, 'receipt/direct input must normalize OCR date strings before binding and saving');
assert.doesNotMatch(appSource, /화면에만 반영/, 'save failures must not be hidden by local-only UI updates');
assert.match(apiSource, /export\s+function\s+setMiniappAccessToken\b/, 'API layer must keep the active service JWT for protected backend calls');
assert.match(apiSource, /const authorization = toBearerToken\(accessToken\)/, 'protected backend calls must derive a Bearer Authorization header');
assert.match(apiSource, /Authorization:\s*authorization/, 'protected backend calls must send an Authorization header');
assert.match(apiSource, /window\.location\.hostname/, 'local WebView preview must be able to target the local backend');
assert.match(apiSource, /LOCAL_API_PROXY_PATH\s*=\s*['"]\/api['"]/, 'local browser preview must use the Vite same-origin API proxy to avoid CORS');
assert.match(apiSource, /PRODUCTION_API_BASE_URL\s*=\s*['"]https:\/\/mulmumu-backend-aqjxa3obfa-du\.a\.run\.app['"]/, 'production WebView builds must retain a backend fallback when VITE_API_BASE_URL is not injected');
assert.match(apiSource, /const baseUrl = isLocalPreviewHost\(\) \? LOCAL_API_PROXY_PATH : getApiBaseUrl\(\)/, 'local backend login must force the same-origin proxy path');
assert.match(viteSource, /proxy:\s*\{[\s\S]*['"]\/api['"]/, 'Vite dev server must proxy local API requests');
assert.match(viteSource, /removeHeader\(\s*['"]origin['"]\s*\)/, 'Vite API proxy must strip browser Origin headers that local Spring CORS rejects');
assert.match(viteSource, /rewrite:\s*\(path\)\s*=>\s*path\.replace\(\s*\/\^\\\/api\//, 'Vite API proxy must strip the /api prefix before forwarding to the backend');
assert.match(apiSource, /export\s+async\s+function\s+loginWithLocalBackend\b/, 'local browser preview must have a backend-backed login path');
assert.match(apiSource, /\/ingredient\/preferences/, 'existing users must load allergy/preference settings from the backend');
assert.match(appSource, /loadPreferenceSnapshot/, 'root app must hydrate setup preferences from backend after login and before edit');
assert.match(appSource, /getPreferenceSettings\(\)/, 'root app must call backend preference settings instead of relying only on localStorage');
assert.match(apiSource, /sort:\s*options\.sort \?\? 'date&ascending'|sort = 'date&ascending'/, 'my ingredient requests must satisfy the backend sort query contract');
assert.match(apiSource, /\/recipe\/recommendations/, 'recipe recommendations must use the legacy backend endpoint');
assert.doesNotMatch(apiSource, /\/ingredient\/recommondation/, 'recipe recommendations must not call the removed misspelled endpoint');
assert.doesNotMatch(apiSource, /\/ingredient\/recommondation/, 'root WebView app must not keep the removed misspelled recommendation endpoint');
assert.match(indexSource, /maximum-scale=1/, 'root WebView app must disable pinch zoom in the viewport meta tag');
assert.match(indexSource, /user-scalable=no/, 'root WebView app must disable user scaling in the viewport meta tag');
assert.doesNotMatch(authSource, /refreshToken\s*=/, 'WebView client must not parse or keep server refresh tokens');
assert.match(appSource, /getMyIngredientsPage\(\{\s*accessToken,\s*sort:/, 'fridge screen must pass sort and category filters to backend pagination');
assert.match(appSource, /getMyIngredientsPage\(\{[\s\S]*page: nextPage,[\s\S]*size: listPageSize/, 'fridge screen must request 10 ingredients per page');
assert.match(appSource, /const\s+formatDdayLabel[\s\S]*day < 0 \? `D\+\$\{Math\.abs\(day\)\}` : `D-\$\{day\}`/, 'fridge D-day labels must render expired backend negative values as D+N, not D--N');
assert.match(appSource, /const\s+normalizeIngredient[\s\S]*dday:\s*formatDdayLabel\(dday,\s*expirationDate\)/, 'fridge ingredient normalization must use canonical D-day label formatting');
assert.match(appSource, /hasNext/, 'fridge and paged list screens must preserve backend pagination state');
assert.match(appSource, /className="list-pagination fridge-pagination"/, 'fridge screen must expose 10-item page navigation controls');
assert.match(appSource, /editVisible/, 'fridge item tap must restore the legacy edit modal');
assert.match(appSource, /식재료 수정/, 'fridge edit modal must expose item edit/delete UI');
assert.match(appSource, /savingIngredient/, 'fridge edit save must guard duplicate backend update taps');
assert.match(appSource, /updateMyIngredient\(/, 'fridge edit save must persist changes through the backend update API');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*<BottomSheet[\s\S]*className="fridge-edit-sheet"[\s\S]*<TextField[\s\S]*label="식재료명"[\s\S]*<BottomSheet\.Select[\s\S]*options=\{statusSelectOptions\}[\s\S]*<strong className="edit-label">표준 분류<\/strong>[\s\S]*<div className="readonly-field" aria-label="표준 분류">\{editingItem\.category\}<\/div>[\s\S]*className=\{`date-picker-field edit-expiration-field \$\{editingItem\.date \? 'has-value' : 'is-empty'\}`\}[\s\S]*<WheelDatePicker[\s\S]*title="소비기한"/, 'fridge edit form must use TDS BottomSheet/TextField, TDS status Select, read-only canonical category, and a WheelDatePicker expiration editor');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*if \(!editingItem\.date\) \{[\s\S]*setMessage\('소비기한을 선택해 주세요\.'\)/, 'fridge edit save must require an expiration date before updating');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*updateMyIngredient\(\{[\s\S]*expirationDate:\s*editingItem\.date[\s\S]*dday:\s*formatDdayLabel\(undefined,\s*editingItem\.date\)[\s\S]*loadIngredients\(0,\s*false\)/, 'fridge edit save must update the visible D-day immediately and then refresh from backend state');
assert.doesNotMatch(appSource, /fridgeCategorySelectOptions/, 'fridge edit must not expose direct category editing because category is tied to the canonical ingredient model');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*editIngredientPickerOpen[\s\S]*editIngredientCategorySuggestions[\s\S]*loadEditCategoryIngredients[\s\S]*selectEditStandardIngredient/, 'fridge edit ingredient name changes must use the standard ingredient picker flow');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*searchIngredients\(keyword\)[\s\S]*setEditIngredientSuggestions/, 'fridge edit ingredient name search must query backend standard ingredients');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*className="fridge-standard-sheet"[\s\S]*<BottomSheet\.Select[\s\S]*options=\{directCategorySelectOptions\}[\s\S]*<BottomSheet\.Select[\s\S]*options=\{editStandardIngredientSelectOptions\}/, 'fridge edit standard ingredient picker must use TDS BottomSheet.Select category and ingredient controls');
assert.doesNotMatch(appSource, /function\s+FridgeScreenContent[\s\S]*<TextField[\s\S]*label="식재료명"[\s\S]*onChange=\{event => setEditingItem\(current => current \? \{ \.\.\.current, name: event\.target\.value \} : current\)\}/, 'fridge edit ingredient name must not be a free-text-only field');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*sortPickerVisible[\s\S]*<button[\s\S]*className="fridge-sort-trigger"[\s\S]*<span>\{sortType\}<\/span>[\s\S]*<span aria-hidden="true">⌄<\/span>[\s\S]*<BottomSheet[\s\S]*className="fridge-sort-sheet"[\s\S]*<BottomSheet\.Select[\s\S]*options=\{fridgeSortSelectOptions\}/, 'fridge sort picker must use a compact select-like trigger and BottomSheet.Select');
assert.doesNotMatch(appSource, /function\s+FridgeScreenContent[\s\S]*<select value=\{sortType\}/, 'fridge sort picker must not use a native select');
assert.match(appSource, /function\s+FridgeScreenContent[\s\S]*<ConfirmDialog[\s\S]*title="식재료 삭제"[\s\S]*deleteBackendIngredients\(pendingDeleteIngredientIds\)/, 'fridge delete confirmation must use the TDS ConfirmDialog primitive');
assert.doesNotMatch(appSource, /editVisible && editingItem \? \(\s*<div className="modal-overlay"/, 'fridge edit must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /pendingDeleteIngredientIds\.length > 0 \? \(\s*<div className="modal-overlay"/, 'fridge delete confirmation must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /onClick=\{\(\) => \{\s*setItems\(current => current\.map\(item => item\.id === editingItem\.id \? editingItem : item\)\);[\s\S]*?setEditVisible\(false\);[\s\S]*?setEditingItem\(null\);[\s\S]*?\}\}>저장<\/button>/, 'fridge edit save must not be local-only');
assert.match(appSource, /fetchMyIngredients\(\{?\s*sort:\s*'date&ascending'/, 'recipe recommendations must reload the full backend ingredient list instead of using only the visible fridge snapshot');
assert.match(appSource, /recipe-pagination/, 'recipe browsing must expose backend pagination controls');
assert.match(appSource, /normalizeRecipeDetail/, 'recipe detail must normalize the legacy backend detail shape');
assert.match(appSource, /typeof item === 'string' \? item : item\?\.description/, 'recipe detail must preserve string-array cooking steps from the backend');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*fetchMyIngredients[\s\S]*imageUri/, 'share writing must load owned ingredients and pass imageUri through the form-data API');
assert.match(appSource, /safetyNoticeVisible/, 'share writing must show the legacy safety agreement modal before editing');
assert.match(appSource, /finalConfirmVisible/, 'share writing must show the legacy final confirmation modal before submit');
assert.match(appSource, /무료 나눔이어도 식품 안전 기준/, 'share safety modal copy must remain explicit for food-safety review');
assert.match(appSource, /photoModalVisible/, 'share writing must preserve camera/gallery photo modal state');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*<TextField[\s\S]*label="제목"[\s\S]*<WheelDatePicker[\s\S]*title="소비기한"[\s\S]*<TextArea[\s\S]*label="설명"/, 'share write form fields must use TDS TextField, WheelDatePicker, and TextArea primitives');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*<BottomSheet[\s\S]*className="share-photo-sheet"[\s\S]*<BottomSheet[\s\S]*className="share-food-sheet"/, 'share write photo and ingredient pickers must use TDS BottomSheet primitives');
assert.doesNotMatch(appSource, /className="share-category-sheet"/, 'share write category must not be manually selectable');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*className="share-two-column-row"[\s\S]*<strong className="edit-label">분류<\/strong>[\s\S]*<div className="readonly-field" aria-label="분류">\{category \|\| '자동 분류'\}<\/div>/, 'share write ingredient and derived category must share one row');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*<Button display="block" disabled=\{submitting\} onClick=\{handleSubmit\}/, 'share write submit must stay tappable so policy violations can explain why posting is blocked');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*className="share-guidance-section"[\s\S]*className="share-form-section"[\s\S]*className="share-submit-section"/, 'share write layout must group guidance, input fields, and final CTA into stable sections');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*const \[policyBlockMessage, setPolicyBlockMessage\][\s\S]*if \(policyViolation\) \{[\s\S]*setPolicyBlockMessage\(policyViolation\);[\s\S]*return;[\s\S]*<ConfirmDialog[\s\S]*title="나눔 제한 품목"[\s\S]*description=\{<span className="share-policy-block-description">\{policyBlockMessage\}<\/span>\}/, 'share write must explain the exact blocked reason in a modal after tapping the CTA');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*나눔 가능 품목 안내[\s\S]*무료 나눔이어도 식품 안전 기준을 지켜야 해요\.[\s\S]*<TextField/, 'share write policy guidance must show the concise safety copy in the guidance section');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*className="share-safety-sheet"[\s\S]*className="share-final-confirm-sheet"/, 'share write safety and final agreement dialogs must use TDS BottomSheet primitives');
assert.doesNotMatch(appSource, /safetyNoticeVisible \? \(\s*<div className="modal-overlay"/, 'share safety agreement must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /finalConfirmVisible \? \(\s*<div className="modal-overlay"/, 'share final confirmation must not use the old custom modal overlay');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*<ListRow[\s\S]*contents=\{<ListRow\.Texts/, 'share write selection sheets must use TDS ListRow semantics');
assert.doesNotMatch(appSource, /<label>분류<select/, 'share write category selection must not use a native select');
assert.match(appSource, /openCamera\(\{\s*base64:\s*true,\s*maxWidth:\s*1280\s*\}\)/, 'share writing and receipt capture must use the Apps in Toss camera bridge');
assert.match(appSource, /foodDropdownVisible/, 'share writing must preserve owned ingredient dropdown modal');
assert.match(appSource, /나눔 가능 품목 안내/, 'share writing must show share policy guidance');
assert.match(appSource, /policyViolation[\s\S]*getSharePolicyViolation/, 'share writing must restrict posting to backend-approved share categories through policy validation');
assert.match(appSource, /imageUri,\s*setImageUri\][\s\S]*post\?\.imageUrl/, 'share edit must preserve the existing post image before resubmission');
assert.match(appSource, /const \[submitting, setSubmitting\]/, 'share writing must guard against duplicate submit taps');
assert.match(appSource, /photo-category-fallback/, 'share writing must show a category visual fallback when no photo is selected');
assert.match(appSource, /getChatMessagesPage\(\{\s*chatRoomId:/, 'chat room must use the legacy paged message endpoint');
assert.match(appSource, /hasOlderMessages/, 'chat room must preserve older-message pagination');
assert.match(appSource, /이전 메시지 더 보기/, 'chat room must expose load-older UI');
assert.match(appSource, /className="list-pagination chat-pagination"/, 'chat list must expose 10-item page navigation controls');
assert.match(appSource, /className="list-pagination market-pagination"/, 'share list must expose 10-item page navigation controls');
assert.match(appSource, /fetchChats\(\{\s*type: active,\s*page: nextPage,\s*size: 10\s*\}\)/, 'chat list pagination must request 10 chats per page');
assert.match(appSource, /confirmVisible/, 'chat room must use a completion confirmation modal instead of prompt-only flow');
assert.match(appSource, /reportVisible/, 'chat room must use a report modal with reasons/content');
assert.match(appSource, /REPORT_REASONS/, 'chat report modal must preserve legacy reason choices');
assert.doesNotMatch(appSource, /window\.confirm/, 'destructive WebView flows must use in-app confirmation dialogs, not browser confirm');
assert.match(appSource, /읽음|전송됨/, 'chat messages must show read state detail');
assert.match(appSource, /refresh\(true\)/, 'chat room polling must refresh silently without resetting the loading state');
assert.match(appSource, /completeSuccessVisible/, 'chat share completion must show a success confirmation before navigating away');
assert.match(appSource, /const shareCompletionPostId = getServerPostId\(post\) \?\? chat\.postId/, 'chat share completion must only use real server post ids before falling back to the chat payload');
assert.match(appSource, /나눔 글 신고/, 'market detail must use an in-app report dialog');
assert.doesNotMatch(appSource, /window\.prompt\('신고 내용을 입력해 주세요\.'/, 'market detail report must not use browser prompt');
assert.match(appSource, /reportSharePost\(/, 'market detail must expose the legacy share report API flow');
assert.match(appSource, /function\s+MarketDetailView[\s\S]*reportSharePost\([\s\S]*<BottomSheet[\s\S]*className="share-report-sheet"[\s\S]*<TextArea[\s\S]*label="상세 내용"/, 'market detail report must use TDS BottomSheet and TextArea primitives');
assert.match(appSource, /function\s+MarketDetailView[\s\S]*right=\{<button className="header-menu-button" type="button" aria-label="나눔글 메뉴"[\s\S]*className="share-action-sheet"[\s\S]*<strong>신고하기<\/strong>/, 'market detail must move share report into a header hamburger action sheet');
assert.doesNotMatch(appSource, /hiddenSharePostsStorageKey|readHiddenSharePostIds|window\.localStorage\.setItem\(hiddenSharePostsStorageKey/, 'market hide-for-me must not use localStorage after backend hidden-share support');
assert.match(apiSource, /export\s+async\s+function\s+hideSharePost\(postId: string\)[\s\S]*\/share\/\$\{encodeURIComponent\(postId\)\}\/hide[\s\S]*method:\s*'POST'/, 'frontend API must call backend hide-share endpoint');
assert.match(appSource, /function\s+MarketDetailView[\s\S]*hideForMe[\s\S]*await hideSharePost\(postId\)[\s\S]*<strong>나에게만 숨기기<\/strong>/, 'market detail action sheet must hide share posts through the backend API');
assert.match(appSource, /className="share-detail-title-block"[\s\S]*className="share-detail-meta-line"[\s\S]*className="share-author-row"/, 'market detail content must separate title, metadata, and author information for better scanability');
assert.match(appSource, /sellerProfileImageUrl/, 'share detail must normalize and render the author profile image');
assert.match(appSource, /authorActionVisible[\s\S]*className="share-author-button"[\s\S]*className="share-author-avatar"[\s\S]*작성 게시글 보기[\s\S]*채팅하기/, 'share detail author row must open profile actions for author posts and chat');
assert.match(appSource, /view: 'authorPosts'; sellerId: string; sellerName: string; sellerProfileImageUrl\?: string/, 'router must support a public author posts view');
assert.match(apiSource, /export\s+async\s+function\s+fetchUserSharePosts\(sellerId: string\)/, 'frontend API must expose public user share posts lookup');
assert.doesNotMatch(appSource, /function\s+MarketDetailView[\s\S]*<div className="list-actions"><button type="button" onClick=\{\(\) => setReportVisible\(true\)\}>신고<\/button><\/div>/, 'market detail must not keep the old inline report pill');
assert.doesNotMatch(appSource, /function\s+MarketDetailView[\s\S]*reportVisible \? \(\s*<div className="modal-overlay"[\s\S]*?<textarea/, 'market detail report must not use the old custom modal textarea');
assert.match(appSource, /const opponentName = detail\?\.sellerName \?\? detail\?\.authorName/, 'share detail chat start must use seller/opponent identity, not the post title');
assert.match(appSource, /startingChat/, 'share detail chat start must guard in-flight duplicate taps');
assert.match(appSource, /completeShareSuccession\(/, 'chat room must expose the legacy share completion API flow');
assert.match(appSource, /opponentId/, 'chat list and room state must carry stable opponent ids for message ownership');
assert.match(appSource, /senderId != null && chat\.opponentId != null \? senderId !== chat\.opponentId/, 'chat message ownership must prefer senderId over nickname comparison');
assert.match(apiSource, /completeShareSuccession\(\{ postId, chatRoomId, type \}/, 'share completion API must require chatRoomId');
assert.doesNotMatch(apiSource, /takerNickName/, 'share completion API must not choose taker by nickname');
assert.match(appSource, /reportChat\(/, 'chat room must expose the legacy chat report API flow');
assert.match(appSource, /blockChat\(/, 'chat room must expose the legacy chat block API flow');
assert.match(appSource, /deleteChatRoom\(/, 'chat room must expose the legacy single-room delete API flow');
assert.match(appSource, /deleteChatRooms\(/, 'chat list must expose the legacy bulk chat delete API flow');
assert.match(appSource, /function\s+ChatScreen[\s\S]*<SegmentedControl[\s\S]*value=\{active\}[\s\S]*<ListRow[\s\S]*contents=\{<ListRow\.Texts/, 'chat list tabs and rows must use TDS SegmentedControl and ListRow primitives');
assert.match(appSource, /function\s+ChatScreen[\s\S]*<ConfirmDialog[\s\S]*title="채팅방 삭제"[\s\S]*deleteSelectedChats/, 'chat list bulk delete must use the TDS ConfirmDialog primitive');
assert.match(appSource, /function\s+ChatRoomView[\s\S]*<ConfirmDialog[\s\S]*title="나눔을 완료할까요\?"[\s\S]*<ConfirmDialog[\s\S]*title="나눔 완료"[\s\S]*<ConfirmDialog[\s\S]*title="채팅방 삭제"[\s\S]*<ConfirmDialog[\s\S]*title="상대방 차단"/, 'chat room destructive and completion dialogs must use TDS ConfirmDialog primitives');
assert.match(appSource, /function\s+ChatRoomView[\s\S]*<BottomSheet[\s\S]*className="chat-report-sheet"[\s\S]*<TextArea[\s\S]*label="상세 내용"[\s\S]*reportRoom/, 'chat report must use TDS BottomSheet and TextArea primitives');
assert.doesNotMatch(appSource, /confirmVisible \? \(\s*<div className="modal-overlay"/, 'chat share completion confirmation must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /deleteConfirmVisible \? \(\s*<div className="modal-overlay"/, 'chat room deletion confirmation must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /blockConfirmVisible \? \(\s*<div className="modal-overlay"/, 'chat block confirmation must not use the old custom modal overlay');
assert.doesNotMatch(appSource, /function\s+ChatRoomView[\s\S]*reportVisible \? \(\s*<div className="modal-overlay"[\s\S]*?<textarea/, 'chat report must not use the old custom modal textarea');
assert.match(appSource, /display_address/, 'market location must read the backend display_address field');
assert.match(appSource, /full_address/, 'market location must read the backend full_address field');
assert.doesNotMatch(appSource, /setItems\(sampleIngredients\)/, 'fridge screen must not hide API failures with sample ingredients');
assert.doesNotMatch(appSource, /setPosts\(sampleShares\)/, 'share screen must not hide API failures with sample posts');
assert.doesNotMatch(appSource, /setChats\(sampleChats\)/, 'chat screen must not hide API failures with sample chats');
assert.doesNotMatch(appSource, /setRecipes\(sampleRecipes\)/, 'recipe screen must not hide API failures with sample recipes');
assert.doesNotMatch(appSource, /샘플/, 'WebView app must not present sample fallback data as if it came from the backend');
assert.doesNotMatch(appSource, /id:\s*['"]sample['"]/, 'WebView app must not render fake sample records after backend failure');
assert.match(appSource, /loginWithLocalBackend/, 'splash fallback must use backend-backed local login instead of unauthenticated browsing');
assert.match(appSource, /setMiniappAccessToken\(token\)/, 'root app must register the service JWT in the API layer after login');
assert.match(appSource, /setMiniappAccessToken\(null\)/, 'account deletion must clear the active backend token');
assert.match(appSource, /onAccountDeleted/, 'account deletion must return the miniapp to the login/root flow');
assert.match(appSource, /function\s+AccountDeleteFlow[\s\S]*<ConfirmDialog[\s\S]*title="회원 탈퇴"[\s\S]*deleteAccount\(\)/, 'account deletion confirmation must use the TDS ConfirmDialog primitive');
assert.doesNotMatch(appSource, /function\s+AccountDeleteFlow[\s\S]*confirming \? \(\s*<div className="modal-overlay"/, 'account deletion must not use the old custom modal overlay');
assert.match(appSource, /fetchAlbumPhotos\(\{\s*base64:\s*true,\s*maxCount:\s*1/, 'Apps-in-Toss album bridge must be used for gallery/profile/share photo selection');
assert.match(appSource, /normalizeImageUri/, 'Apps-in-Toss camera and album base64 results must be normalized before rendering/uploading');
assert.match(apiSource, /data:image\/jpeg;base64/, 'share image upload must normalize raw base64 album results before FormData upload');
assert.match(appSource, /getCurrentLocation\(\{\s*accuracy:\s*Accuracy\.Balanced\s*\}\)/, 'location flows must prefer the Apps-in-Toss geolocation bridge');
assert.match(appSource, /function\s+LocationSettingView[\s\S]*className="region-selector-grid"[\s\S]*className="region-list"/, 'location setting must use the restored inline administrative region selector');
assert.doesNotMatch(appSource, /function\s+LocationSettingView[\s\S]*className="location-region-sheet"[\s\S]*<BottomSheet\.Select/, 'location setting must not use the dropdown bottom sheet selector');
assert.match(appSource, /VITE_KAKAO_MAP_JAVASCRIPT_KEY/, 'share map must support the Kakao map JavaScript key for real WebView map rendering');
assert.match(appSource, /LEGACY_KAKAO_MAP_JAVASCRIPT_KEY/, 'share map must preserve the existing Expo Kakao JavaScript key as the WebView fallback');
assert.match(appSource, /latitude:\s*toNumberOrUndefined\([\s\S]*item\?\.location\?\.latitude[\s\S]*item\?\.shareLocation\?\.latitude[\s\S]*item\?\.coordinate\?\.latitude/, 'share post normalization must preserve map markers when backend returns nested location coordinates');
assert.match(appSource, /SHARE_REPORT_REASONS/, 'share report dialog must use share-specific report reasons');
assert.match(appSource, /chat-post-card/, 'chat room opened from share detail must preserve the share post context card');
assert.match(appSource, /returnTo:\s*'myPosts'/, 'editing from MyPosts must preserve the return route after save');
assert.match(appSource, /openPostEditor[\s\S]*getShareDetail\(postId\)/, 'editing from MyPosts must hydrate the write form from the detail endpoint before edit');
assert.match(appSource, /route\.returnTo === 'myPosts' \? replaceRoute\(\{ view: 'myPosts' \}\) : goBack\(\)/, 'MarketWrite must navigate back to MyPosts when opened from MyPosts');
assert.match(appSource, /clearStoredUserState/, 'account deletion must clear local setup/profile fallback state');
assert.doesNotMatch(appSource, /saveFirstLoginIngredients\([\s\S]*\.catch\(\(\) => undefined\)/, 'setup persistence failures must not be silently ignored');
assert.match(appSource, /setupCompleteStorageKey\s*=\s*'mulmumulmu:setup-complete'/, 'first-entry setup must track completion separately from selected preference values');
assert.match(appSource, /!hadLocalSetup && !hasAnySetupPreference\(snapshot\)[\s\S]*setRoot\('allergy'\)/, 'first miniapp entry with empty preferences must start at allergy setup before the main tabs');
assert.match(appSource, /markStoredSetupCompleted\(\);[\s\S]*setRoot\('main'\)/, 'setup completion must be persisted even when the user chooses no preference items');
assert.match(appSource, /const\s+recipePageSize\s*=\s*10/, 'recipe list must request 10 recipes per page');
assert.match(appSource, /fetchRecipes\(\{[\s\S]*size:\s*recipePageSize/, 'recipe list API calls must use the shared 10-item page size');
assert.match(appSource, /Math\.ceil\(totalCount \/ recipePageSize\)/, 'recipe pagination must derive total pages from backend totalCount');
assert.match(appSource, /\{page \+ 1\} \/ \{totalPages\}/, 'recipe pagination must show current and total pages');
assert.match(appSource, /visibleRecipes\.length > 0 \? \([\s\S]*className="recipe-pagination"/, 'recipe pagination must not render for empty recipe results');
assert.doesNotMatch(appSource, /총 \{totalCount\}개 · \{page \+ 1\}페이지/, 'recipe result header must not show the redundant total count and page label');
assert.match(appSource, /내 식자재로 레시피 추천받기/, 'recipe recommendation CTA must keep the explicit legacy recommendation label');
assert.match(appSource, /보유 재료와 알레르기 설정을 먼저/, 'recipe recommendation CTA must keep the explicit legacy guidance copy');
assert.match(appSource, /반경 \{radius\}km 안의 나눔 \{visiblePosts\.length\}건을 보여줘요\./, 'share map summary must reflect locally hidden share posts');
assert.doesNotMatch(appSource, /구매일자를 기준으로 소비기한을 자동 계산해요/, 'direct input must not show redundant always-on helper copy');
assert.doesNotMatch(appSource, /검색 결과가 애매하면 카테고리별 목록에서 선택하세요/, 'ingredient picker must avoid verbose helper copy');
assert.doesNotMatch(appSource, /나눔 위치 기준/, 'location setting must not include a redundant guide card');
assert.doesNotMatch(appSource, /위치를 저장하면 나눔 탭에서 원하는 반경/, 'location setting must not repeat how radius works in a guide paragraph');
assert.match(appSource, /사진첩 권한이 필요해요|카메라 권한이 필요해요|위치 권한을 허용하면/, 'permission recovery guidance must remain visible when a permission is blocked');
assert.match(appSource, /new Intl\.Collator\('ko-KR'\)[\s\S]*sortRegionsByName[\s\S]*activeSiList[\s\S]*activeGuList[\s\S]*activeDongList/, 'location region selectors must be sorted in Korean alphabetical order');
assert.match(apiSource, /fetchSharePosts\(\{[\s\S]*latitude,[\s\S]*longitude,[\s\S]*params\.set\('latitude', String\(latitude\)\)[\s\S]*params\.set\('longitude', String\(longitude\)\)/, 'share list API must support explicit browse coordinates without changing verified location');
assert.match(appSource, /fetchSharePosts\(\{[\s\S]*latitude:\s*browseLocation\?\.latitude[\s\S]*longitude:\s*browseLocation\?\.longitude[\s\S]*browseLocation=\{browseLocation\}[\s\S]*onBrowseLocationChange=\{setBrowseLocation\}/, 'market screen must query shares around the temporary browse location when selected');
assert.match(appSource, /function\s+LocationSettingView[\s\S]*onBrowse[\s\S]*browseSelectedLocation[\s\S]*onBrowse\(\{[\s\S]*latitude,[\s\S]*longitude/, 'location setting must browse selected neighborhoods without saving them as the verified location');
assert.doesNotMatch(appSource, /function\s+LocationSettingView[\s\S]*const current = await getDeviceLocationForVerification\(\)[\s\S]*verificationLatitude: current\.latitude/, 'manual neighborhood browsing must not require device-location verification');
assert.match(apiSource, /verificationLatitude\?:\s*number[\s\S]*verificationLongitude\?:\s*number[\s\S]*JSON\.stringify\(\{ latitude, longitude, verificationLatitude, verificationLongitude \}\)/, 'share location API must send optional verification coordinates to the backend');
assert.match(appSource, /handleProfilePhotoClick[\s\S]*profileFileInputRef[\s\S]*click\(\)[\s\S]*pickProfilePhoto/, 'profile photo tap must go directly to gallery/file selection without a choice modal');
assert.doesNotMatch(appSource, /<h2>프로필 사진 변경<\/h2>/, 'profile photo flow must not show the old camera/gallery choice modal');
assert.match(apiSource, /export\s+async\s+function\s+getMyProfile\b/, 'my info must load the backend mypage profile');
assert.match(apiSource, /\/auth\/nickName/, 'my info nickname edits must call the backend nickname endpoint');
assert.match(apiSource, /\/auth\/mypage\/picture/, 'my info profile photo edits must call the backend profile picture endpoint');
assert.match(appSource, /닉네임을 입력해 주세요/, 'my info nickname edit must show validation feedback for blank nickname');
assert.match(appSource, /function\s+PreferenceIngredientPicker\b/, 'setup screens must restore the Expo normalized ingredient picker');
assert.match(appSource, /PreferenceIngredientPicker[\s\S]*searchIngredients/, 'setup picker must search standard backend ingredients');
assert.match(appSource, /PreferenceIngredientPicker[\s\S]*getIngredientsByCategory/, 'setup picker must support category-backed standard ingredient selection');
assert.match(appSource, /import\s+\{\s*BottomSheet,\s*Button,\s*ConfirmDialog,\s*ListRow,\s*SegmentedControl,\s*TextArea,\s*TextField,\s*WheelDatePicker\s*\}\s+from\s+['"]@toss\/tds-mobile['"]/, 'setup picker, share write, chat dialogs, date pickers, and chat composer must use TDS Mobile primitives instead of custom analog controls');
assert.match(appSource, /<BottomSheet[\s\S]*className="setup-picker-sheet"[\s\S]*<BottomSheet\.Select[\s\S]*options=\{categorySelectOptions\}[\s\S]*<BottomSheet\.Select[\s\S]*options=\{ingredientSelectOptions\}/, 'setup standard ingredient picker must use BottomSheet.Select for category and ingredient selection');
assert.doesNotMatch(appSource, /dialog setup-picker-dialog/, 'setup standard ingredient picker must not render the old custom dialog layout');
assert.match(appSource, /const\s+setupPrefer\s*=\s*\[[\s\S]*'소고기'[\s\S]*'두부'[\s\S]*'대파'/, 'prefer setup must use legacy ingredient quick choices, not cuisine labels');
assert.doesNotMatch(appSource, /const\s+setupPrefer\s*=\s*\[[\s\S]*'한식'/, 'prefer setup must not save non-ingredient cuisine labels');
assert.match(appSource, /const\s+setupDislikes\s*=\s*\[[\s\S]*'오이'[\s\S]*'고수'[\s\S]*'가지'/, 'first-login dislike setup must use the legacy dislike ingredient choices, not allergy choices');
assert.match(appSource, /const visibleChats = chats;/, 'chat list must trust backend tab filtering and avoid client-side type defaults hiding rows');
assert.match(appSource, /chatRoomId:\s*item\.chatRoomId == null \? undefined : String\(item\.chatRoomId\)/, 'chat normalization must not fabricate missing backend chat room ids');
assert.match(appSource, /disabled=\{chatRoomId == null\}/, 'chat rows without backend room ids must not call chat room APIs');
assert.match(appSource, /채팅 목록을 불러오고 있어요/, 'chat list must expose loading state instead of flashing empty state');
assert.match(appSource, /function\s+ChatRoomView[\s\S]*const \[roomId, setRoomId\] = useState\(chat\.chatRoomId \?\? null\)/, 'chat room must keep a real backend room id in state when it is created from a share post');
assert.match(appSource, /const\s+getStartedChatRoomId[\s\S]*chat\?\.chatRoomId[\s\S]*chat\?\.roomId[\s\S]*chat\?\.chatRoom\?\.chatRoomId[\s\S]*chat\?\.result\?\.chatRoomId[\s\S]*chat\?\.data\?\.chatRoomId/, 'share detail chat start must accept backend chat room id response variants');
assert.match(appSource, /function\s+MarketDetailView[\s\S]*const chatRoomId = getStartedChatRoomId\(chat\)[\s\S]*chatRoomId: String\(chatRoomId\)/, 'share detail must route to chat room with the normalized backend chat room id');
assert.match(appSource, /function\s+ChatRoomView[\s\S]*const postId = getServerPostId\(post\) \?\? chat\.postId[\s\S]*startChat\(postId\)[\s\S]*setRoomId\(resolvedRoomId\)/, 'chat room must restore the legacy post-only startChat flow before loading messages');
assert.match(appSource, /function\s+ChatRoomView[\s\S]*getChatMessagesPage\(\{ chatRoomId: activeRoomId/, 'chat room message loading must use the resolved backend room id, not only the initial route payload');
assert.match(appSource, /const\s+\[marketLocationRevision,\s*setMarketLocationRevision\]\s*=\s*useState\(0\)/, 'app shell must keep a market location refresh revision');
assert.match(appSource, /<MarketScreen goTo=\{goTo\} locationRevision=\{marketLocationRevision\}/, 'market screen must receive the location refresh revision');
assert.match(appSource, /<LocationSettingView onBack=\{goBack\} onSaved=\{\(\) => setMarketLocationRevision\(revision => revision \+ 1\)\}/, 'location setting save must trigger a market location refresh');
assert.match(appSource, /selectedIngredients/, 'recipe recommendation result route must retain selected ingredient context for detail screens');
assert.match(appSource, /requestRecommendations\(\{ ingredients: selectedIngredients, allergies, preferIngredients, dispreferIngredients \}\)/, 'recipe recommendation API must receive saved preference, allergy, and exclusion ingredients');
assert.match(appSource, /추천 레시피를 불러오고 있어요/, 'recipe recommendation result screen must own loading state after navigation');
assert.match(appSource, /내 재료로만/, 'recipe recommendation result must preserve the legacy all/owned/missing tabs');
assert.match(appSource, /추가 필요:/, 'recipe recommendation cards must show missing ingredients');
assert.match(appSource, /const recipeResultPageSize = 10/, 'recipe recommendation results must paginate in 10-item pages');
assert.match(appSource, /const pagedRecipes = filteredRecipes\.slice\(resultPage \* recipeResultPageSize,\s*\(resultPage \+ 1\) \* recipeResultPageSize\)/, 'recipe recommendation result list must render only the current 10-item page');
assert.match(appSource, /className="recipe-result-summary"/, 'recipe recommendation result must replace noisy header copy with a compact recommendation summary');
assert.match(appSource, /className="recipe-pagination recipe-result-pagination"/, 'recipe recommendation result must expose pagination controls');
assert.match(appSource, /className="recipe-card recipe-result-card"/, 'recipe recommendation cards must use the improved result-card layout');
assert.match(styleSource, /\.app-content\.routed/, 'detail routes must remove bottom-tab padding when the tab bar is hidden');
assert.match(apiSource, /searchShareLocations[\s\S]*headers:\s*buildHeaders\(\)/, 'share location search must send auth headers');
assert.match(apiSource, /searchIngredients[\s\S]*headers:\s*buildHeaders\(\)/, 'ingredient search must send auth headers');
assert.match(apiSource, /getIngredientsByCategory[\s\S]*headers:\s*buildHeaders\(\)/, 'ingredient category search must send auth headers');
assert.match(apiSource, /getRecipeDetail[\s\S]*headers:\s*buildHeaders\(\)/, 'recipe detail must send auth headers');
assert.match(styleSource, /\.detail-screen/, 'detail screen styles must exist');
assert.match(styleSource, /\.form-screen/, 'form screen styles must exist');
assert.match(styleSource, /\.market-write-button\s*\{[\s\S]*position:\s*fixed/, 'share write button must be fixed above the tab bar');
assert.match(styleSource, /\.market-map-card/, 'share screen must keep the original map card structure');
assert.match(styleSource, /\.radius-modal/, 'radius bottom sheet styles must exist');
assert.match(styleSource, /\.location-selector-fields/, 'administrative region selector styles must exist');
assert.match(styleSource, /--location-section-gap:\s*10px/, 'location setting screen must expose a compact section spacing token');
assert.match(styleSource, /--location-field-gap:\s*8px/, 'location selector fields must expose a compact field spacing token');
assert.match(styleSource, /\.location-screen\s*\{[\s\S]*display:\s*grid[\s\S]*gap:\s*var\(--location-section-gap\)/, 'location setting screen must use the compact location spacing token');
assert.match(styleSource, /\.region-selector-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*gap:\s*var\(--location-field-gap\)/, 'location selector must restore the compact two-column inline region grid');
assert.match(styleSource, /\.region-list\s*\{[\s\S]*height:\s*164px[\s\S]*overflow-y:\s*auto/, 'location region lists must use fixed-height inline scroll panes');
assert.match(styleSource, /\.region-list button,[\s\S]*\.dong-choice,[\s\S]*\.location-action-button\s*\{[\s\S]*min-height:\s*44px[\s\S]*overflow:\s*hidden/, 'location choices and actions must have fixed touch height and hidden overflow');
assert.match(styleSource, /\.region-list button \*,[\s\S]*\.dong-choice \*,[\s\S]*\.location-action-button \*\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'location selector text must stay single-line with ellipsis');
assert.match(styleSource, /button,[\s\S]*input,[\s\S]*select,[\s\S]*textarea\s*\{[\s\S]*font-family:\s*inherit/, 'native and TDS-hosted form controls must inherit the app font');
assert.match(styleSource, /:where\(\.direct-standard-sheet,[\s\S]*\.setup-picker-sheet[\s\S]*\)\s*\{[\s\S]*font-family:\s*Pretendard/, 'TDS picker sheets must use the shared app font family');
assert.match(styleSource, /:where\(\.direct-standard-sheet,[\s\S]*\.setup-picker-sheet[\s\S]*\) \[role="radio"\]\s*\{[\s\S]*height:\s*44px[\s\S]*font-size:\s*13px/, 'TDS picker option rows must use compact fixed-height typography');
assert.match(styleSource, /:where\(\.direct-standard-sheet,[\s\S]*\.setup-picker-sheet[\s\S]*\) \[role="radio"\] \*\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'TDS picker option text must stay single-line with ellipsis');
assert.match(styleSource, /:where\(\.direct-standard-sheet,[\s\S]*\.setup-picker-sheet[\s\S]*\)\s*\{[\s\S]*max-height:\s*min\(460px,\s*64dvh\)/, 'TDS picker sheets must not expand to nearly full-screen height');
assert.match(styleSource, /\.direct-input-card\s*\{[\s\S]*gap:\s*var\(--grid-gap\)[\s\S]*padding:\s*var\(--card-padding\)/, 'direct input card must use shared spacing tokens');
assert.match(styleSource, /\.direct-input-card \.form-grid-two\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'direct input date/category controls must use a two-column grid');
assert.match(styleSource, /--direct-field-inset:\s*18px/, 'direct input form controls must share an inner inset matching the visible TDS ingredient field');
assert.match(styleSource, /--direct-full-field-inset:\s*36px/, 'direct input full-width boxes must use a deeper inset matching the visible TDS ingredient input border');
assert.match(styleSource, /\.direct-input-card > :where\(\.form-grid-two,[\s\S]*\.date-picker-field,[\s\S]*\.category-picker-button,[\s\S]*\.list-actions\)\s*\{[\s\S]*width:\s*calc\(100% - \(var\(--direct-field-inset\) \* 2\)\)[\s\S]*justify-self:\s*center/, 'direct input control boxes must align to the ingredient field border width');
assert.match(styleSource, /\.direct-input-card > :where\(\.date-picker-field,[\s\S]*\.category-picker-button\)\s*\{[\s\S]*width:\s*calc\(100% - \(var\(--direct-full-field-inset\) \* 2\)\)/, 'direct input full-width boxes must align to the ingredient field border width');
assert.match(styleSource, /\.date-picker-field\s*\{[\s\S]*grid-template-rows:\s*auto 56px/, 'direct input date picker field must reserve a fixed trigger row');
assert.match(styleSource, /\.direct-input-card \.form-grid-two > \*,[\s\S]*\.date-picker-field > :not\(span\) > \*,[\s\S]*\.date-picker-field > :not\(span\) > \* > \*\s*\{[\s\S]*width:\s*100%[\s\S]*min-width:\s*0[\s\S]*height:\s*100%/, 'TDS picker wrappers inside direct input must stretch to the full field width and height');
assert.match(styleSource, /\.date-picker-field > :not\(span\) > \*,\s*\n\.date-picker-field > :not\(span\) > \* > \*\s*\{[\s\S]*display:\s*flex[\s\S]*align-items:\s*center[\s\S]*justify-content:\s*center[\s\S]*margin:\s*0 !important[\s\S]*padding:\s*0 !important/, 'TDS date picker wrappers must center the actual button inside the visible field div');
assert.match(styleSource, /\.date-picker-field button,[\s\S]*\.form-grid-two button\s*\{[\s\S]*height:\s*56px[\s\S]*overflow:\s*hidden/, 'direct input picker triggers must use fixed compact heights');
assert.match(styleSource, /\.date-picker-field > :not\(span\)\s*\{[\s\S]*border:\s*1px solid var\(--color-border\)[\s\S]*border-radius:\s*14px[\s\S]*background:\s*#ffffff/, 'direct input expiry date picker host must visually match boxed TDS form fields');
assert.match(styleSource, /\.date-picker-field button\s*\{[\s\S]*display:\s*flex[\s\S]*align-items:\s*center[\s\S]*padding:\s*0 16px/, 'direct input expiry date picker trigger content must be aligned inside the fixed field');
assert.match(styleSource, /\.direct-input-card \.form-grid-two > :first-child button > \*\s*\{[\s\S]*padding-inline:\s*8px !important/, 'direct input purchase date inner content must keep enough room for yyyy-MM-dd without affecting category');
assert.match(styleSource, /\.date-picker-field button\s*\{[\s\S]*position:\s*absolute !important[\s\S]*inset:\s*0 !important[\s\S]*height:\s*100% !important/, 'direct input expiry date picker button must share the exact host field bounds instead of sitting low inside the TDS wrapper');
assert.match(styleSource, /\.direct-input-card \.form-grid-two button \*\s*\{[\s\S]*font-size:\s*16px[\s\S]*font-weight:\s*800/, 'direct input category text must keep its original font size and weight');
assert.match(styleSource, /\.direct-input-card \.form-grid-two > :first-child button,[\s\S]*\.direct-input-card \.form-grid-two > :first-child button \*\s*\{[\s\S]*font-size:\s*13px[\s\S]*font-weight:\s*800/, 'direct input purchase date text must use a date-only compact style without affecting category');
assert.match(styleSource, /\.direct-input-card \.date-picker-field button,[\s\S]*\.direct-input-card \.date-picker-field button \*\s*\{[\s\S]*font-size:\s*14px[\s\S]*font-weight:\s*800/, 'direct input expiry date text must match the purchase date picker font size and weight');
assert.match(styleSource, /\.direct-input-card \.date-picker-field button > \*\s*\{[\s\S]*padding-left:\s*14px !important[\s\S]*padding-right:\s*12px !important/, 'direct input expiry date inner content must align with the purchase date text start');
assert.match(styleSource, /\.date-picker-field\.is-empty > :not\(span\)::before\s*\{[\s\S]*content:\s*'연도-월-일'[\s\S]*top:\s*50%[\s\S]*line-height:\s*1/, 'empty expiry date pickers must render a vertically centered placeholder on the fixed field host');
assert.match(styleSource, /\.date-picker-field\.is-empty button::before\s*\{[\s\S]*content:\s*none/, 'empty expiry date picker buttons must not render a second shifted placeholder');
assert.match(appSource, /function\s+ReceiptGalleryView[\s\S]*useState\(showLocalFilePicker \? '' : '갤러리 불러오는 중\.\.\.'\)[\s\S]*if \(!showLocalFilePicker\) \{[\s\S]*void openNativeAlbum\(\);[\s\S]*\}/, 'receipt gallery must not show native bridge loading/error copy in local browser preview');
assert.match(appSource, /function\s+ReceiptGalleryView[\s\S]*!showLocalFilePicker \? \([\s\S]*앱 사진첩 다시 열기[\s\S]*사진첩 권한 요청하기[\s\S]*\) : null/, 'receipt gallery native album controls must be hidden in local browser preview');
assert.match(styleSource, /--list-card-height/, 'repeated list cards must share a fixed height token');
assert.match(styleSource, /--market-card-height/, 'share list cards must share a fixed height token');
assert.match(styleSource, /--banner-height/, 'banner surfaces must share a fixed height token');
assert.match(styleSource, /--recipe-card-height/, 'recipe cards must share a fixed height token');
assert.match(styleSource, /\.ingredient-row,[\s\S]*\.chat-row\s*\{[\s\S]*height:\s*var\(--list-card-height\)/, 'ingredient/share/recipe/chat cards must use the shared fixed-height card token');
assert.match(styleSource, /\.recipe-card\s*\{[\s\S]*height:\s*var\(--recipe-card-height\)/, 'recipe cards must override to a fixed recipe-specific height');
assert.match(styleSource, /\.recipe-card > div\s*\{[\s\S]*gap:\s*6px[\s\S]*overflow:\s*hidden/, 'recipe card text stack must separate title and ingredients with a fixed internal gap');
assert.match(styleSource, /\.recipe-card strong\s*\{[\s\S]*font-size:\s*16px[\s\S]*font-weight:\s*900/, 'recipe card title must be visually stronger than ingredient text');
assert.match(styleSource, /\.recipe-card small\s*\{[\s\S]*color:\s*var\(--color-text-muted\)[\s\S]*font-size:\s*12px/, 'recipe card ingredient text must be smaller and muted');
assert.match(styleSource, /\.recipe-result-summary\s*\{[\s\S]*background:\s*#ffffff[\s\S]*box-shadow:\s*var\(--shadow-card\)/, 'recipe result summary must be a clear compact information block');
assert.match(styleSource, /\.recipe-result-card\s*\{[\s\S]*height:\s*116px[\s\S]*align-items:\s*flex-start/, 'recipe result cards must have enough height for match and missing ingredient details');
assert.match(styleSource, /\.recipe-match-summary\s*\{[\s\S]*display:\s*flex[\s\S]*gap:\s*6px/, 'recipe result cards must show match/missing counts as compact badges');
assert.match(styleSource, /\.recipe-result-card \.missing-text\s*\{[\s\S]*color:\s*#f97316/, 'recipe result cards must visually distinguish missing ingredients');
assert.match(styleSource, /\.market-post-card\s*\{[\s\S]*height:\s*var\(--market-card-height\)/, 'market post cards must use a fixed height');
assert.match(styleSource, /\.recommend-banner\s*\{[\s\S]*width:\s*calc\(100% - 32px\)/, 'recommend banner must use the same full-width card layout as the category surfaces');
assert.match(styleSource, /\.recommend-banner\s*small\s*\{[\s\S]*font-size:\s*12px[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'recommend banner copy must stay single-line with ellipsis');
assert.match(styleSource, /\.empty-text\s*\{[\s\S]*color:\s*var\(--color-text-subtle\)[\s\S]*font-size:\s*14px[\s\S]*font-weight:\s*700/, 'empty states must use the shared app text tone');
assert.match(styleSource, /\.fridge-sort-trigger\s*\{[\s\S]*height:\s*44px[\s\S]*overflow:\s*hidden/, 'fridge sort trigger must stay compact inside the toolbar');
assert.match(styleSource, /\.fridge-sort-trigger span\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'fridge sort trigger text must stay single-line with ellipsis');
assert.match(styleSource, /\.horizontal-chips button,[\s\S]*\.choice-chip,[\s\S]*\.segmented button\s*\{[\s\S]*height:\s*38px[\s\S]*overflow:\s*hidden/, 'chip controls must use fixed heights and no text wrapping');
assert.match(styleSource, /\.chat-filter-tabs\s*\{[\s\S]*margin-top:\s*12px/, 'chat segmented filter must sit lower than the chat title');
assert.match(styleSource, /\.horizontal-chips\s*\{[\s\S]*overflow-x:\s*scroll[\s\S]*scrollbar-gutter:\s*stable[\s\S]*background:[\s\S]*linear-gradient/, 'fridge category chips must keep an always-visible horizontal scroll affordance');
assert.match(styleSource, /\.horizontal-chips::-webkit-scrollbar\s*\{[\s\S]*display:\s*block[\s\S]*height:\s*6px/, 'fridge category chips must expose a visible WebKit horizontal scrollbar');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*<section className="screen form-screen market-write-screen">/, 'share write form must have a scoped layout class');
assert.match(styleSource, /--market-photo-height/, 'share write photo picker must have a fixed height token');
assert.match(styleSource, /--market-policy-height/, 'share write policy banner must have a fixed height token');
assert.match(styleSource, /--market-form-gap:\s*10px/, 'share write form must expose a compact vertical spacing token for form fields');
assert.match(styleSource, /\.market-write-screen\s*\{[\s\S]*gap:\s*var\(--market-form-gap\)[\s\S]*font-family:\s*Pretendard/, 'share write form must use shared grid and font tokens');
assert.match(styleSource, /--market-field-width:\s*calc\(100% - 40px\)/, 'share write form must define one field-width token for labels, fields, helper text, and CTA');
assert.match(styleSource, /\.market-write-screen :where\(\.share-guidance-section, \.share-form-section, \.share-submit-section\)\s*\{[\s\S]*display:\s*grid[\s\S]*justify-items:\s*center/, 'share write sections must enforce centered single-column rhythm');
assert.match(styleSource, /\.market-write-screen :where\(\.share-form-section > \*, \.share-submit-section > \*, \.photo-box, \.policy-box\)\s*\{[\s\S]*width:\s*var\(--market-field-width\)/, 'share write sections must align every label, field, helper, and CTA to the same width');
assert.match(styleSource, /\.market-write-screen \.share-form-section :where\(\[class\*="css-"\]\)\s*\{[\s\S]*width:\s*100%/, 'share write TDS form-control wrappers must use the same visible field width');
assert.match(styleSource, /\.market-write-screen \.share-two-column-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/, 'share write ingredient and category controls must stay in a stable two-column row');
assert.match(styleSource, /\.market-write-screen \.share-form-section\s*\{[\s\S]*gap:\s*8px/, 'share write form controls must use a tighter shared spacing scale');
assert.match(styleSource, /\.market-write-screen \.date-picker-field\s*\{[\s\S]*width:\s*100%/, 'share write date picker must not shrink inside the shared field-width container');
assert.match(styleSource, /\.market-write-screen \.read-only-form-section\s*\{[\s\S]*width:\s*100%/, 'share write read-only category must not shrink inside the shared field-width container');
assert.match(styleSource, /\.market-write-screen \.share-form-section input,[\s\S]*\.market-write-screen \.share-form-section textarea\s*\{[\s\S]*background:\s*#ffffff !important/, 'share write title and description inputs must keep the white input surface');
assert.match(styleSource, /\.market-write-screen \.photo-box\s*\{[\s\S]*height:\s*var\(--market-photo-height\)[\s\S]*overflow:\s*hidden/, 'share write photo picker must keep a fixed height');
assert.match(styleSource, /\.market-write-screen \.policy-box\s*\{[\s\S]*min-height:\s*var\(--market-policy-height\)[\s\S]*overflow:\s*visible/, 'share write policy banner must show the complete safety copy without clipping');
assert.match(styleSource, /\.market-write-screen \.policy-box p,[\s\S]*\.market-write-screen \.policy-box em\s*\{[\s\S]*white-space:\s*normal/, 'share write policy text must wrap instead of being truncated');
assert.doesNotMatch(appSource, /function\s+MarketWriteView[\s\S]*<section className="owned-ingredient-panel">/, 'share write must not duplicate the ingredient selector with a second owned-ingredient panel');
assert.match(styleSource, /\.market-write-screen textarea\s*\{[\s\S]*height:\s*96px[\s\S]*resize:\s*none/, 'share write description textarea must use a fixed height');
assert.match(appSource, /function\s+MarketWriteView[\s\S]*className=\{`date-picker-field \$\{expirationDate \? 'has-value' : 'is-empty'\}`\}/, 'share write date picker field must expose empty/value state for stable styling');
assert.match(styleSource, /\.market-write-screen \.date-picker-field\s*\{[\s\S]*width:\s*100%[\s\S]*justify-self:\s*center[\s\S]*gap:\s*8px/, 'share write date picker field must align to the same left edge as TDS form fields');
assert.match(styleSource, /\.market-write-screen \.date-picker-field button:empty::before\s*\{[\s\S]*content:\s*none/, 'share write empty date picker must not render a TDS button placeholder copy');
assert.match(styleSource, /\.market-write-screen \.date-picker-field\.is-empty button::before\s*\{[\s\S]*content:\s*none/, 'share write empty date picker must not render a second shifted placeholder inside the TDS trigger');
assert.match(styleSource, /\.direct-input-screen \.inline-message\s*\{[\s\S]*background:\s*transparent[\s\S]*font-size:\s*12px/, 'receipt raw name must be demoted to supporting text instead of a repeated message box');
assert.match(styleSource, /\.direct-input-card \.suggestion-list\s*\{[\s\S]*margin:\s*-12px auto 0[\s\S]*border-top:\s*0[\s\S]*border-radius:\s*0 0 14px 14px/, 'receipt standard ingredient candidates must sit directly under the ingredient field as an attached dropdown');
assert.match(styleSource, /\.direct-input-card \.suggestion-list\s*\{[\s\S]*background:\s*#eef7ff/, 'receipt standard ingredient candidates must use the original light blue candidate background');
assert.match(styleSource, /\.direct-input-card \.suggestion-list button\s*\{[\s\S]*color:\s*#1c64f2/, 'receipt standard ingredient candidates must use blue candidate text');
assert.match(styleSource, /\.direct-input-card\s*\{[\s\S]*gap:\s*12px[\s\S]*box-shadow:\s*none/, 'direct input form card must use a compact single-column rhythm without heavy nested boxes');
assert.match(styleSource, /\.direct-input-card \.list-actions\s*\{[\s\S]*justify-content:\s*flex-start[\s\S]*\.direct-input-card \.list-actions button\s*\{[\s\S]*background:\s*#f2f4f6/, 'direct input secondary actions must be visually weaker than the primary completion CTA');
assert.match(styleSource, /\.ad-slot\s*\{[\s\S]*height:\s*var\(--ad-card-height\)[\s\S]*overflow:\s*hidden/, 'ad surfaces must use a fixed height instead of dynamic min-height');
assert.match(styleSource, /\.empty-state p\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'empty-state helper copy must stay single-line with ellipsis');
assert.match(styleSource, /\.recipe-browse-header\s*\{[\s\S]*display:\s*flex[\s\S]*height:\s*52px/, 'recipe browse results must use a compact fixed-height header layout');
assert.match(styleSource, /\.recipe-browse-header h2\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'recipe browse title must stay single-line with ellipsis');
assert.match(styleSource, /\.menu-card button > span\s*\{[\s\S]*display:\s*grid[\s\S]*gap:\s*4px/, 'menu card title and description must stack on separate lines');
assert.match(styleSource, /\.share-card p,[\s\S]*\.chat-row p\s*\{[\s\S]*text-overflow:\s*ellipsis[\s\S]*white-space:\s*nowrap/, 'repeated card descriptions must stay single-line with ellipsis');
assert.match(styleSource, /\.recipe-category-grid\s*\{[\s\S]*gap:\s*var\(--grid-gap\)[\s\S]*padding:\s*0 var\(--space-page-x\)/, 'recipe category grid must use shared grid gap and padding tokens');
assert.match(graniteSource, /webViewProps/, 'Apps in Toss WebView props must be configured explicitly');
assert.match(graniteSource, /navigationBar:\s*\{[\s\S]*withBackButton:\s*true[\s\S]*withHomeButton:\s*true/, 'Apps in Toss navigation bar must expose native back and home affordances');
assert.match(graniteSource, /type:\s*'partner'/, 'non-game Apps in Toss WebView must use the partner navigation type');
assert.match(graniteSource, /bounces:\s*false/, 'WebView must disable iOS bounce for app-like navigation');
assert.match(graniteSource, /overScrollMode:\s*'never'/, 'WebView must disable Android overscroll for app-like navigation');
assert.match(graniteSource, /pullToRefreshEnabled:\s*false/, 'WebView pull-to-refresh must not interrupt nested app screens');
assert.match(appSource, /import\s+\{[^}]*graniteEvent[^}]*\}\s+from\s+['"]@apps-in-toss\/web-framework['"]/, 'WebView app must import Apps-in-Toss graniteEvent for native navigation bar events');
assert.match(appSource, /graniteEvent\.addEventListener\('backEvent'[\s\S]*onEvent:\s*\(\) => \{\s*goBack\(\);?\s*\}/, 'native Apps-in-Toss back button must drive the local WebView route stack');
assert.match(appSource, /graniteEvent\.addEventListener\('homeEvent'[\s\S]*onEvent:\s*\(\) => \{\s*goBackToTabs\(\);?\s*\}/, 'native Apps-in-Toss home button must return the local WebView app to tabs');
assert.doesNotMatch(appSource, /className="back-icon"|[‹←]/, 'routed screens must not render a duplicate arrow-shaped in-app back button when native Toss back is enabled');
assert.match(appSource, /className="text-back-button"[\s\S]*>이전<\/button>/, 'routed detail screens may use a text-only previous button for local route navigation');
assert.match(styleSource, /\.bottom-tab\s*\{[\s\S]*bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom, 0px\)\)[\s\S]*width:\s*min\(calc\(100% - 32px\), 448px\)[\s\S]*border-radius:\s*20px[\s\S]*box-shadow:\s*0 2px 16px/, 'bottom tab must use the Apps-in-Toss floating pill shape');
assert.match(styleSource, /color-scheme:\s*light/, 'root styles must opt into a light color scheme');
assert.match(appSource, /theme:\s*'light'/, 'Toss ad slot must request a light theme');
assert.match(appSource, /function\s+TossAdSlot\b/, 'WebView app must provide a shared Toss ad slot component');
assert.match(appSource, /TossAds[\s\S]*attachBanner/, 'Toss ad slot must attach the Apps-in-Toss banner ad SDK instead of rendering only a placeholder');
assert.match(appSource, /<TextArea[\s\S]*variant="box"[\s\S]*aria-label="채팅 메시지"/, 'chat composer must use the TDS TextArea primitive with accessible labeling');
assert.match(appSource, /className=\{`ad-slot/, 'WebView app must render the Expo-style ad slot surface');
assert.match(appSource, /등록된 재료가 없어요/, 'fridge empty state must match the legacy Expo screen');
assert.match(appSource, /'추가' 버튼을 눌러/, 'fridge empty state must tell users to add ingredients');
assert.match(appSource, /채팅이 아직 존재하지 않아요\./, 'chat empty state must use the requested copy');
assert.match(appSource, /const\s+recommendTabs\s*=\s*\['전체',\s*'임박한 재료'\]/, 'recipe recommendation must preserve the legacy ingredient filter tabs');
assert.match(appSource, /선택한 재료로 레시피 추천받기/, 'recipe recommendation CTA must match the legacy Expo flow');
assert.match(styleSource, /\.ad-slot/, 'ad slot styles must exist for WebView tab screens');
assert.match(styleSource, /\.chat-compose textarea/, 'chat compose textarea must be styled for the WebView input bar');
assert.match(styleSource, /\.chat-post-thumb/, 'chat room post context card must include a visual thumbnail area');
assert.match(styleSource, /\.photo-category-fallback/, 'share write photo fallback must be styled');
assert.match(styleSource, /\.recipe-category-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*1fr\)/, 'recipe home category grid must use the legacy two-column layout');
assert.ok(fs.existsSync(administrativeRegionsPath), 'administrative region dataset must be available in the WebView app');

console.log('full WebView port tests passed');
