import client from './client';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const rankName = (rank) => String(rank?.[0] ?? '');
const rankValue = (rank) => Number(rank?.[1] ?? 0);

const toChartRow = (item) => ({
  date: item.date,
  timestamp: new Date(`${item.date}T00:00:00`).getTime(),
  totalCount: Number(item.total ?? 0),
  item1_name: rankName(item.rank1),
  item1_value: rankValue(item.rank1),
  item2_name: rankName(item.rank2),
  item2_value: rankValue(item.rank2),
  item3_name: rankName(item.rank3),
  item3_value: rankValue(item.rank3),
});

export const getStatisticsData = async (startDate, endDate) => {
  try {
    const end = endDate || new Date();
    const start = startDate || new Date(end);
    if (!startDate) start.setDate(start.getDate() - 30);

    const response = await client.get('/admin/data/statistics', {
      params: {
        startDate: formatDate(start),
        endDate: formatDate(end),
      },
    });

    if (!response.data?.success) return response.data;

    return {
      ...response.data,
      result: {
        dailyCollection: (response.data.result || []).map(toChartRow),
      },
    };
  } catch (error) {
    return error.response?.data || {
      success: false,
      code: 'COMMON500',
      result: '통계 데이터를 불러올 수 없습니다.',
    };
  }
};
