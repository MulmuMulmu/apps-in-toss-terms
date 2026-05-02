package com.team200.graduation_project.domain.ocr.repository;

import com.team200.graduation_project.domain.ocr.entity.Ocr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OcrRepository extends JpaRepository<Ocr, UUID> {
    long countByUser(com.team200.graduation_project.domain.user.entity.User user);
}
