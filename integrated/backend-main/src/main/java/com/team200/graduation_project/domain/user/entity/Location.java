package com.team200.graduation_project.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "`Location`")
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Location {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID locationId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private User user;

    private Double latitude;

    private Double longitude;

    @Column(length = 100)
    private String fullAddress;

    @Column(length = 50)
    private String displayAddress;

    public void update(Double latitude, Double longitude, String fullAddress, String displayAddress) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.fullAddress = fullAddress;
        this.displayAddress = displayAddress;
    }
}
