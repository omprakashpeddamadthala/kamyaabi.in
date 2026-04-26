package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.*;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.OrderMapper;
import com.kamyaabi.repository.*;
import com.kamyaabi.service.CartService;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.event.OrderEventType;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private CartService cartService;
    @Mock private OrderEventPublisher orderEventPublisher;

    @InjectMocks private OrderServiceImpl orderService;

    private User user;
    private Address address;
    private Product product;
    private Cart cart;
    private Order order;
    private OrderResponse orderResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("test@kamyaabi.shop").name("Test").role(User.Role.USER).build();
        address = Address.builder().id(1L).user(user).fullName("Test").phone("123").street("St")
                .city("City").state("State").pincode("123456").build();
        product = Product.builder().id(1L).name("Cashews").price(new BigDecimal("899.00"))
                .discountPrice(new BigDecimal("749.00")).stock(100).active(true)
                .category(Category.builder().id(1L).name("Cashews").build()).build();
        CartItem cartItem = CartItem.builder().id(1L).product(product).quantity(2).build();
        cart = Cart.builder().id(1L).user(user).items(new ArrayList<>(List.of(cartItem))).build();
        cartItem.setCart(cart);
        order = Order.builder().id(1L).user(user).shippingAddress(address)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>()).build();
        orderResponse = OrderResponse.builder().id(1L).totalAmount(new BigDecimal("1498.00"))
                .status("PENDING").build();
    }

    @Test
    void createOrder_shouldCreateAndReturn() {
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        OrderResponse result = orderService.createOrder(1L, request);

        assertThat(result.getId()).isEqualTo(1L);
        verify(cartService).clearCart(1L);
        // No email event on order creation — emails sent only after payment verification
        verifyNoInteractions(orderEventPublisher);
    }

    @Test
    void createOrder_userNotFound_shouldThrowException() {
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createOrder_addressNotFound_shouldThrowException() {
        OrderRequest request = OrderRequest.builder().shippingAddressId(999L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createOrder_addressNotBelongToUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Address otherAddress = Address.builder().id(2L).user(otherUser).build();
        OrderRequest request = OrderRequest.builder().shippingAddressId(2L).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not belong");
    }

    @Test
    void createOrder_emptyCart_shouldThrowException() {
        Cart emptyCart = Cart.builder().id(1L).user(user).items(new ArrayList<>()).build();
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(emptyCart));

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void createOrder_noCart_shouldThrowException() {
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createOrder_insufficientStock_shouldThrowException() {
        product.setStock(1);
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void createOrder_productWithoutDiscount_shouldUseRegularPrice() {
        product.setDiscountPrice(null);
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);

        OrderResponse result = orderService.createOrder(1L, request);

        assertThat(result).isNotNull();
    }

    @Test
    void getOrderById_shouldReturnOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        OrderResponse result = orderService.getOrderById(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getOrderById_notFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserOrders_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Order> orderPage = new PageImpl<>(List.of(order));
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(orderPage);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        Page<OrderResponse> result = orderService.getUserOrders(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getAllOrders_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Order> orderPage = new PageImpl<>(List.of(order));
        when(orderRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(orderPage);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        Page<OrderResponse> result = orderService.getAllOrders(pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getOrdersByStatus_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        order.setStatus(Order.OrderStatus.PAID);
        Page<Order> orderPage = new PageImpl<>(List.of(order));
        when(orderRepository.findByStatusOrderByCreatedAtDesc(Order.OrderStatus.PAID, pageable)).thenReturn(orderPage);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        Page<OrderResponse> result = orderService.getOrdersByStatus(Order.OrderStatus.PAID, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(orderRepository).findByStatusOrderByCreatedAtDesc(Order.OrderStatus.PAID, pageable);
    }

    @Test
    void updateOrderStatus_toPaid_shouldSkipEmailEvent() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        orderService.updateOrderStatus(1L, Order.OrderStatus.PAID);

        // PAID status set by admin skips email — payment verification handles this
        verifyNoInteractions(orderEventPublisher);
    }

    @Test
    void updateOrderStatus_toPaymentFailed_shouldPublishPaymentFailedEvent() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        orderService.updateOrderStatus(1L, Order.OrderStatus.PAYMENT_FAILED);

        verify(orderEventPublisher).publishOrderEvent(order, OrderEventType.PAYMENT_FAILED);
    }

    @Test
    void updateOrderStatus_shouldUpdateAndReturn() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toResponse(order)).thenReturn(orderResponse);

        OrderResponse result = orderService.updateOrderStatus(1L, Order.OrderStatus.CONFIRMED);

        assertThat(result).isNotNull();
        verify(orderRepository).save(order);
        verify(orderEventPublisher).publishOrderEvent(order, OrderEventType.ORDER_CONFIRMED);
    }

    @Test
    void updateOrderStatus_notFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateOrderStatus(999L, Order.OrderStatus.CONFIRMED))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
