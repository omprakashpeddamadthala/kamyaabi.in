package com.kamyaabi.repository;

import com.kamyaabi.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    long countByProductId(Long productId);

    @Modifying
    @Query("DELETE FROM OrderItem oi WHERE oi.product.id = :productId")
    int deleteAllByProductId(@Param("productId") Long productId);
}
