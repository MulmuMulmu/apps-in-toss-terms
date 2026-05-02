import client from './client';

/**
 * 대시보드(Dashboard) 화면 전용 API
 */

/**
 * 사용자 통계 조회 (전체 사용자, 경고, 정지 등)
 */
export const getUserStatistics = async () => {
  try {
    const response = await client.get('/admin/dashboard/user');
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '사용자 통계 정보를 불러올 수 없습니다.',
    };
  }
};

/**
 * 당일 신고 건수 조회
 */
export const getTodayReportsCount = async () => {
  try {
    const response = await client.get('/admin/dashboard/today/report');
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '당일 신고 건수를 불러올 수 없습니다.',
    };
  }
};

/**
 * 당일 나눔 횟수 조회
 */
export const getTodaySharesCount = async () => {
  try {
    const response = await client.get('/admin/dashboard/today/share');
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '당일 나눔 횟수를 불러올 수 없습니다.',
    };
  }
};
