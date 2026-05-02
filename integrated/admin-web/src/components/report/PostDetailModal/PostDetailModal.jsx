import React, { useEffect, useState } from 'react';
import { getShareDetail } from '../../../api/reports';
import { formatAdminUserLabel } from '../../../utils/adminUserDisplay';
import styles from './PostDetailModal.module.css';

const PostDetailModal = ({ isOpen, onClose, reportData, onProcessUser }) => {
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const response = await getShareDetail(reportData.shareId);
      if (response.success) {
        setPostData(response.result);
      }
      setLoading(false);
    };

    if (isOpen && reportData?.shareId) {
      fetchDetail();
    }
  }, [isOpen, reportData]);

  if (!isOpen || !reportData) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className={styles.loading}>게시물 정보를 불러오는 중...</div>
        ) : postData ? (
          <>
            <div className={styles.imageContainer}>
              <img src={postData.image} alt="게시물 이미지" className={styles.postImage} />
              <button className={styles.closeBtn} onClick={onClose}>&times;</button>
            </div>

            <div className={styles.sellerBar}>
              <div className={styles.profileCircle}></div>
              <span className={styles.sellerName}>
                {formatAdminUserLabel({
                  name: postData.sellerName,
                  userId: postData.sellerUserId,
                  tossUserKey: postData.sellerTossUserKey,
                  loginProvider: postData.sellerLoginProvider,
                })}
              </span>
            </div>

            <div className={styles.contentSection}>
              <div className={styles.titleRow}>
                <h3 className={styles.postTitle}>{postData.title}</h3>
                <div className={styles.menuIcon}>⋮</div>
              </div>
              <p className={styles.categoryTag}>
                {postData.title} ({postData.category})
              </p>
              <p className={styles.description}>{postData.description}</p>
            </div>

            <div className={styles.footer}>
              <button className={styles.processBtn} onClick={onProcessUser}>
                사용자 처리
              </button>
            </div>
          </>
        ) : (
          <div className={styles.error}>게시물 정보를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal;
