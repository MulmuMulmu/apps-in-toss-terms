package com.team200.graduation_project.domain.user.repository;

import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    java.util.List<User> findAllByDeletedAtIsNull();

    boolean existsByUserIdIs(String id);

    Optional<User> findByUserIdIs(String id);

    Optional<User> findByUserIdIsAndDeletedAtIsNull(String id);

    Optional<User> findByTossUserKeyAndDeletedAtIsNull(String tossUserKey);

    Optional<User> findByTossUserKey(String tossUserKey);

    Optional<User> findByNickNameIsAndDeletedAtIsNull(String nickName);

    long countByStatus(UserStatus status);

    Long countByRole(Role role);

    Long countByRoleAndDeletedAtIsNull(Role role);

    Long countByRoleAndStatusAndDeletedAtIsNull(Role role, UserStatus status);

    java.util.List<User> findAllByRoleAndDeletedAtIsNull(Role role);

}
