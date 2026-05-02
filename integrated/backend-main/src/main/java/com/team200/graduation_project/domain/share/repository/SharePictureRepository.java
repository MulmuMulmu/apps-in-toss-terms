package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.SharePicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharePictureRepository extends JpaRepository<SharePicture, UUID> {

    List<SharePicture> findByShareIn(List<Share> shares);

    List<SharePicture> findAllByShare(Share share);

    void deleteAllByShare(Share share);
}
