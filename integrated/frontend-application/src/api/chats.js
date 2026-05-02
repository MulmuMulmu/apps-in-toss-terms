import { apiRequest } from './request';

const unwrap = (response, fallback = null) => {
  if (response?.success === false) {
    throw new Error(response.result || response.code || '채팅 API 요청에 실패했어요.');
  }
  return response?.result ?? response?.data ?? fallback;
};

export const getChatList = async (type = 'all') => {
  const response = await apiRequest(`/chat/list?type=${encodeURIComponent(type)}`, {
    method: 'GET',
  });
  return unwrap(response, []);
};

export const getChatListPage = async ({ type = 'all', page = 0, size = 20 } = {}) => {
  const response = await apiRequest(`/chat/list/page?type=${encodeURIComponent(type)}&page=${page}&size=${size}`, {
    method: 'GET',
  });
  return unwrap(response, { items: [], totalCount: 0, page, size, hasNext: false });
};

export const startChat = async (postId) => {
  const response = await apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ postId }),
  });
  return unwrap(response);
};

export const getChatMessages = async (chatRoomId) => {
  const response = await apiRequest(`/chat/reception?chatRoomId=${encodeURIComponent(chatRoomId)}`, {
    method: 'GET',
  });
  return unwrap(response, []);
};

export const getChatMessagesPage = async ({ chatRoomId, page = 0, size = 30 } = {}) => {
  const response = await apiRequest(`/chat/reception/page?chatRoomId=${encodeURIComponent(chatRoomId)}&page=${page}&size=${size}`, {
    method: 'GET',
  });
  return unwrap(response, { items: [], totalCount: 0, page, size, hasNext: false });
};

export const sendChatMessage = async ({ chatRoomId, content }) => {
  const response = await apiRequest('/chat/sending', {
    method: 'POST',
    body: JSON.stringify({ chatRoomId, content }),
  });
  return unwrap(response);
};

export const markChatAsRead = async (chatRoomId) => {
  const response = await apiRequest('/chat/read', {
    method: 'PATCH',
    body: JSON.stringify({ chatRoomId }),
  });
  return unwrap(response);
};

export const reportChat = async ({ chatRoomId, messageId, reason, content }) => {
  const response = await apiRequest('/chat/report', {
    method: 'POST',
    body: JSON.stringify({ chatRoomId, messageId, reason, content }),
  });
  return unwrap(response);
};

export const blockChat = async (chatRoomId) => {
  const response = await apiRequest('/chat/block', {
    method: 'POST',
    body: JSON.stringify({ chatRoomId }),
  });
  return unwrap(response);
};

export const deleteChatRoom = async (chatRoomId) => {
  const response = await apiRequest(`/chat/rooms/${encodeURIComponent(chatRoomId)}`, {
    method: 'DELETE',
  });
  return unwrap(response);
};

export const deleteChatRooms = async (chatRoomIds) => {
  const response = await apiRequest('/chat/rooms', {
    method: 'DELETE',
    body: JSON.stringify({ chatRoomIds }),
  });
  return unwrap(response);
};
