import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://mulmumu-backend-aqjxa3obfa-du.a.run.app';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * 모든 요청 전에 실행됩니다.
 */
client.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰을 읽어옵니다.
    const token = localStorage.getItem('admin_token');
    
    // 토큰이 존재하면 Authorization 헤더에 주입합니다.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 응답을 받은 후 실행됩니다.
 */
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized 에러 발생 시 (인증 만료 등)
    if (error.response && error.response.status === 401) {
      console.error('인증이 만료되었습니다. 다시 로그인해 주세요.');
      
      // 토큰 삭제 및 로그인 페이지로 이동
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
