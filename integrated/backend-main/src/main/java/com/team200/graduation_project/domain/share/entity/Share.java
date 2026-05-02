package com.team200.graduation_project.domain.share.entity;

import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "`Share`")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Share {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID shareId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userIngredientId")
    private UserIngredient userIngredient;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ShareStatus status;

    @Column(length = 50)
    private String category;

    private LocalDate expirationDate;

    @Column(nullable = false)
    private Boolean isView;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    @OneToOne(mappedBy = "share", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SharePicture sharePicture;

    public void update(String title, String content, String category, LocalDate expirationDate, UserIngredient userIngredient) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.expirationDate = expirationDate;
        this.userIngredient = userIngredient;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.isView = false;
    }

    public void setStatus(ShareStatus status) {
        this.status = status;
    }

    public void mask() {
        this.isView = false;
    }
}
