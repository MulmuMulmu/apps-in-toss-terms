import React from 'react';
import styles from './ReportItem.module.css';

const ReportItem = ({
  title,
  reportId,
  reporter,
  content,
  status,
  reportTypeLabel,
  isChatReport,
  hasSharePost,
  onProcessUser,
  onViewPost,
  onMaskPost,
  onCompleteReport,
}) => {
  const isCompleted = status === '완료';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <span className={`${styles.typeBadge} ${isChatReport ? styles.chat : styles.share}`}>
              {reportTypeLabel || '나눔 신고'}
            </span>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <p className={styles.reportId}>신고 ID: {reportId || '-'}</p>
          <p className={styles.reporter}>신고자: {reporter}</p>
        </div>
        <div className={`${styles.statusBadge} ${status === '완료' ? styles.done : styles.pending}`}>
          {status}
        </div>
      </div>
      <p className={styles.content}>내용: {content}</p>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onViewPost} disabled={!hasSharePost}>
          연관 게시물 보기
        </button>
        {!isChatReport && <button className={styles.actionBtn} onClick={onMaskPost}>게시물 숨김</button>}
        <button className={styles.actionBtn} onClick={onProcessUser}>사용자 처리</button>
        <button
          className={`${styles.actionBtn} ${styles.completeBtn}`}
          onClick={onCompleteReport}
          disabled={isCompleted}
        >
          {isCompleted ? '처리 완료됨' : '신고 처리 완료'}
        </button>
      </div>
    </div>
  );
};

export default ReportItem;
