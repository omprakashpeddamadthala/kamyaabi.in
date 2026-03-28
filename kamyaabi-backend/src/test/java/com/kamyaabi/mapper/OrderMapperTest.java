package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.OrderItemResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMapperTest {

    private OrderMapper orderMapper;

    @BeforeEach
    void setUp() {
        AddressMapper addressMapper = new AddressMapper();
        PaymentMapper paymentMapper = new PaymentMapper();
        orderMapper = new OrderMapper(addressMapper, paymentMapper);
    }

    @Test
    void toResponse_shouldMapAllFields() {
        User user = User.builder().id(1L).email("test@kamyaabi.in").build();
        Address address = Address.builder().id(1L).user(user).fullName("Test").phone("123")
                .street("St").city("City").state("State").pincode("123456").isDefault(false).build();
        Product product = Product.builder().id(1L).name("Cashews").imageUrl("http://img.url").build();
        OrderItem orderItem = OrderItem.builder().id(1L).product(product).quantity(2)
                .price(new BigDecimal("749.00")).build();
        Order order = Order.builder().id(1L).user(user).shippingAddress(address)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>(List.of(orderItem))).build();

        OrderResponse response = orderMapper.toResponse(order);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1498.00"));
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getShippingAddress()).isNotNull();
        assertThat(response.getShippingAddress().getFullName()).isEqualTo("Test");
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    void toResponse_nullAddressAndPayment_shouldHandleGracefully() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>()).build();

        OrderResponse response = orderMapper.toResponse(order);

        assertThat(response.getShippingAddress()).isNull();
        assertThat(response.getPayment()).isNull();
    }

    @Test
    void toResponse_withPayment_shouldMapPayment() {
        Payment payment = Payment.builder().id(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").amount(new BigDecimal("1498.00"))
                .status(Payment.PaymentStatus.COMPLETED).build();
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.CONFIRMED)
                .payment(payment).items(new ArrayList<>()).build();

        OrderResponse response = orderMapper.toResponse(order);

        assertThat(response.getPayment()).isNotNull();
        assertThat(response.getPayment().getRazorpayOrderId()).isEqualTo("order_123");
        assertThat(response.getPayment().getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void toItemResponse_shouldMapAllFields() {
        Product product = Product.builder().id(1L).name("Cashews").imageUrl("http://img.url").build();
        OrderItem item = OrderItem.builder().id(1L).product(product).quantity(2)
                .price(new BigDecimal("749.00")).build();

        OrderItemResponse response = orderMapper.toItemResponse(item);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getProductId()).isEqualTo(1L);
        assertThat(response.getProductName()).isEqualTo("Cashews");
        assertThat(response.getQuantity()).isEqualTo(2);
        assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("749.00"));
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("1498.00"));
    }
}
