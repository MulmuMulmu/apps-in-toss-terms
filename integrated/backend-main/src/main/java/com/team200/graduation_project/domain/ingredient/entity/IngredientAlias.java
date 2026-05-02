package com.team200.graduation_project.domain.ingredient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "`IngredientAlias`")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class IngredientAlias {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID ingredientAliasId;

    @Column(length = 150, nullable = false)
    private String aliasName;

    @Column(length = 150, nullable = false)
    private String normalizedAliasName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredientId", nullable = false)
    private Ingredient ingredient;

    @Column(length = 50)
    private String source;

    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        this.createTime = LocalDateTime.now();
        if (this.normalizedAliasName == null && this.aliasName != null) {
            this.normalizedAliasName = normalize(this.aliasName);
        }
    }

    public static String normalize(String value) {
        return value == null ? "" : value.replaceAll("[^0-9A-Za-z가-힣]", "").toLowerCase();
    }
}
