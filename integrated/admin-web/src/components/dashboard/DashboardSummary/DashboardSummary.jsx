import React from 'react';
import styles from './DashboardSummary.module.css';

const DashboardSummary = ({ stats, loading }) => {
  const items = [
    { label: '전체 사용자', value: loading ? '-' : `${stats.totalUsers.toLocaleString()}명` },
    { label: '경고 1회 이상', value: loading ? '-' : `${stats.atLeastOneWarming.toLocaleString()}명` },
    { label: '영구 정지 사용자', value: loading ? '-' : `${stats.permanentSuspension.toLocaleString()}명` },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>사용자 요약</h2>
      <div className={styles.list}>
        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSummary;
