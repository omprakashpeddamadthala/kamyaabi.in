package com.kamyaabi.repository;

import com.kamyaabi.entity.HeroBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HeroBannerRepository extends JpaRepository<HeroBanner, Long> {

    List<HeroBanner> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<HeroBanner> findAllByOrderByDisplayOrderAscIdAsc();
}
