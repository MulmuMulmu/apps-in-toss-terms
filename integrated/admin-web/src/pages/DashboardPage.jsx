import React, { useState, useEffect } from 'react';
import StatCard from '../components/common/StatCard/StatCard';
import DashboardSummary from '../components/dashboard/DashboardSummary/DashboardSummary';
import ReportSummaryCard from '../components/dashboard/ReportSummaryCard/ReportSummaryCard';
import { 
  getUserStatistics, 
  getTodayReportsCount, 
  getTodaySharesCount 
} from '../api/dashboard';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    atLeastOneWarming: 0,
    permanentSuspension: 0
  });
  const [todayReports, setTodayReports] = useState(0);
  const [todayShares, setTodayShares] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [userRes, reportRes, shareRes] = await Promise.all([
        getUserStatistics(),
        getTodayReportsCount(),
        getTodaySharesCount()
      ]);

      if (userRes.success) setStats(userRes.result);
      if (reportRes.success) setTodayReports(reportRes.result.todayReports);
      if (shareRes.success) setTodayShares(shareRes.result.todayShares);

      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>운영 대시보드</h1>

      <div className={styles.statGrid}>
        <StatCard
          title="전체 사용자 수"
          value={loading ? '-' : stats.totalUsers.toLocaleString()}
          trend="active"
        />
        <StatCard
          title="당일 신고 건수"
          value={loading ? '-' : todayReports.toLocaleString()}
          trend="danger"
        />
        <StatCard
          title="당일 나눔 횟수"
          value={loading ? '-' : todayShares.toLocaleString()}
          trend="active"
        />
      </div>

      <div className={styles.bottomGrid}>
        <DashboardSummary stats={stats} loading={loading} />
        <ReportSummaryCard />
      </div>
    </div>
  );
};

export default DashboardPage;
