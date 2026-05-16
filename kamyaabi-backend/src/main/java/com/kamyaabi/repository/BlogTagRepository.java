package com.kamyaabi.repository;

import com.kamyaabi.entity.BlogTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface BlogTagRepository extends JpaRepository<BlogTag, Long> {

    Optional<BlogTag> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByName(String name);

    Set<BlogTag> findByIdIn(Set<Long> ids);
}
