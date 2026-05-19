package com.kamyaabi.repository;

import com.kamyaabi.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findByProductIdOrderByDisplayOrderAsc(Long productId);

    List<Faq> findByProductIdIsNullOrderByDisplayOrderAsc();
}
