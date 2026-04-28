package com.kamyaabi.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.ProductImage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    private ProductMapper mapper;
    private ProductImageMapper imageMapper;
    private Category category;

    @BeforeEach
    void setUp() {
        imageMapper = new ProductImageMapper();
        mapper = new ProductMapper(imageMapper, new ObjectMapper());
        category = Category.builder().id(1L).name("Cashews").build();
    }

    @Test
    void toResponse_withoutImages_usesLegacyImageUrlAsMain() {
        Product product = Product.builder()
                .id(1L).name("P").price(BigDecimal.ONE)
                .imageUrl("http://legacy").category(category)
                .stock(1).active(true).images(new ArrayList<>()).build();

        ProductResponse response = mapper.toResponse(product);

        assertThat(response.getMainImageUrl()).isEqualTo("http://legacy");
        assertThat(response.getImages()).isEmpty();
    }

    @Test
    void toResponse_withMainImage_prefersMainImageUrl() {
        ProductImage a = ProductImage.builder().id(10L).publicId("a").imageUrl("u/a").isMain(false).displayOrder(0).build();
        ProductImage b = ProductImage.builder().id(11L).publicId("b").imageUrl("u/b").isMain(true).displayOrder(1).build();
        Product product = Product.builder()
                .id(1L).name("P").price(BigDecimal.ONE)
                .imageUrl("http://legacy").category(category)
                .stock(1).active(true)
                .images(new ArrayList<>(List.of(a, b)))
                .build();

        ProductResponse response = mapper.toResponse(product);

        assertThat(response.getMainImageUrl()).isEqualTo("u/b");
        assertThat(response.getImages()).hasSize(2);
    }

    @Test
    void toResponse_withImagesButNoMain_usesFirst() {
        ProductImage a = ProductImage.builder().id(10L).publicId("a").imageUrl("u/a").isMain(false).displayOrder(0).build();
        Product product = Product.builder()
                .id(1L).name("P").price(BigDecimal.ONE)
                .imageUrl(null).category(category)
                .stock(1).active(true)
                .images(new ArrayList<>(List.of(a))).build();

        ProductResponse response = mapper.toResponse(product);

        assertThat(response.getMainImageUrl()).isEqualTo("u/a");
    }

    @Test
    void toEntity_mapsFields() {
        ProductRequest request = ProductRequest.builder()
                .name("P").description("d").price(BigDecimal.TEN)
                .discountPrice(BigDecimal.ONE).imageUrl("u").categoryId(1L)
                .stock(5).weight("100").unit("g").active(true).build();

        Product product = mapper.toEntity(request, category);

        assertThat(product.getName()).isEqualTo("P");
        assertThat(product.getCategory()).isSameAs(category);
        assertThat(product.getImageUrl()).isEqualTo("u");
    }

    @Test
    void updateEntity_updatesInPlace() {
        Product product = Product.builder()
                .name("old").price(BigDecimal.ONE).category(category)
                .stock(1).active(true).images(new ArrayList<>()).build();
        ProductRequest request = ProductRequest.builder()
                .name("new").description("d").price(BigDecimal.TEN)
                .imageUrl("u").categoryId(1L)
                .stock(9).weight("1").unit("g").active(false).build();

        mapper.updateEntity(product, request, category);

        assertThat(product.getName()).isEqualTo("new");
        assertThat(product.getStock()).isEqualTo(9);
        assertThat(product.getActive()).isFalse();
    }
}
