package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.FaqResponse;
import com.kamyaabi.entity.Faq;
import com.kamyaabi.repository.FaqRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/faqs")
@Tag(name = "FAQs", description = "Product FAQs")
public class FaqController {

    private final FaqRepository faqRepository;

    public FaqController(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    @GetMapping
    @Operation(summary = "Get FAQs for a product (falls back to global FAQs)")
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getFaqs(@PathVariable Long productId) {
        List<Faq> faqs = faqRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (faqs.isEmpty()) {
            faqs = faqRepository.findByProductIdIsNullOrderByDisplayOrderAsc();
        }
        List<FaqResponse> responses = faqs.stream()
                .map(f -> FaqResponse.builder()
                        .id(f.getId())
                        .question(f.getQuestion())
                        .answer(f.getAnswer())
                        .displayOrder(f.getDisplayOrder())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
