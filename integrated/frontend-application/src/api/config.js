const getDefaultApiBaseUrl = () => {
  if (
    typeof window !== 'undefined'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return 'http://localhost:8080';
  }

  return 'https://sokksik.click';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBaseUrl();

export const buildUrl = (path) => `${API_BASE_URL}${path}`;
