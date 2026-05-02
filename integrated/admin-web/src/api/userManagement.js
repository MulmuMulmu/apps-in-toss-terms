import client from './client';

export const getUsers = async (params = { userId: 'all' }) => {
  try {
    const response = await client.get('/admin/users/list', { params });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '사용자 리스트를 불러올 수 없습니다.',
    };
  }
};

export const getUserPosts = async (userId) => {
  try {
    const response = await client.get('/admin/users/shares/list', {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '사용자의 나눔글 목록을 불러올 수 없습니다.',
    };
  }
};

export const processUserPenalty = async ({ userId, tossUserKey, status }) => {
  try {
    const response = await client.patch('/admin/report/users', {
      userId,
      tossUserKey,
      status,
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '사용자 상태를 변경할 수 없습니다.',
    };
  }
};
