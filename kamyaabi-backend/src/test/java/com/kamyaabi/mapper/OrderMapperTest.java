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

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("1498.00"));
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.shippingAddress()).isNotNull();
        assertThat(response.shippingAddress().fullName()).isEqualTo("Test");
        assertThat(response.items()).hasSize(1);
    }

    @Test
    void toResponse_nullAddressAndPayment_shouldHandleGracefully() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>()).build();

        OrderResponse response = orderMapper.toResponse(order);

        assertThat(response.shippingAddress()).isNull();
        assertThat(response.payment()).isNull();
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

        assertThat(response.payment()).isNotNull();
        assertThat(response.payment().razorpayOrderId()).isEqualTo("order_123");
        assertThat(response.payment().status()).isEqualTo("COMPLETED");
    }

    @Test
    void toItemResponse_shouldMapAllFields() {
        Product product = Product.builder().id(1L).name("Cashews").imageUrl("http://img.url").build();
        OrderItem item = OrderItem.builder().id(1L).product(product).quantity(2)
                .price(new BigDecimal("749.00")).build();

        OrderItemResponse response = orderMapper.toItemResponse(item);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.productId()).isEqualTo(1L);
        assertThat(response.productName()).isEqualTo("Cashews");
        assertThat(response.quantity()).isEqualTo(2);
        assertThat(response.price()).isEqualByComparingTo(new BigDecimal("749.00"));
        assertThat(response.subtotal()).isEqualByComparingTo(new BigDecimal("1498.00"));
    }
}
