package com.team200.graduation_project.domain.user.repository;

import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {
    Optional<Location> findByUser(User user);
}
