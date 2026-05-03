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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private ProductMapper productMapper;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private ReviewRepository reviewRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private OrderItemRepository orderItemRepository;

    private ProductImageProperties imageProperties;

    @InjectMocks private ProductServiceImpl productService;

    private Product product;
    private Category category;
    private ProductResponse productResponse;
    private ProductRequest productRequest;
    private MultipartFile image;

    @BeforeEach
    void setUp() {
        imageProperties = new ProductImageProperties();
        productService = new ProductServiceImpl(productRepository, categoryRepository,
                productImageRepository, productMapper, cloudinaryService, imageProperties,
                reviewRepository, cartItemRepository, orderItemRepository);

        category = Category.builder().id(1L).name("Cashews").build();
        product = Product.builder()
                .id(1L).name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img.url").category(category)
                .stock(100).weight("500").unit("gm").active(true)
                .images(new ArrayList<>())
                .build();
        productResponse = ProductResponse.builder()
                .id(1L).name("Whole Cashews").price(new BigDecimal("899.00"))
                .categoryId(1L).categoryName("Cashews").stock(100).active(true)
                .build();
        productRequest = ProductRequest.builder()
                .name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).categoryId(1L)
                .stock(100).weight("500").unit("gm").active(true)
                .build();
        image = new MockMultipartFile(
                "images", "photo.jpg", "image/jpeg", new byte[] {1, 2, 3});
    }

    @Test
    void getAllProducts_shouldReturnPageOfProducts() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.findByActiveTrue(pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.getAllProducts(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Whole Cashews");
    }

    @Test
    void getProductsByCategory_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.findByCategoryIdAndActiveTrue(1L, pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.getProductsByCategory(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchProducts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.searchByKeyword("cashew", pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.searchProducts("cashew", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getProductById_existing_shouldReturnProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.getProductById(1L);

        assertThat(result.name()).isEqualTo("Whole Cashews");
    }

    @Test
    void getProductById_notFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFeaturedProducts_shouldReturnList() {
        when(productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        List<ProductResponse> result = productService.getFeaturedProducts();

        assertThat(result).hasSize(1);
    }

    @Test
    void createProduct_shouldUploadImagesAndReturnCreatedProduct() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://res.cloudinary.com/x/image/upload/v1/a.jpg", "a"));
        when(productMapper.toEntity(productRequest, category)).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.createProduct(productRequest, List.of(image), 0);

        assertThat(result.name()).isEqualTo("Whole Cashews");
        verify(cloudinaryService).uploadImage(any());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createProduct_withoutImages_shouldThrowBadRequest() {
        assertThatThrownBy(() -> productService.createProduct(productRequest, Collections.emptyList(), 0))
                .isInstanceOf(BadRequestException.class);
        verify(cloudinaryService, never()).uploadImage(any());
    }

    @Test
    void createProduct_tooManyImages_shouldThrowBadRequest() {
        imageProperties.setMaxCount(1);
        productService = new ProductServiceImpl(productRepository, categoryRepository,
                productImageRepository, productMapper, cloudinaryService, imageProperties,
                reviewRepository, cartItemRepository, orderItemRepository);
        List<MultipartFile> many = List.of(image, image);

        assertThatThrownBy(() -> productService.createProduct(productRequest, many, 0))
                .isInstanceOf(BadRequestException.class);
        verify(cloudinaryService, never()).uploadImage(any());
    }

    @Test
    void createProduct_categoryNotFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());
        ProductRequest withMissingCategory = ProductRequest.builder()
                .name(productRequest.name()).description(productRequest.description())
                .price(productRequest.price()).categoryId(999L)
                .stock(productRequest.stock()).weight(productRequest.weight())
                .unit(productRequest.unit()).active(productRequest.active())
                .build();

        assertThatThrownBy(() -> productService.createProduct(withMissingCategory, List.of(image), 0))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createProduct_discountPriceTooHigh_shouldThrowBadRequest() {
        ProductRequest equalDiscount = ProductRequest.builder()
                .name(productRequest.name()).description(productRequest.description())
                .price(new BigDecimal("100")).discountPrice(new BigDecimal("100"))
                .categoryId(productRequest.categoryId()).stock(productRequest.stock())
                .weight(productRequest.weight()).unit(productRequest.unit())
                .active(productRequest.active())
                .build();

        assertThatThrownBy(() -> productService.createProduct(equalDiscount, List.of(image), 0))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createProduct_whenSaveFails_shouldRollbackCloudinaryUploads() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://u/a.jpg", "pid-a"));
        when(productMapper.toEntity(productRequest, category)).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenThrow(new RuntimeException("db down"));

        assertThatThrownBy(() -> productService.createProduct(productRequest, List.of(image), 0))
                .isInstanceOf(RuntimeException.class);
        verify(cloudinaryService).deleteImage("pid-a");
    }

    @Test
    void updateProduct_shouldReturnUpdatedProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.updateProduct(1L, productRequest, Collections.emptyList(), null);

        assertThat(result.name()).isEqualTo("Whole Cashews");
        verify(productMapper).updateEntity(product, productRequest, category);
    }

    @Test
    void updateProduct_withNewImages_shouldAppendImages() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://u/b.jpg", "pid-b"));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        productService.updateProduct(1L, productRequest, List.of(image), null);

        assertThat(product.getImages()).hasSize(1);
        assertThat(product.getImages().get(0).getPublicId()).isEqualTo("pid-b");
        assertThat(product.getImages().get(0).getIsMain()).isTrue();
    }

    @Test
    void updateProduct_withMainImageId_shouldPromoteThatImage() {
        ProductImage a = ProductImage.builder().id(10L).publicId("a").imageUrl("u/a").isMain(true).displayOrder(0).build();
        ProductImage b = ProductImage.builder().id(11L).publicId("b").imageUrl("u/b").isMain(false).displayOrder(1).build();
        product.getImages().add(a);
        product.getImages().add(b);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        productService.updateProduct(1L, productRequest, Collections.emptyList(), 11L);

        assertThat(a.getIsMain()).isFalse();
        assertThat(b.getIsMain()).isTrue();
    }

    @Test
    void updateProduct_mainImageIdNotFound_shouldThrow() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> productService.updateProduct(1L, productRequest, Collections.emptyList(), 9999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProduct_tooManyImages_shouldThrowBadRequest() {
        imageProperties.setMaxCount(1);
        productService = new ProductServiceImpl(productRepository, categoryRepository,
                productImageRepository, productMapper, cloudinaryService, imageProperties,
                reviewRepository, cartItemRepository, orderItemRepository);
        product.getImages().add(ProductImage.builder().id(10L).publicId("a").imageUrl("u/a").isMain(true).displayOrder(0).build());
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> productService.updateProduct(1L, productRequest, List.of(image), null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateProduct_productNotFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.updateProduct(999L, productRequest, Collections.emptyList(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProduct_categoryNotFound_shouldThrowException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.updateProduct(1L, productRequest, Collections.emptyList(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteProduct_shouldHardDeleteAndCleanCloudinary() {
        ProductImage img1 = ProductImage.builder().id(10L).publicId("pid-1").imageUrl("u1").isMain(true).displayOrder(0).build();
        ProductImage img2 = ProductImage.builder().id(11L).publicId("pid-2").imageUrl("u2").isMain(false).displayOrder(1).build();
        product.getImages().add(img1);
        product.getImages().add(img2);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cloudinaryService.deleteImage(any())).thenReturn(true);
        when(reviewRepository.deleteAllByProductId(1L)).thenReturn(2);
        when(cartItemRepository.deleteAllByProductId(1L)).thenReturn(1);
        when(orderItemRepository.deleteAllByProductId(1L)).thenReturn(0);

        productService.deleteProduct(1L);

        verify(cloudinaryService).deleteImage("pid-1");
        verify(cloudinaryService).deleteImage("pid-2");
        verify(reviewRepository).deleteAllByProductId(1L);
        verify(cartItemRepository).deleteAllByProductId(1L);
        verify(orderItemRepository).deleteAllByProductId(1L);
        verify(productRepository).delete(product);
    }

    @Test
    void deleteProduct_shouldContinueWhenCloudinaryFails() {
        ProductImage img = ProductImage.builder().id(10L).publicId("pid-1").imageUrl("u1").isMain(true).displayOrder(0).build();
        product.getImages().add(img);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cloudinaryService.deleteImage("pid-1")).thenThrow(new RuntimeException("network"));

        productService.deleteProduct(1L);

        verify(productRepository).delete(product);
    }

    @Test
    void deleteProduct_shouldSkipImagesWithoutPublicId() {
        ProductImage img = ProductImage.builder().id(10L).publicId(null).imageUrl("u1").isMain(true).displayOrder(0).build();
        product.getImages().add(img);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        productService.deleteProduct(1L);

        verify(cloudinaryService, never()).deleteImage(any());
        verify(productRepository).delete(product);
    }

    @Test
    void deleteProduct_shouldLogWhenCloudinaryReturnsFalse() {
        ProductImage img = ProductImage.builder().id(10L).publicId("pid-1").imageUrl("u1").isMain(true).displayOrder(0).build();
        product.getImages().add(img);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cloudinaryService.deleteImage("pid-1")).thenReturn(false);

        productService.deleteProduct(1L);

        verify(productRepository).delete(product);
    }

    @Test
    void deleteProduct_notFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.deleteProduct(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteProductImage_shouldRemoveFromCloudinaryAndDb() {
        ProductImage img = ProductImage.builder().id(10L).publicId("pid").imageUrl("u").isMain(false).displayOrder(1).build();
        when(productImageRepository.findByIdAndProductId(10L, 1L)).thenReturn(Optional.of(img));
        when(productImageRepository.countByProductId(1L)).thenReturn(3L);

        productService.deleteProductImage(1L, 10L);

        verify(cloudinaryService).deleteImage("pid");
        verify(productImageRepository).delete(img);
    }

    @Test
    void deleteProductImage_whenLastImage_shouldThrowBadRequest() {
        ProductImage img = ProductImage.builder().id(10L).publicId("pid").imageUrl("u").isMain(true).displayOrder(0).build();
        when(productImageRepository.findByIdAndProductId(10L, 1L)).thenReturn(Optional.of(img));
        when(productImageRepository.countByProductId(1L)).thenReturn(1L);

        assertThatThrownBy(() -> productService.deleteProductImage(1L, 10L))
                .isInstanceOf(BadRequestException.class);
        verify(cloudinaryService, never()).deleteImage(any());
    }

    @Test
    void deleteProductImage_whenMainImage_shouldPromoteAnotherImage() {
        ProductImage main = ProductImage.builder().id(10L).publicId("pid").imageUrl("u").isMain(true).displayOrder(0).build();
        ProductImage next = ProductImage.builder().id(11L).publicId("pid2").imageUrl("u2").isMain(false).displayOrder(1).build();
        when(productImageRepository.findByIdAndProductId(10L, 1L)).thenReturn(Optional.of(main));
        when(productImageRepository.countByProductId(1L)).thenReturn(2L);
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(next));

        productService.deleteProductImage(1L, 10L);

        verify(productImageRepository).clearMainFlagForProduct(1L);
        verify(productImageRepository).save(next);
        assertThat(next.getIsMain()).isTrue();
    }

    @Test
    void deleteProductImage_notFound_shouldThrow() {
        when(productImageRepository.findByIdAndProductId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.deleteProductImage(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
