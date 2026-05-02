package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.Report;
import com.team200.graduation_project.domain.share.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    long countByCreateTimeBetween(LocalDateTime start, LocalDateTime end);

    long countByCreateTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, ReportStatus status);

    java.util.List<Report> findAllByCreateTimeBetween(LocalDateTime start, LocalDateTime end);

    java.util.List<Report> findAllByCreateTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, ReportStatus status);
}
