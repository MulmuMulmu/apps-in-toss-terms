import { login } from '../api/auth';

const DEFAULT_DEV_LOGIN_ID = 'mulmuAdmin';
const DEFAULT_DEV_LOGIN_PASSWORD = '1234';

export const getDevelopmentLoginCredentials = () => ({
  id: process.env.EXPO_PUBLIC_DEV_LOGIN_ID || DEFAULT_DEV_LOGIN_ID,
  password: process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD || DEFAULT_DEV_LOGIN_PASSWORD,
});

export const loginWithDevelopmentAccount = async () => {
  const response = await login(getDevelopmentLoginCredentials());
  const jwt = response?.result?.jwt;

  if (!response?.success || !jwt) {
    throw new Error(response?.result || '개발 계정으로 로그인하지 못했어요.');
  }

  return {
    jwt,
    firstLogin: response.result.firstLogin ?? response.result.fisrtLogin ?? false,
    raw: response,
  };
};
