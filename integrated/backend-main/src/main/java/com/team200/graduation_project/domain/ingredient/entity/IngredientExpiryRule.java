package com.team200.graduation_project.domain.ingredient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "`IngredientExpiryRule`",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_ingredient_expiry_rule",
                columnNames = {"ingredient_id", "storage_method"}
        )
)
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class IngredientExpiryRule {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID ruleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "storage_method", length = 20, nullable = false)
    private String storageMethod;

    @Column(nullable = false)
    private Integer shelfLifeDays;

    @Column(length = 30, nullable = false)
    private String source;

    private Double confidence;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
    }

    @PreUpdate
    void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public void updateRule(Integer shelfLifeDays, String source, Double confidence) {
        this.shelfLifeDays = shelfLifeDays;
        this.source = source;
        this.confidence = confidence;
    }
}
