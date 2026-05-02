import { Platform } from 'react-native';
import { apiRequest } from './request';

const unwrap = (response, fallback = null) => {
  if (response?.success === false) {
    throw new Error(response.result || response.code || '나눔 API 요청에 실패했어요.');
  }
  return response?.result ?? response?.data ?? fallback;
};

const appendImage = async (formData, imageUri) => {
  if (!imageUri) return;

  if (Platform.OS === 'web' && typeof imageUri === 'string') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, 'share.jpg');
    return;
  }

  formData.append('image', {
    uri: imageUri,
    name: 'share.jpg',
    type: 'image/jpeg',
  });
};

export const updateShareLocation = async ({ latitude, longitude }) => {
  const response = await apiRequest('/share/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
  return unwrap(response);
};

export const getMyShareLocation = async () => {
  const response = await apiRequest('/share/location/me', {
    method: 'GET',
  });
  return unwrap(response);
};

export const searchShareLocations = async (query) => {
  const response = await apiRequest(`/share/location/search?query=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
  return unwrap(response, []);
};

export const getShareList = async ({ radiusKm = 10, page = 0, size = 10 } = {}) => {
  const query = new URLSearchParams({
    radiusKm: String(radiusKm),
    page: String(page),
    size: String(size),
  });
  const response = await apiRequest(`/share/list?${query.toString()}`, { method: 'GET' });
  return unwrap(response, { items: [], totalCount: 0 });
};

export const getShareDetail = async (postId) => {
  const response = await apiRequest(`/share/list/one?postId=${encodeURIComponent(postId)}`, {
    method: 'GET',
  });
  return unwrap(response);
};

export const createSharePost = async ({
  title,
  ingredientName,
  content,
  category,
  expirationDate,
  imageUri,
}) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('ingredientName', ingredientName);
  formData.append('content', content);
  formData.append('category', category);
  formData.append('expirationDate', expirationDate);
  await appendImage(formData, imageUri);

  const response = await apiRequest('/share/posting', {
    method: 'POST',
    body: formData,
  });
  return unwrap(response);
};

export const getMyShareList = async (type = '나눔 중') => {
  const response = await apiRequest(`/share/list/my?type=${encodeURIComponent(type)}`, {
    method: 'GET',
  });
  return unwrap(response, []);
};

export const updateSharePost = async ({
  postId,
  title,
  ingredientName,
  content,
  category,
  expirationDate,
  imageUri,
}) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('ingredientName', ingredientName);
  formData.append('content', content);
  formData.append('category', category);
  formData.append('expirationDate', expirationDate);
  await appendImage(formData, imageUri);

  const response = await apiRequest(`/share/list/my?postId=${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: formData,
  });
  return unwrap(response);
};

export const deleteMySharePost = async (postId) => {
  const response = await apiRequest(`/share/list/my?postId=${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
  return unwrap(response);
};

export const completeShareSuccession = async ({ postId, takerNickName, type }) => {
  const response = await apiRequest('/share/posting/succession', {
    method: 'POST',
    body: JSON.stringify({ postId, takerNickName, type }),
  });
  return unwrap(response);
};

export const reportSharePost = async ({ postId, title, content }) => {
  const response = await apiRequest(`/share/report?postId=${encodeURIComponent(postId)}`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
  return unwrap(response);
};
