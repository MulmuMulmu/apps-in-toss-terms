package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.ShareHiddenPost;
import com.team200.graduation_project.domain.user.entity.User;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ShareHiddenPostRepository extends JpaRepository<ShareHiddenPost, Long> {

    boolean existsByUserAndShare(User user, Share share);

    List<ShareHiddenPost> findByUserOrderByCreateTimeDesc(User user);

    @Modifying
    void deleteByUserAndShare(User user, Share share);

    @Query("select h.share.shareId from ShareHiddenPost h where h.user = :user")
    Set<UUID> findHiddenShareIdsByUser(User user);
}
