package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.ProductMapper;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        log.debug("Fetching all active products, page: {}", pageable.getPageNumber());
        return productRepository.findByActiveTrue(pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "productsByCategory", key = "#categoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        log.debug("Fetching products by category: {}", categoryId);
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        log.debug("Searching products with keyword: {}", keyword);
        return productRepository.searchByKeyword(keyword, pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "productById", key = "#id")
    public ProductResponse getProductById(Long id) {
        log.debug("Fetching product by id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "featuredProducts")
    public List<ProductResponse> getFeaturedProducts() {
        log.debug("Fetching featured products");
        return productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @CacheEvict(value = {"products", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product: {}", request.getName());
        validateDiscountPrice(request);
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        Product product = productMapper.toEntity(request, category);
        Product saved = productRepository.save(product);
        log.info("Product created with id: {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product: {}", id);
        validateDiscountPrice(request);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        productMapper.updateEntity(product, request, category);
        Product saved = productRepository.save(product);
        log.info("Product updated: {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    private void validateDiscountPrice(ProductRequest request) {
        if (request.getDiscountPrice() != null
                && request.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                && request.getPrice() != null
                && request.getDiscountPrice().compareTo(request.getPrice()) >= 0) {
            throw new BadRequestException("Discount price must be less than the original price (MRP)");
        }
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Deleting product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Product soft-deleted: {}", id);
    }
}
