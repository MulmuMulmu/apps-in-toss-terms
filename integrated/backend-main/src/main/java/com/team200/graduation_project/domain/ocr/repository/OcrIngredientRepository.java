package com.team200.graduation_project.domain.ocr.repository;

import com.team200.graduation_project.domain.ocr.entity.Ocr;
import com.team200.graduation_project.domain.ocr.entity.OcrIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OcrIngredientRepository extends JpaRepository<OcrIngredient, UUID> {
    List<OcrIngredient> findAllByOcr(Ocr ocr);
}
