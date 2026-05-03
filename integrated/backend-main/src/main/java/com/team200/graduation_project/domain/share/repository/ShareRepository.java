package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.ShareStatus;
import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {

    @Query("SELECT s FROM Share s JOIN FETCH s.user LEFT JOIN FETCH s.sharePicture WHERE s.deletedAt IS NULL")
    List<Share> findAllWithUser();

    @Query("""
            SELECT s, l
            FROM Share s
            JOIN s.user u
            JOIN Location l ON l.user = u
            LEFT JOIN s.sharePicture
            WHERE s.deletedAt IS NULL
              AND s.isView = true
              AND s.status = com.team200.graduation_project.domain.share.entity.ShareStatus.AVAILABLE
              AND u <> :currentUser
            ORDER BY s.createTime DESC
            """)
    List<Object[]> findVisibleSharesWithPosterLocation(User currentUser);

    @Query("SELECT s FROM Share s JOIN FETCH s.user LEFT JOIN FETCH s.sharePicture WHERE s.shareId = :shareId AND s.deletedAt IS NULL")
    java.util.Optional<Share> findWithUserByShareId(UUID shareId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Share s WHERE s.shareId = :shareId")
    Optional<Share> findByIdForUpdate(UUID shareId);

    @Query("SELECT s FROM Share s LEFT JOIN FETCH s.sharePicture WHERE s.user = :user AND s.status = :status AND s.deletedAt IS NULL ORDER BY s.createTime DESC")
    List<Share> findAllByUserAndStatusOrderByCreateTimeDesc(com.team200.graduation_project.domain.user.entity.User user, ShareStatus status);

    long countByCreateTimeBetween(LocalDateTime start, LocalDateTime end);

    long countByUserAndDeletedAtIsNull(com.team200.graduation_project.domain.user.entity.User user);

    @Query("SELECT s FROM Share s LEFT JOIN FETCH s.sharePicture WHERE s.user = :user AND s.deletedAt IS NULL ORDER BY s.createTime DESC")
    List<Share> findAllByUserAndDeletedAtIsNullOrderByCreateTimeDesc(com.team200.graduation_project.domain.user.entity.User user);
}
