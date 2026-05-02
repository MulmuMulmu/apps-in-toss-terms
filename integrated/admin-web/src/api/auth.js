import client from './client';

/**
 * 관리자 인증 관련 API
 */

/**
 * 관리자 로그인
 * @param {Object} credentials - 로그인 정보 (email, password)
 * @returns {Promise} API 응답 객체
 */
export const loginAdmin = async (credentials) => {
  const response = await client.post('/admin/auth/login', credentials);
  return response.data;
};
