package com.team200.graduation_project.domain.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "`User`")
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @Column(name = "userId", nullable = false, length = 50)
    private String userId;

    @Column(length = 100)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickName;

    @Column(length = 20)
    private Boolean firstLogin;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 100, unique = true)
    private String tossUserKey;

    @Column(length = 500)
    private String tossScope;

    @Column(length = 1000)
    private String tossAgreedTerms;

    private LocalDateTime tossLastLoginAt;

    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;

    private Long warmingCount;

    public void updateFirstLogin(Boolean firstLogin) {
        this.firstLogin = firstLogin;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void updateNickName(String nickName) {
        this.nickName = nickName;
    }

    public void updateImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void updateAppsInTossLoginMetadata(String scope, String agreedTerms) {
        this.tossScope = scope;
        this.tossAgreedTerms = agreedTerms;
        this.tossLastLoginAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.status = UserStatus.WITHDRAWN;
    }

    public void block() {
        this.status = UserStatus.BLOCKED;
    }

    public void addWarning() {
        if (this.warmingCount == null) {
            this.warmingCount = 0L;
        }
        this.warmingCount++;
        this.status = UserStatus.WARMING;
    }

}
