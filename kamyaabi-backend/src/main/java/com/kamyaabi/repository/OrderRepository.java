package com.kamyaabi.repository;

import com.kamyaabi.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o JOIN FETCH o.user LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN :excluded")
    BigDecimal sumRevenueExcludingStatuses(@Param("excluded") List<Order.OrderStatus> excluded);

    @Query("SELECT CAST(o.createdAt AS LocalDate) AS bucket, "
            + "COUNT(o) AS orders, "
            + "COALESCE(SUM(o.totalAmount), 0) AS revenue "
            + "FROM Order o "
            + "WHERE o.createdAt >= :from AND o.createdAt < :to "
            + "AND o.status NOT IN :excluded "
            + "GROUP BY CAST(o.createdAt AS LocalDate) "
            + "ORDER BY CAST(o.createdAt AS LocalDate) ASC")
    List<Object[]> aggregateDaily(@Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to,
                                  @Param("excluded") List<Order.OrderStatus> excluded);

    @Query("SELECT COUNT(DISTINCT o.user.id) FROM Order o JOIN o.items i "
            + "WHERE i.product.id = :productId "
            + "AND o.createdAt >= :since "
            + "AND o.status NOT IN :excluded")
    long countDistinctRecentBuyersForProduct(@Param("productId") Long productId,
                                             @Param("since") LocalDateTime since,
                                             @Param("excluded") List<Order.OrderStatus> excluded);
}
