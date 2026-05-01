package com.kamyaabi.repository;

import com.kamyaabi.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Product> findTop8ByActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.discountPrice IS NOT NULL " +
           "AND p.discountPrice < p.price ORDER BY p.createdAt DESC")
    List<Product> findDiscountedProducts();

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:active IS NULL OR p.active = :active)")
    Page<Product> searchAdmin(@Param("keyword") String keyword,
                              @Param("categoryId") Long categoryId,
                              @Param("active") Boolean active,
                              Pageable pageable);

    long countByCategoryId(Long categoryId);

    long countByActiveTrueAndStockLessThan(int threshold);
}
