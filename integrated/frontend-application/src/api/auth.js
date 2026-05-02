import { getToken } from './token';
import { buildUrl } from './config';

export const checkId = async (id) => {
  const response = await fetch(buildUrl(`/auth/signup/idCheck?id=${id}`), {
    method: 'GET',
  });
  return await response.json();
};

export const signup = async ({ name, id, password, check_password }) => {
  const response = await fetch(buildUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, id, password, check_password }),
  });
  return await response.json();
};

export const login = async ({ id, password }) => {
  const response = await fetch(buildUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  return await response.json();
};

export const normalizeTossLoginExchangeResponse = (data) => {
  const result = data?.result ?? data?.data?.success ?? data?.data ?? data?.success ?? {};
  const jwt =
    result.jwt ??
    result.accessToken ??
    data?.jwt ??
    data?.accessToken ??
    null;

  if (!jwt) {
    throw new Error('토스 로그인 토큰을 받지 못했어요.');
  }

  return {
    jwt,
    refreshToken: result.refreshToken ?? data?.refreshToken ?? null,
    firstLogin: result.firstLogin ?? result.fisrtLogin ?? false,
    raw: data,
  };
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  return text.length > 0 ? JSON.parse(text) : {};
};

export const exchangeTossLogin = async ({ authorizationCode, referrer }) => {
  const response = await fetch(buildUrl('/auth/toss/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.result || '토스 로그인을 완료하지 못했어요.');
  }

  return normalizeTossLoginExchangeResponse(data);
};

export const logout = async () => {
  const response = await fetch(buildUrl('/auth/logout'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getToken(),
    },
  });
  return await response.json();
};

export const deleteAccount = async () => {
  const response = await fetch(buildUrl('/auth/deletion'), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getToken(),
    },
  });
  return await response.json();
};

export const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await fetch(buildUrl('/auth/password'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getToken(),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return await response.json();
};
