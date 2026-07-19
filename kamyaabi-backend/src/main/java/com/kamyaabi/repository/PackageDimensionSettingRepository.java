package com.kamyaabi.repository;

import com.kamyaabi.entity.PackageDimensionSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageDimensionSettingRepository extends JpaRepository<PackageDimensionSetting, Long> {

    boolean existsByPackageWeightGram(Integer packageWeightGram);

    boolean existsByPackageWeightGramAndIdNot(Integer packageWeightGram, Long id);

    List<PackageDimensionSetting> findByActiveTrueOrderByPackageWeightGramAsc();
}
