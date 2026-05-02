package com.team200.graduation_project.domain.ingredient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "`Ingredient`")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Ingredient {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID ingredientId;

    @Column(length = 100)
    private String ingredientName;

    @Column(length = 50)
    private String category;
}
