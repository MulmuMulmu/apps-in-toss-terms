import React from 'react';
import ReportList from '../components/report/ReportList/ReportList';
import ReportSummary from '../components/report/ReportSummary/ReportSummary';
import styles from './ReportManagementPage.module.css';

const ReportManagementPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>신고 접수 및 처리</h1>
      <div className={styles.layout}>
        <ReportList />
        <ReportSummary />
      </div>
    </div>
  );
};

export default ReportManagementPage;
