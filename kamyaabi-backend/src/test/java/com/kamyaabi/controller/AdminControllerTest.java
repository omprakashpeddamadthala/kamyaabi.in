package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.request.OrderStatusRequest;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.service.CategoryService;
import com.kamyaabi.service.OrderService;
import com.kamyaabi.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock private ProductService productService;
    @Mock private CategoryService categoryService;
    @Mock private OrderService orderService;

    @InjectMocks private AdminController adminController;

    @Test
    void createProduct_shouldReturn201() {
        ProductRequest request = ProductRequest.builder().name("Cashews").price(new BigDecimal("899.00"))
                .categoryId(1L).stock(100).build();
        ProductResponse productResponse = ProductResponse.builder().id(1L).name("Cashews").build();
        MultipartFile file = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[]{1});
        when(productService.createProduct(eq(request), any(), eq(0))).thenReturn(productResponse);

        ResponseEntity<?> response = adminController.createProduct(request, List.of(file), 0);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updateProduct_shouldReturn200() {
        ProductRequest request = ProductRequest.builder().name("Updated").price(new BigDecimal("999.00"))
                .categoryId(1L).stock(50).build();
        ProductResponse productResponse = ProductResponse.builder().id(1L).name("Updated").build();
        when(productService.updateProduct(eq(1L), eq(request), any(), isNull())).thenReturn(productResponse);

        ResponseEntity<?> response = adminController.updateProduct(1L, request, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void updateProduct_withNewImagesAndMainId_shouldPassThroughToService() {
        ProductRequest request = ProductRequest.builder().name("Updated").price(new BigDecimal("999.00"))
                .categoryId(1L).stock(50).build();
        ProductResponse productResponse = ProductResponse.builder().id(1L).name("Updated").build();
        MultipartFile file = new MockMultipartFile("images", "b.jpg", "image/jpeg", new byte[]{1});
        when(productService.updateProduct(eq(1L), eq(request), any(), eq(7L))).thenReturn(productResponse);

        ResponseEntity<?> response = adminController.updateProduct(1L, request, List.of(file), 7L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(productService).updateProduct(eq(1L), eq(request), any(), eq(7L));
    }

    @Test
    void deleteProduct_shouldReturn200() {
        ResponseEntity<?> response = adminController.deleteProduct(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(productService).deleteProduct(1L);
    }

    @Test
    void deleteProductImage_shouldReturn200() {
        ResponseEntity<?> response = adminController.deleteProductImage(1L, 10L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(productService).deleteProductImage(1L, 10L);
    }

    @Test
    void createCategory_shouldReturn201() {
        CategoryRequest request = CategoryRequest.builder().name("Cashews").description("Premium").build();
        CategoryResponse categoryResponse = CategoryResponse.builder().id(1L).name("Cashews").build();
        when(categoryService.createCategory(request)).thenReturn(categoryResponse);

        ResponseEntity<?> response = adminController.createCategory(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updateCategory_shouldReturn200() {
        CategoryRequest request = CategoryRequest.builder().name("Updated").description("Updated").build();
        CategoryResponse categoryResponse = CategoryResponse.builder().id(1L).name("Updated").build();
        when(categoryService.updateCategory(1L, request)).thenReturn(categoryResponse);

        ResponseEntity<?> response = adminController.updateCategory(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deleteCategory_shouldReturn200() {
        ResponseEntity<?> response = adminController.deleteCategory(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(categoryService).deleteCategory(1L);
    }

    @Test
    void getAllOrders_shouldReturnPage() {
        Page<OrderResponse> page = new PageImpl<>(List.of(OrderResponse.builder().id(1L).build()));
        when(orderService.getAllOrders(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = adminController.getAllOrders(0, 10, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getAllOrders_withStatusFilter_shouldReturnFilteredPage() {
        Page<OrderResponse> page = new PageImpl<>(List.of(OrderResponse.builder().id(1L).status("PAID").build()));
        when(orderService.getOrdersByStatus(eq(Order.OrderStatus.PAID), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = adminController.getAllOrders(0, 10, "PAID");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(orderService).getOrdersByStatus(eq(Order.OrderStatus.PAID), any(Pageable.class));
    }

    @Test
    void getAllOrders_withInvalidStatus_shouldReturnAllOrders() {
        Page<OrderResponse> page = new PageImpl<>(List.of(OrderResponse.builder().id(1L).build()));
        when(orderService.getAllOrders(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = adminController.getAllOrders(0, 10, "INVALID_STATUS");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(orderService).getAllOrders(any(Pageable.class));
    }

    @Test
    void updateOrderStatus_shouldReturn200() {
        OrderStatusRequest request = new OrderStatusRequest();
        request.setStatus(Order.OrderStatus.CONFIRMED);
        OrderResponse orderResponse = OrderResponse.builder().id(1L).status("CONFIRMED").build();
        when(orderService.updateOrderStatus(1L, Order.OrderStatus.CONFIRMED)).thenReturn(orderResponse);

        ResponseEntity<?> response = adminController.updateOrderStatus(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
