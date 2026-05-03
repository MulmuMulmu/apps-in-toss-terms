import { processUserPenalty } from '../../../api/userManagement';
import { formatAdminUserLabel } from '../../../utils/adminUserDisplay';
import styles from './UserProcessModal.module.css';

const UserProcessModal = ({ isOpen, onClose, onActionComplete, reportData }) => {
  if (!isOpen || !reportData) return null;

  const targetUserId = reportData.targetId || reportData.reportedUserId;
  const targetName = reportData.targetName || reportData.reportedName;
  const targetTossUserKey = reportData.targetTossUserKey || reportData.reportedTossUserKey;
  const targetLoginProvider = reportData.targetLoginProvider || reportData.reportedLoginProvider;

  const handlePenalty = async (status) => {
    const confirmMsg = status === '영구정지' 
      ? '정말 이 사용자를 영구 정지하시겠습니까?' 
      : '이 사용자에게 경고를 부여하시겠습니까?';
      
    if (!window.confirm(confirmMsg)) return;

    if (!targetTossUserKey && !targetUserId) {
      onActionComplete?.('처리 대상 사용자 정보를 불러올 수 없습니다.');
      return;
    }

    const response = await processUserPenalty({
      userId: targetUserId,
      tossUserKey: targetTossUserKey,
      status,
    });

    if (response.success) {
      onActionComplete?.(response.result);
      onClose(); // 성공 시 모달 닫기
    } else {
      onActionComplete?.(response.result);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <h2 className={styles.modalTitle}>사용자 처리</h2>
        
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>신고 정보</h4>
          <p className={styles.infoText}>
            <strong>신고자:</strong> {formatAdminUserLabel({
              name: reportData.reporterName,
              userId: reportData.reporterUserId,
              tossUserKey: reportData.reporterTossUserKey,
              loginProvider: reportData.reporterLoginProvider,
            })}
          </p>
          <p className={styles.infoText}>
            <strong>대상자:</strong> {formatAdminUserLabel({
              name: targetName,
              userId: targetUserId,
              tossUserKey: targetTossUserKey,
              loginProvider: targetLoginProvider,
            })} / (누적 경고 : {reportData.totalWarming ?? '-'}회)
          </p>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>신고 상세 내용</h4>
          <div className={styles.detailBox}>
            <p className={styles.detailItem}><strong>신고영역:</strong> {reportData.reportTypeLabel || '나눔 신고'}</p>
            {reportData.reportType === 'CHAT' && (
              <p className={styles.detailItem}><strong>채팅방 ID:</strong> {reportData.chatRoomId || '-'}</p>
            )}
            <p className={styles.detailItem}><strong>신고제목:</strong> {reportData.title || '-'}</p>
            <p className={styles.detailItem}><strong>신고내용:</strong> {reportData.content}</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.warnBtn} onClick={() => handlePenalty('사용자 경고')}>
            사용자 경고
          </button>
          <button className={styles.banBtn} onClick={() => handlePenalty('영구정지')}>
            영구 정지
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProcessModal;
