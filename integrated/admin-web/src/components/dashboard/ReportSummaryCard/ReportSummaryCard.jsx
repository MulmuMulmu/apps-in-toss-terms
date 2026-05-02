import React, { useEffect, useState } from 'react';
import { getReports } from '../../../api/reports';
import { formatAdminUserLabel } from '../../../utils/adminUserDisplay';
import styles from './ReportSummaryCard.module.css';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReportSummaryCard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const response = await getReports({ Date: today(), type: 'all' });
      if (response.success) {
        setReports((response.result.reports || []).slice(0, 3));
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>신고 접수 및 처리</h2>
      <div className={styles.list}>
        {loading ? (
          <div className={styles.card}>신고 정보를 불러오는 중입니다.</div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.reportId} className={styles.card}>
              <div className={styles.info}>
                <h3 className={styles.reportTitle}>{report.content}</h3>
                <p className={styles.reporter}>
                  신고자: {formatAdminUserLabel({
                    name: report.reporterName,
                    userId: report.reporterUserId,
                    tossUserKey: report.reporterTossUserKey,
                    loginProvider: report.reporterLoginProvider,
                  })}
                </p>
              </div>
              <div className={`${styles.status} ${report.status === '완료' ? styles.done : styles.pending}`}>
                {report.status}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.card}>오늘 접수된 신고가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default ReportSummaryCard;
