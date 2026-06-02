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

    @Query("SELECT DISTINCT p FROM Product p JOIN p.tags t WHERE p.active = true AND t.slug = :tagSlug")
    Page<Product> findByTagSlug(@Param("tagSlug") String tagSlug, Pageable pageable);

    // ── Variation support ───────────────────────────────────────────────

    @Query(value = """
            SELECT p.* FROM products p
            INNER JOIN (
                SELECT DISTINCT ON (LOWER(TRIM(name)), category_id)
                       id
                FROM products
                WHERE active = true
                ORDER BY LOWER(TRIM(name)), category_id,
                         CASE WHEN weight ~ '^\\d+\\.?\\d*$'
                              THEN CAST(weight AS NUMERIC)
                              ELSE 999999 END ASC,
                         id ASC
            ) rep ON p.id = rep.id
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM (
                SELECT 1 FROM products
                WHERE active = true
                GROUP BY LOWER(TRIM(name)), category_id
            ) g
            """,
            nativeQuery = true)
    Page<Product> findGroupedActiveProducts(Pageable pageable);

    @Query(value = """
            SELECT p.* FROM products p
            INNER JOIN (
                SELECT DISTINCT ON (LOWER(TRIM(name)), category_id)
                       id
                FROM products
                WHERE active = true AND category_id = :categoryId
                ORDER BY LOWER(TRIM(name)), category_id,
                         CASE WHEN weight ~ '^\\d+\\.?\\d*$'
                              THEN CAST(weight AS NUMERIC)
                              ELSE 999999 END ASC,
                         id ASC
            ) rep ON p.id = rep.id
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM (
                SELECT 1 FROM products
                WHERE active = true AND category_id = :categoryId
                GROUP BY LOWER(TRIM(name)), category_id
            ) g
            """,
            nativeQuery = true)
    Page<Product> findGroupedByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query(value = """
            SELECT p.* FROM products p
            INNER JOIN (
                SELECT DISTINCT ON (LOWER(TRIM(name)), category_id)
                       id
                FROM products
                WHERE active = true
                  AND (LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))
                ORDER BY LOWER(TRIM(name)), category_id,
                         CASE WHEN weight ~ '^\\d+\\.?\\d*$'
                              THEN CAST(weight AS NUMERIC)
                              ELSE 999999 END ASC,
                         id ASC
            ) rep ON p.id = rep.id
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM (
                SELECT 1 FROM products
                WHERE active = true
                  AND (LOWER(name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))
                GROUP BY LOWER(TRIM(name)), category_id
            ) g
            """,
            nativeQuery = true)
    Page<Product> searchGroupedByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = """
            SELECT p.* FROM products p
            INNER JOIN (
                SELECT DISTINCT ON (LOWER(TRIM(pr.name)), pr.category_id)
                       pr.id
                FROM products pr
                JOIN product_product_tags ppt ON pr.id = ppt.product_id
                JOIN product_tags pt ON ppt.tag_id = pt.id
                WHERE pr.active = true AND pt.slug = :tagSlug
                ORDER BY LOWER(TRIM(pr.name)), pr.category_id,
                         CASE WHEN pr.weight ~ '^\\d+\\.?\\d*$'
                              THEN CAST(pr.weight AS NUMERIC)
                              ELSE 999999 END ASC,
                         pr.id ASC
            ) rep ON p.id = rep.id
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM (
                SELECT 1 FROM products pr
                JOIN product_product_tags ppt ON pr.id = ppt.product_id
                JOIN product_tags pt ON ppt.tag_id = pt.id
                WHERE pr.active = true AND pt.slug = :tagSlug
                GROUP BY LOWER(TRIM(pr.name)), pr.category_id
            ) g
            """,
            nativeQuery = true)
    Page<Product> findGroupedByTagSlug(@Param("tagSlug") String tagSlug, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true " +
           "AND LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) " +
           "AND p.category.id = :categoryId " +
           "ORDER BY CASE WHEN p.weight IS NOT NULL AND p.weight <> '' THEN 0 ELSE 1 END, p.id ASC")
    List<Product> findVariations(@Param("name") String name,
                                 @Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true " +
           "AND LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) " +
           "AND p.category.id = :categoryId")
    long countVariations(@Param("name") String name,
                         @Param("categoryId") Long categoryId);
}
