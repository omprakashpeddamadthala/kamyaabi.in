package com.kamyaabi.email;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.entity.*;
import com.kamyaabi.event.OrderEventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateEngineTest {

    private EmailTemplateEngine templateEngine;
    private Order order;
    private User user;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        appProperties.setFrontendUrl("https://kamyaabi.in");
        templateEngine = new EmailTemplateEngine(appProperties);

        user = User.builder()
                .id(1L).email("test@kamyaabi.in").name("Test User").role(User.Role.USER)
                .build();

        Address address = Address.builder()
                .id(1L).user(user).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("Maharashtra").pincode("400001")
                .build();

        Product product = Product.builder()
                .id(1L).name("Premium Cashews").price(new BigDecimal("899.00"))
                .discountPrice(new BigDecimal("749.00")).stock(100)
                .category(Category.builder().id(1L).name("Cashews").build())
                .build();

        OrderItem orderItem = OrderItem.builder()
                .id(1L).product(product).quantity(2).price(new BigDecimal("749.00"))
                .build();

        order = Order.builder()
                .id(100L).user(user).shippingAddress(address)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>(List.of(orderItem)))
                .createdAt(LocalDateTime.of(2026, 3, 29, 10, 30))
                .build();
        orderItem.setOrder(order);
    }

    @Test
    void getSubject_orderPlaced_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_PLACED, order);
        assertThat(subject).contains("Order Confirmed").contains("#100").contains("Kamyaabi");
    }

    @Test
    void getSubject_orderConfirmed_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_CONFIRMED, order);
        assertThat(subject).contains("Payment Received").contains("#100");
    }

    @Test
    void getSubject_orderShipped_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_SHIPPED, order);
        assertThat(subject).contains("Shipped").contains("#100");
    }

    @Test
    void getSubject_orderDelivered_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_DELIVERED, order);
        assertThat(subject).contains("Delivered").contains("#100");
    }

    @Test
    void getSubject_orderCancelled_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_CANCELLED, order);
        assertThat(subject).contains("Cancelled").contains("#100");
    }

    @Test
    void getSubject_orderFailed_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_FAILED, order);
        assertThat(subject).contains("Failed").contains("#100");
    }

    @Test
    void getSubject_orderProcessing_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.ORDER_PROCESSING, order);
        assertThat(subject).contains("Processed").contains("#100");
    }

    @Test
    void getAdminSubject_shouldPrependAdminPrefix() {
        String subject = templateEngine.getAdminSubject(OrderEventType.ORDER_PLACED, order);
        assertThat(subject).startsWith("[Admin]");
    }

    @Test
    void renderCustomerEmail_orderPlaced_shouldContainOrderDetails() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("Test User");
        assertThat(html).contains("#100");
        assertThat(html).contains("Premium Cashews");
        assertThat(html).contains("1,498.00");
    }

    @Test
    void renderCustomerEmail_orderConfirmed_shouldContainPaymentInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_CONFIRMED, order);
        assertThat(html).contains("Payment Received");
        assertThat(html).contains("Test User");
    }

    @Test
    void renderCustomerEmail_orderShipped_shouldContainShippedInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_SHIPPED, order);
        assertThat(html).contains("Shipped");
        assertThat(html).contains("on its way");
    }

    @Test
    void renderCustomerEmail_orderDelivered_shouldContainDeliveryInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_DELIVERED, order);
        assertThat(html).contains("Delivered");
    }

    @Test
    void renderCustomerEmail_orderCancelled_shouldContainCancelInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_CANCELLED, order);
        assertThat(html).contains("Cancelled");
    }

    @Test
    void renderCustomerEmail_orderFailed_shouldContainFailureInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_FAILED, order);
        assertThat(html).contains("Failed");
        assertThat(html).contains("refund");
    }

    @Test
    void renderCustomerEmail_orderProcessing_shouldContainProcessingInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PROCESSING, order);
        assertThat(html).contains("Being Processed");
    }

    @Test
    void renderAdminEmail_shouldContainAdminDetails() {
        String html = templateEngine.renderAdminEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("Admin");
        assertThat(html).contains("test@kamyaabi.in");
        assertThat(html).contains("Test User");
        assertThat(html).contains("#100");
    }

    @Test
    void renderCustomerEmail_orderWithNullAddress_shouldNotBreak() {
        order.setShippingAddress(null);
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("#100");
    }

    @Test
    void renderCustomerEmail_orderWithNullCreatedAt_shouldShowNA() {
        order.setCreatedAt(null);
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("N/A");
    }

    @Test
    void renderCustomerEmail_orderWithEmptyItems_shouldStillRender() {
        order.setItems(new ArrayList<>());
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("#100");
    }

    @Test
    void renderCustomerEmail_orderWithNullItems_shouldStillRender() {
        order.setItems(null);
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("#100");
    }

    @Test
    void getSubject_paymentSuccess_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order);
        assertThat(subject).contains("Payment Successful").contains("#100");
    }

    @Test
    void getSubject_paymentPending_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.PAYMENT_PENDING, order);
        assertThat(subject).contains("Payment Pending").contains("#100");
    }

    @Test
    void getSubject_paymentFailed_shouldReturnCorrectSubject() {
        String subject = templateEngine.getSubject(OrderEventType.PAYMENT_FAILED, order);
        assertThat(subject).contains("Payment Failed").contains("#100");
    }

    @Test
    void renderCustomerEmail_paymentSuccess_shouldContainSuccessInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order);
        assertThat(html).contains("Payment Successful");
        assertThat(html).contains("Test User");
    }

    @Test
    void renderCustomerEmail_paymentPending_shouldContainPendingInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_PENDING, order);
        assertThat(html).contains("Payment Pending");
    }

    @Test
    void renderCustomerEmail_paymentFailed_shouldContainFailureInfo() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_FAILED, order);
        assertThat(html).contains("Payment Failed");
        assertThat(html).contains("refund");
    }

    @Test
    void escapeHtml_shouldEscapeSpecialCharacters() {
        assertThat(templateEngine.escapeHtml("<script>alert('xss')</script>"))
                .doesNotContain("<script>")
                .contains("&lt;script&gt;");
    }

    @Test
    void escapeHtml_nullInput_shouldReturnEmpty() {
        assertThat(templateEngine.escapeHtml(null)).isEmpty();
    }

    @Test
    void renderCustomerEmail_shouldProduceValidHtml() {
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).startsWith("<!DOCTYPE html>");
        assertThat(html).contains("</html>");
    }

    @Test
    void renderCustomerEmail_allOrderEvents_shouldContainViewOrderStatusLink() {
        OrderEventType[] events = {
                OrderEventType.ORDER_PLACED,
                OrderEventType.ORDER_CONFIRMED,
                OrderEventType.ORDER_PROCESSING,
                OrderEventType.ORDER_SHIPPED,
                OrderEventType.ORDER_DELIVERED,
                OrderEventType.ORDER_CANCELLED,
                OrderEventType.ORDER_FAILED,
                OrderEventType.PAYMENT_SUCCESS,
                OrderEventType.PAYMENT_PENDING,
                OrderEventType.PAYMENT_FAILED,
        };
        for (OrderEventType event : events) {
            String html = templateEngine.renderCustomerEmail(event, order);
            assertThat(html)
                    .as("event %s should include the deep link to /orders/{id}", event)
                    .contains("View Order Status")
                    .contains("https://kamyaabi.in/orders/100");
        }
    }

    @Test
    void renderCustomerEmail_frontendUrlWithTrailingSlash_shouldNormalize() {
        AppProperties props = new AppProperties();
        props.setFrontendUrl("https://kamyaabi.in/");
        EmailTemplateEngine engine = new EmailTemplateEngine(props);
        String html = engine.renderCustomerEmail(OrderEventType.ORDER_SHIPPED, order);
        assertThat(html).contains("https://kamyaabi.in/orders/100");
        assertThat(html).doesNotContain("kamyaabi.in//orders");
    }

    @Test
    void renderCustomerEmail_orderWithNullTotalAmount_shouldHandleGracefully() {
        order.setTotalAmount(null);
        String html = templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order);
        assertThat(html).contains("0.00");
    }
}
