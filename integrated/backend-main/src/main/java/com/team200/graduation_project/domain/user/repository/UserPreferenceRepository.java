package com.team200.graduation_project.domain.user.repository;


import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    void deleteByUser(User user);

    void deleteByUserAndType(User user, String type);
}
