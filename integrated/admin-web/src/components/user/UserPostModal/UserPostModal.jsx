import React from 'react';
import { getShareDetail } from '../../../api/reports';
import { formatAdminUserLabel } from '../../../utils/adminUserDisplay';
import styles from './UserPostModal.module.css';

const UserPostModal = ({ isOpen, onClose, nickName, posts, loading }) => {
  const [selectedPost, setSelectedPost] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedPost(null); // 모달 닫힐 때 선택 상태 초기화
      setDetailLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePostClick = async (post) => {
    setSelectedPost(post);
    setDetailLoading(true);

    const response = await getShareDetail(post.shareId);
    if (response.success) {
      setSelectedPost({
        ...post,
        ...response.result,
      });
    }
    setDetailLoading(false);
  };

  const handleBack = () => {
    setSelectedPost(null);
    setDetailLoading(false);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {selectedPost && detailLoading ? (
          <div className={styles.loading}>상세 정보를 불러오는 중...</div>
        ) : selectedPost ? (
          /* 게시물 상세 보기 모드 (신고 접수 상세보기와 디자인 동기화) */
          <>
            <div className={styles.imageContainer}>
              <img src={selectedPost.image} alt="게시물 이미지" className={styles.detailImage} />
              <button className={styles.detailCloseBtn} onClick={onClose}>&times;</button>
            </div>

            <div className={styles.sellerBar}>
              <div className={styles.profileCircle}></div>
              <span className={styles.sellerName}>
                {formatAdminUserLabel({
                  name: selectedPost.sellerName || nickName,
                  userId: selectedPost.sellerUserId,
                  tossUserKey: selectedPost.sellerTossUserKey,
                  loginProvider: selectedPost.sellerLoginProvider,
                })}
              </span>
            </div>

            <div className={styles.contentSection}>
              <div className={styles.titleRow}>
                <h3 className={styles.detailTitle}>{selectedPost.title}</h3>
                <div className={styles.menuIcon}>⋮</div>
              </div>
              <p className={styles.categoryTag}>
                {(selectedPost.ingredient || selectedPost.title || '나눔 품목')} ({selectedPost.category || '기타'})
              </p>
              <p className={styles.detailDescription}>{selectedPost.description || selectedPost.content}</p>
            </div>

            <div className={styles.detailFooter}>
              <button className={styles.backBtn} onClick={handleBack}>이전</button>
              <button className={styles.closeBtnFooter} onClick={onClose}>닫기</button>
            </div>
          </>
        ) : (
          /* 게시물 리스트 모드 */
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>사용자가 작성한 글</h2>
              <button className={styles.closeBtn} onClick={onClose}>&times;</button>
            </div>

            <div className={styles.content}>
              {loading ? (
                <div className={styles.loading}>나눔 내역을 불러오는 중...</div>
              ) : posts && posts.length > 0 ? (
                <div className={styles.postList}>
                  {posts.map((post) => (
                    <div 
                      key={post.shareId} 
                      className={styles.postItem}
                      onClick={() => handlePostClick(post)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.imageWrapper}>
                        {post.image ? (
                          <img src={post.image} alt={post.title} className={styles.postImage} />
                        ) : (
                          <div className={styles.placeholderImg}></div>
                        )}
                      </div>
                      <div className={styles.postInfo}>
                        <h3 className={styles.postTitle}>{post.title}</h3>
                        <p className={styles.postDescription}>{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>작성한 나눔글이 없습니다.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserPostModal;
