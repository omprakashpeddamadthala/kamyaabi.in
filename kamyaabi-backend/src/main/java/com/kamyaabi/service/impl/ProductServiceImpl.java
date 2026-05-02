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
import com.kamyaabi.repository.CartItemRepository;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.OrderItemRepository;
import com.kamyaabi.repository.ProductImageRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.repository.ReviewRepository;
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
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGES = Pattern.compile("(^-|-$)");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductMapper productMapper;
    private final CloudinaryService cloudinaryService;
    private final ProductImageProperties imageProperties;
    private final ReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              ProductImageRepository productImageRepository,
                              ProductMapper productMapper,
                              CloudinaryService cloudinaryService,
                              ProductImageProperties imageProperties,
                              ReviewRepository reviewRepository,
                              CartItemRepository cartItemRepository,
                              OrderItemRepository orderItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
        this.productMapper = productMapper;
        this.cloudinaryService = cloudinaryService;
        this.imageProperties = imageProperties;
        this.reviewRepository = reviewRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderItemRepository = orderItemRepository;
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
    @Cacheable(value = "productBySlug", key = "#slug")
    public ProductResponse getProductBySlug(String slug) {
        log.debug("Fetching product by slug: {}", slug);
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product with slug '" + slug + "' not found"));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public String getSlugForId(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        String slug = product.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = resolveSlug(null, product.getName(), product.getId());
            product.setSlug(slug);
            productRepository.save(product);
        }
        return slug;
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
            product.setSlug(resolveSlug(null, request.getName(), null));
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
                product.setImageUrl(uploaded.get(mainIndex).secureUrl());
            }
            Product saved = productRepository.save(product);
            log.info("Product created with id: {} ({} images)", saved.getId(), uploaded.size());
            return productMapper.toResponse(saved);
        } catch (RuntimeException e) {
            for (CloudinaryService.UploadResult ur : uploaded) {
                cloudinaryService.deleteImage(ur.publicId());
            }
            throw e;
        }
    }

    @Override
    @CacheEvict(value = {"products", "productById", "productBySlug", "featuredProducts", "productsByCategory"}, allEntries = true)
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
        String previousName = product.getName();
        productMapper.updateEntity(product, request, category);
        if (product.getSlug() == null || product.getSlug().isBlank()
                || (previousName != null && !previousName.equals(request.getName()))) {
            product.setSlug(resolveSlug(null, request.getName(), product.getId()));
        }

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
    @CacheEvict(value = {"products", "productById", "productBySlug",
            "featuredProducts", "productsByCategory"}, allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Hard-deleting product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        List<ProductImage> images = new ArrayList<>(product.getImages());
        for (ProductImage img : images) {
            String publicId = img.getPublicId();
            if (publicId == null || publicId.isBlank()) continue;
            try {
                boolean deleted = cloudinaryService.deleteImage(publicId);
                if (!deleted) {
                    log.warn("Cloudinary refused delete for publicId={} (product {}); "
                            + "DB record will still be removed.", publicId, id);
                }
            } catch (RuntimeException ex) {
                log.warn("Cloudinary delete threw for publicId={} (product {}); "
                        + "DB record will still be removed.", publicId, id, ex);
            }
        }

        int reviews = reviewRepository.deleteAllByProductId(id);
        int cartItems = cartItemRepository.deleteAllByProductId(id);
        int orderItems = orderItemRepository.deleteAllByProductId(id);
        log.info("Cascade-deleted dependents for product {}: reviews={}, cartItems={}, orderItems={}",
                id, reviews, cartItems, orderItems);

        productRepository.delete(product);
        log.info("Product hard-deleted: {}", id);
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
    @CacheEvict(value = {"products", "productById", "productBySlug", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse restoreProduct(Long id) {
        log.info("Restoring product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(true);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "productBySlug", "featuredProducts", "productsByCategory"}, allEntries = true)
    public ProductResponse setProductActive(Long id, boolean active) {
        log.info("Toggling product {} active -> {}", id, active);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(active);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"products", "productById", "productBySlug", "featuredProducts", "productsByCategory"}, allEntries = true)
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
        cloudinaryService.deleteImage(image.getPublicId());
        productImageRepository.delete(image);
        if (wasMain) {
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

    String resolveSlug(String requested, String name, Long currentId) {
        String base = (requested != null && !requested.isBlank())
                ? requested.trim().toLowerCase(Locale.ROOT)
                : slugify(name);
        if (base.isEmpty()) {
            throw new BadRequestException("Unable to derive slug from product name");
        }
        String candidate = base;
        int suffix = 2;
        while (slugTaken(candidate, currentId)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private boolean slugTaken(String slug, Long currentId) {
        return currentId == null
                ? productRepository.existsBySlug(slug)
                : productRepository.existsBySlugAndIdNot(slug, currentId);
    }

    public static String slugify(String name) {
        if (name == null) return "";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT);
        String dashed = NON_ALPHANUM.matcher(normalized).replaceAll("-");
        return EDGES.matcher(dashed).replaceAll("");
    }
}
