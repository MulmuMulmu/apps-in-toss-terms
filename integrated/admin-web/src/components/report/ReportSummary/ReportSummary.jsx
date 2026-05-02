import React, { useEffect, useState } from 'react';
import { getTodayReportsCount } from '../../../api/dashboard';
import styles from './ReportSummary.module.css';

const ReportSummary = () => {
  const [summary, setSummary] = useState({
    todayReports: 0,
    completedReports: 0,
    notCompletedReports: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await getTodayReportsCount();
      if (response.success) {
        setSummary(response.result);
      }
    };

    fetchSummary();
  }, []);

  const stats = [
    { label: '당일 신고 건수', value: summary.todayReports },
    { label: '완료 건수', value: summary.completedReports },
    { label: '미완 건수', value: summary.notCompletedReports },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>신고 현황 요약</h2>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <p className={styles.label}>{stat.label}</p>
            <h3 className={styles.value}>{stat.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportSummary;
