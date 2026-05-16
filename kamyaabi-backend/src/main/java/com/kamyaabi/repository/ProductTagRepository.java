package com.kamyaabi.repository;

import com.kamyaabi.entity.ProductTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface ProductTagRepository extends JpaRepository<ProductTag, Long> {

    Optional<ProductTag> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByName(String name);

    Set<ProductTag> findByIdIn(Set<Long> ids);
}
