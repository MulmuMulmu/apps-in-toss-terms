import client from './client';

export const getReports = async (params) => {
  try {
    const response = await client.get('/admin/report/list', { params });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '신고 목록을 조회할 수 없습니다.',
    };
  }
};

export const getReportDetail = async (reportId) => {
  try {
    const response = await client.get('/admin/report/one', {
      params: { reportId },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '신고 상세를 조회할 수 없습니다.',
    };
  }
};

export const updateReportStatus = async () => ({
  success: false,
  code: 'COMMON400',
  result: '백엔드에 신고 상태 단독 변경 API가 없습니다.',
});

export const maskPost = async (shareId) => {
  try {
    const response = await client.patch('/admin/report/post/masking', null, {
      params: { shareId },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '게시글을 숨김 처리 할 수 없습니다.',
    };
  }
};

export const getShareDetail = async (shareId) => {
  try {
    const response = await client.get('/admin/shares/one', {
      params: { shareId },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '나눔 정보를 불러올 수 없습니다.',
    };
  }
};
