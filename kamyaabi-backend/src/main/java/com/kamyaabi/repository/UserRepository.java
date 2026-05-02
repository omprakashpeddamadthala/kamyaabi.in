package com.kamyaabi.repository;

import com.kamyaabi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);

    org.springframework.data.domain.Page<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
            String email, String name, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u.email FROM User u WHERE u.role = :role AND u.status = :status")
    List<String> findEmailsByRoleAndStatus(@Param("role") User.Role role,
                                           @Param("status") User.Status status);
}
