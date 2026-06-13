package com.kamyaabi.service.impl;

import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.service.ProductCsvService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.Writer;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class ProductCsvServiceImpl implements ProductCsvService {

    private static final String[] CSV_HEADERS = {
            "id", "name", "slug", "description", "price", "salePrice", "stock", "sku",
            "categoryId", "categoryName", "isActive", "imageUrl",
            "metaTitle", "metaDescription", "metaKeywords", "canonicalUrl",
            "ogTitle", "ogDescription", "ogImage"
    };

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductCsvServiceImpl(ProductRepository productRepository,
                                 CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void writeProductsCsv(Writer writer) throws IOException {
        List<Product> products = productRepository.findAll();

        try (CSVPrinter printer = new CSVPrinter(writer,
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS).build())) {
            for (Product p : products) {
                printer.printRecord(
                        p.getId(),
                        p.getName(),
                        p.getSlug(),
                        p.getDescription(),
                        p.getPrice(),
                        p.getDiscountPrice(),
                        p.getStock(),
                        p.getWeight(),
                        p.getCategory() != null ? p.getCategory().getId() : "",
                        p.getCategory() != null ? p.getCategory().getName() : "",
                        p.getActive(),
                        p.getImageUrl(),
                        p.getSeoTitle(),
                        p.getSeoDescription(),
                        p.getSeoKeywords(),
                        p.getCanonicalUrl(),
                        p.getSeoTitle(),
                        p.getSeoDescription(),
                        p.getOgImageUrl()
                );
            }
        }
    }

    @Override
    public Map<String, Object> importProducts(InputStream inputStream) throws IOException {
        int created = 0;
        int updated = 0;
        List<String> errors = new ArrayList<>();

        try (Reader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            int rowNum = 1;
            for (CSVRecord record : parser) {
                rowNum++;
                try {
                    switch (importProductRow(record, rowNum, errors)) {
                        case CREATED -> created++;
                        case UPDATED -> updated++;
                        case SKIPPED -> { }
                    }
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("created", created);
        summary.put("updated", updated);
        summary.put("errors", errors);
        return summary;
    }

    private ImportResult importProductRow(CSVRecord record, int rowNum, List<String> errors) {
        String name = getField(record, "name");
        String priceStr = getField(record, "price");
        String categoryIdStr = getField(record, "categoryId");

        if (name == null || name.isBlank()) {
            errors.add("Row " + rowNum + ": missing required field 'name'");
            return ImportResult.SKIPPED;
        }
        if (priceStr == null || priceStr.isBlank()) {
            errors.add("Row " + rowNum + ": missing required field 'price'");
            return ImportResult.SKIPPED;
        }

        String idStr = getField(record, "id");
        String sku = getField(record, "sku");

        Product product = null;
        boolean isUpdate = false;

        if (idStr != null && !idStr.isBlank()) {
            try {
                product = productRepository.findById(Long.parseLong(idStr)).orElse(null);
                if (product != null) {
                    isUpdate = true;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        if (product == null) {
            String slug = getField(record, "slug");
            if (slug != null && !slug.isBlank()) {
                product = productRepository.findBySlug(slug).orElse(null);
                if (product != null) {
                    isUpdate = true;
                }
            }
        }

        if (product == null) {
            product = new Product();
        }

        product.setName(name);
        product.setSlug(getField(record, "slug"));
        product.setDescription(getField(record, "description"));
        product.setPrice(new BigDecimal(priceStr));

        String salePrice = getField(record, "salePrice");
        product.setDiscountPrice(salePrice != null && !salePrice.isBlank() ? new BigDecimal(salePrice) : null);

        String stockStr = getField(record, "stock");
        product.setStock(stockStr != null && !stockStr.isBlank() ? Integer.parseInt(stockStr) : 0);

        if (sku != null && !sku.isBlank()) {
            product.setWeight(sku);
        }
        product.setImageUrl(getField(record, "imageUrl"));

        String activeStr = getField(record, "isActive");
        product.setActive(activeStr == null || activeStr.isBlank() || Boolean.parseBoolean(activeStr));

        product.setSeoTitle(getField(record, "metaTitle"));
        product.setSeoDescription(getField(record, "metaDescription"));
        product.setSeoKeywords(getField(record, "metaKeywords"));
        product.setCanonicalUrl(getField(record, "canonicalUrl"));
        product.setOgImageUrl(getField(record, "ogImage"));

        if (categoryIdStr != null && !categoryIdStr.isBlank()) {
            try {
                Optional<Category> cat = categoryRepository.findById(Long.parseLong(categoryIdStr));
                cat.ifPresent(product::setCategory);
            } catch (NumberFormatException ignored) {
            }
        }

        if (product.getCategory() == null && !isUpdate) {
            errors.add("Row " + rowNum + ": missing or invalid categoryId for new product '" + name + "'");
            return ImportResult.SKIPPED;
        }

        productRepository.save(product);
        return isUpdate ? ImportResult.UPDATED : ImportResult.CREATED;
    }

    private enum ImportResult {
        CREATED, UPDATED, SKIPPED
    }

    private String getField(CSVRecord record, String header) {
        try {
            return record.get(header);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
