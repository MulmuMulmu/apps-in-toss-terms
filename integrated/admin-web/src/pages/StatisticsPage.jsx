import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { getStatisticsData } from '../api/statistics';
import styles from './StatisticsPage.module.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <div className={styles.tooltipDivider} />
        <p className={styles.tooltipTotal}>
          총 수집량: <span>{payload.find(p => p.dataKey === 'totalCount')?.value}건</span>
        </p>
        <div className={styles.tooltipItems}>
          <p className={styles.itemRow}>
            <span className={styles.dot} style={{ backgroundColor: '#8884d8' }} />
            {payload[0].payload.item1_name}: {payload.find(p => p.dataKey === 'item1_value')?.value}회
          </p>
          <p className={styles.itemRow}>
            <span className={styles.dot} style={{ backgroundColor: '#82ca9d' }} />
            {payload[0].payload.item2_name}: {payload.find(p => p.dataKey === 'item2_value')?.value}회
          </p>
          <p className={styles.itemRow}>
            <span className={styles.dot} style={{ backgroundColor: '#ffc658' }} />
            {payload[0].payload.item3_name}: {payload.find(p => p.dataKey === 'item3_value')?.value}회
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const StatisticsPage = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 날짜 범위 상태 (기본값: 오늘 포함 최근 7일)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d;
  }, [today]);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getStatisticsData(startDate, endDate);
      if (response.success) {
        setAllData(response.result.dailyCollection);
      }
      setLoading(false);
    };
    fetchData();
  }, [startDate, endDate]);

  // 선택된 날짜 범위에 따른 데이터 필터링
  const filteredData = useMemo(() => {
    if (!allData.length) return [];

    return allData.filter(item => {
      // YYYY-MM-DD 형식을 '로컬 시간' Date 객체로 변환 (타임존 이슈 방지)
      const [year, month, day] = item.date.split('-').map(Number);
      const itemDate = new Date(year, month - 1, day);

      // 시간 정보를 제거하여 날짜만 비교
      itemDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      return itemDate >= start && itemDate <= end;
    });
  }, [allData, startDate, endDate]);

  if (loading) return <div className={styles.loading}>통계 데이터를 불러오는 중입니다...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>데이터 분석 및 통계</h1>
        <div className={styles.filterSection}>
          <div className={styles.datePickerGroup}>
            <label>조회 기간 선택</label>
            <div className={styles.pickers}>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                maxDate={today}
                className={styles.dateInput}
              />
              <span className={styles.tilde}>~</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={today}
                dateFormat="yyyy-MM-dd"
                className={styles.dateInput}
              />
            </div>
          </div>
        </div>
      </header>

      <section className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h2 className={styles.sectionTitle}>통계 통합 리포트</h2>
          <p className={styles.sectionDesc}>전체 수집량(선)과 주요 식재료 수집량(막대)의 상관관계 분석</p>
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid stroke="#f5f5f5" vertical={false} />
              <XAxis
                dataKey="date"
                scale="band"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#666' }}
                tickFormatter={(dateStr) => {
                  const [year, month, day] = dateStr.split('-');
                  return `${year.slice(2)}-${month}-${day}`;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />

              {/* 바 그래프: 상위 3개 식재료 */}
              <Bar dataKey="item1_value" name="상위 1위" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="item1_name" position="top" offset={10} style={{ fontSize: 11, fontWeight: 700, fill: '#666' }} />
              </Bar>
              <Bar dataKey="item2_value" name="상위 2위" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="item2_name" position="top" offset={10} style={{ fontSize: 11, fontWeight: 700, fill: '#666' }} />
              </Bar>
              <Bar dataKey="item3_value" name="상위 3위" fill="#ffc658" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="item3_name" position="top" offset={10} style={{ fontSize: 11, fontWeight: 700, fill: '#666' }} />
              </Bar>

              {/* 꺾은선 그래프: 전체 수집량 */}
              <Line
                type="linear"
                dataKey="totalCount"
                name="전체 수집량"
                stroke="#ff7300"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ff7300', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
