package com.kamyaabi.config;

import com.kamyaabi.entity.Category;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.service.impl.CategoryServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
public class CategorySlugBackfill {

    private final CategoryRepository categoryRepository;

    public CategorySlugBackfill(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfill() {
        List<Category> needsSlug = categoryRepository.findAll().stream()
                .filter(c -> c.getSlug() == null || c.getSlug().isBlank())
                .toList();
        if (needsSlug.isEmpty()) {
            return;
        }
        log.info("Backfilling slugs for {} category rows", needsSlug.size());
        for (Category c : needsSlug) {
            String base = CategoryServiceImpl.slugify(c.getName());
            if (base.isEmpty()) {
                base = "category-" + c.getId();
            }
            String candidate = base;
            int suffix = 2;
            while (categoryRepository.existsBySlugAndIdNot(candidate, c.getId())) {
                candidate = base + "-" + suffix++;
            }
            c.setSlug(candidate);
            categoryRepository.save(c);
        }
    }
}
