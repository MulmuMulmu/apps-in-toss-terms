package com.team200.graduation_project.domain.ingredient.entity;

import com.team200.graduation_project.domain.ocr.entity.OcrIngredient;
import com.team200.graduation_project.domain.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "`UserIngredient`")
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserIngredient {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID userIngredientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredientId")
    private Ingredient ingredient;

    private LocalDate purchaseDate;

    private LocalDate expirationDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserIngredientStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private IngredientSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocrIngredientId")
    private OcrIngredient ocrIngredient;

    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        this.createTime = LocalDateTime.now();
    }

    public void updateUser(User user) {
        this.user = user;
    }
}
