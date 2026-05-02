import client from './client';

const formatDateTime = (value) => {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
};

const formatDate = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const toReceiptListItem = (item) => ({
  id: item.ocrId,
  userId: item.userId || '',
  tossUserKey: item.tossUserKey || '',
  loginProvider: item.loginProvider || '',
  nickname: item.nickName || '',
  uploadedAt: formatDateTime(item.createTime),
  purchasedAt: formatDate(item.purchaseTime),
  accuracy: Number(item.accuracy ?? 0),
});

const toOcrResult = (ocrId, detail, ingredients) => ({
  receiptId: ocrId,
  imageUrl: detail.receiptImage || '',
  storeName: '-',
  purchasedAt: formatDate(detail.purchaseTime),
  uploadedAt: formatDateTime(detail.createTime),
  uploadedByUserId: detail.userId || '',
  uploadedByTossUserKey: detail.tossUserKey || '',
  uploadedByLoginProvider: detail.loginProvider || '',
  uploadedBy: detail.nickName || '',
  accuracy: Number(detail.accuracy ?? 0),
  totalAmount: 0,
  items: ingredients.map((item, index) => ({
    id: item.ocrIngredientId || `${ocrId}-${index}`,
    ocrIngredientId: item.ocrIngredientId,
    name: item.itemName || '',
    originalName: item.originalItemName || item.itemName || '',
    normalizedName: item.normalizedItemName || item.itemName || '',
    category: item.category || '기타',
    quantity: Number(item.quantity ?? 0),
  })),
});

export const getOcrList = async () => {
  try {
    const response = await client.get('/admin/ocr/list');
    if (!response.data?.success) return response.data;

    return {
      ...response.data,
      result: {
        receipts: (response.data.result || []).map(toReceiptListItem),
      },
    };
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: 'OCR 검수 목록을 불러올 수 없습니다.',
    };
  }
};

export const getOcrResult = async (ocrId) => {
  try {
    const [detailResponse, ingredientsResponse] = await Promise.all([
      client.get('/admin/ocr/one', { params: { ocrId } }),
      client.get('/admin/ocr/one/ingredients', { params: { ocrId } }),
    ]);

    if (!detailResponse.data?.success) return detailResponse.data;
    if (!ingredientsResponse.data?.success) return ingredientsResponse.data;

    return {
      success: true,
      result: toOcrResult(
        ocrId,
        detailResponse.data.result || {},
        ingredientsResponse.data.result || [],
      ),
    };
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: 'OCR 검수 상세 정보를 불러올 수 없습니다.',
    };
  }
};

export const updateOcrResult = async (ocrId, data) => {
  try {
    const response = await client.patch('/admin/ocr/ingredients', {
      ocrId,
      accuracy: Number(data.accuracy ?? 0),
      items: (data.items || []).map((item) => ({
        ocrIngredientId: item.ocrIngredientId || item.id,
        itemName: item.normalizedName || item.name,
        quantity: Number(item.quantity ?? 0),
      })),
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: 'OCR 정확도를 저장할 수 없습니다.',
    };
  }
};
