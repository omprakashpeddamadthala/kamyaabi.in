package com.kamyaabi.service.impl;

import com.kamyaabi.config.ProductImageProperties;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.ProductImage;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.ProductMapper;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductImageRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.service.CloudinaryService;
import com.kamyaabi.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductMapper productMapper;
    private final CloudinaryService cloudinaryService;
    private final ProductImageProperties imageProperties;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              ProductImageRepository productImageRepository,
                              ProductMapper productMapper,
                              CloudinaryService cloudinaryService,
                              ProductImageProperties imageProperties) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
        this.productMapper = productMapper;
        this.cloudinaryService = cloudinaryService;
        this.imageProperties = imageProperties;
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
    public ProductResponse createProduct(ProductRequest request,
                                         List<MultipartFile> images,
                                         int mainImageIndex) {
        log.info("Creating new product: {}", request.getName());
        validateDiscountPrice(request);
        List<MultipartFile> files = images == null ? Collections.emptyList() : images;
        if (files.isEmpty()) {
            throw new BadRequestException("At least one product image is required");
        }
        if (files.size() > imageProperties.getMaxCount()) {
            throw new BadRequestException(
                    "Too many images: max " + imageProperties.getMaxCount() + " per product");
        }
        int mainIndex = Math.max(0, Math.min(mainImageIndex, files.size() - 1));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        List<CloudinaryService.UploadResult> uploaded = new ArrayList<>(files.size());
        try {
            for (MultipartFile file : files) {
                uploaded.add(cloudinaryService.uploadImage(file));
            }
            Product product = productMapper.toEntity(request, category);
            for (int i = 0; i < uploaded.size(); i++) {
                CloudinaryService.UploadResult ur = uploaded.get(i);
                ProductImage img = ProductImage.builder()
                        .imageUrl(ur.secureUrl())
                        .publicId(ur.publicId())
                        .isMain(i == mainIndex)
                        .displayOrder(i)
                        .build();
                product.addImage(img);
            }
            if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
                // keep the legacy column populated for older clients that still read it
                product.setImageUrl(uploaded.get(mainIndex).secureUrl());
            }
            Product saved = productRepository.save(product);
            log.info("Product created with id: {} ({} images)", saved.getId(), uploaded.size());
            return productMapper.toResponse(saved);
        } catch (RuntimeException e) {
            // Rollback: best-effort delete of any already-uploaded assets so they
            // don't linger on Cloudinary after a failed DB save.
            for (CloudinaryService.UploadResult ur : uploaded) {
                cloudinaryService.deleteImage(ur.publicId());
            }
            throw e;
        }
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse updateProduct(Long id,
                                         ProductRequest request,
                                         List<MultipartFile> newImages,
                                         Long mainImageId) {
        log.info("Updating product: {}", id);
        validateDiscountPrice(request);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        productMapper.updateEntity(product, request, category);

        List<MultipartFile> toUpload = newImages == null ? Collections.emptyList() : newImages;
        int existingCount = product.getImages() == null ? 0 : product.getImages().size();
        if (existingCount + toUpload.size() > imageProperties.getMaxCount()) {
            throw new BadRequestException(
                    "Too many images: max " + imageProperties.getMaxCount() + " per product");
        }

        List<CloudinaryService.UploadResult> uploaded = new ArrayList<>(toUpload.size());
        try {
            for (MultipartFile file : toUpload) {
                uploaded.add(cloudinaryService.uploadImage(file));
            }
            int nextOrder = existingCount;
            for (CloudinaryService.UploadResult ur : uploaded) {
                ProductImage img = ProductImage.builder()
                        .imageUrl(ur.secureUrl())
                        .publicId(ur.publicId())
                        .isMain(false)
                        .displayOrder(nextOrder++)
                        .build();
                product.addImage(img);
            }

            if (mainImageId != null) {
                promoteMainImage(product, mainImageId);
            } else if (product.getImages() != null && !product.getImages().isEmpty()
                    && product.getImages().stream().noneMatch(i -> Boolean.TRUE.equals(i.getIsMain()))) {
                // No main yet (e.g. legacy product with only imageUrl just got first image)
                product.getImages().get(0).setIsMain(true);
            }

            Product saved = productRepository.save(product);
            log.info("Product updated: {} (added {} new images)", saved.getId(), uploaded.size());
            return productMapper.toResponse(saved);
        } catch (RuntimeException e) {
            for (CloudinaryService.UploadResult ur : uploaded) {
                cloudinaryService.deleteImage(ur.publicId());
            }
            throw e;
        }
    }

    private void promoteMainImage(Product product, Long mainImageId) {
        ProductImage target = product.getImages().stream()
                .filter(i -> i.getId() != null && i.getId().equals(mainImageId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", mainImageId));
        for (ProductImage img : product.getImages()) {
            img.setIsMain(img == target);
        }
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

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchAdminProducts(String keyword,
                                                     Long categoryId,
                                                     Boolean active,
                                                     Pageable pageable) {
        String kw = keyword == null ? "" : keyword.trim();
        log.debug("Admin product search: keyword='{}' categoryId={} active={}", kw, categoryId, active);
        return productRepository.searchAdmin(kw, categoryId, active, pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getAdminProductById(Long id) {
        log.debug("Admin fetch product by id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(product);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse restoreProduct(Long id) {
        log.info("Restoring product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(true);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse setProductActive(Long id, boolean active) {
        log.info("Toggling product {} active -> {}", id, active);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(active);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "featuredProducts", "productsByCategory"}, allEntries = true)
    public void deleteProductImage(Long productId, Long imageId) {
        log.info("Deleting image {} from product {}", imageId, productId);
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", imageId));
        long remaining = productImageRepository.countByProductId(productId) - 1;
        if (remaining < 1) {
            throw new BadRequestException(
                    "Cannot delete the last image — products must have at least one image");
        }
        boolean wasMain = Boolean.TRUE.equals(image.getIsMain());
        // Cloudinary delete is best-effort — service already logs + swallows failures
        cloudinaryService.deleteImage(image.getPublicId());
        productImageRepository.delete(image);
        if (wasMain) {
            // Promote the first remaining image to main
            List<ProductImage> remainingImages =
                    productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
            if (!remainingImages.isEmpty()) {
                productImageRepository.clearMainFlagForProduct(productId);
                ProductImage newMain = remainingImages.get(0);
                newMain.setIsMain(true);
                productImageRepository.save(newMain);
            }
        }
    }
}
