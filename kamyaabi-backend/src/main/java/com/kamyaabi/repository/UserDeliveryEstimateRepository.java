package com.kamyaabi.repository;

import com.kamyaabi.entity.UserDeliveryEstimate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDeliveryEstimateRepository extends JpaRepository<UserDeliveryEstimate, Long> {

    Optional<UserDeliveryEstimate> findByUserId(Long userId);
}
