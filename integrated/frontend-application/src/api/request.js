import { buildUrl } from './config';
import { getToken } from './token';

export const apiRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: token } : {}),
    ...options.headers,
  };

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  return await response.json();
};
