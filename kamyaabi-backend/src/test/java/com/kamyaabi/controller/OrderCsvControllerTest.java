package com.kamyaabi.controller;

import com.kamyaabi.entity.*;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCsvControllerTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderCsvController orderCsvController;

    private Order buildOrder(Long id) {
        User user = User.builder().id(100L).email("test@example.com").name("Test User").build();
        Address addr = Address.builder()
                .id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("MH").pincode("400001")
                .build();
        Category category = Category.builder().id(1L).name("Nuts").build();
        Product product = Product.builder()
                .id(10L).name("Almonds").slug("almonds").price(new BigDecimal("500"))
                .weight("250").unit("g").imageUrl("https://cdn.example.com/almonds.jpg")
                .category(category)
                .seoTitle("Buy Almonds").seoDescription("Premium almonds")
                .canonicalUrl("https://kamyaabi.in/almonds").ogImageUrl("https://cdn.example.com/almonds-og.jpg")
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L).product(product).quantity(2)
                .price(new BigDecimal("500")).weightKg(new BigDecimal("0.5"))
                .build();

        Payment payment = Payment.builder()
                .id(1L).amount(new BigDecimal("1000"))
                .status(Payment.PaymentStatus.COMPLETED)
                .razorpayOrderId("rp_123").razorpayPaymentId("pay_123")
                .build();

        Order order = Order.builder()
                .id(id).user(user).shippingAddress(addr)
                .totalAmount(new BigDecimal("1000"))
                .discountAmount(BigDecimal.ZERO)
                .status(Order.OrderStatus.PAID)
                .paymentMethod(Order.PaymentMethod.PREPAID)
                .payment(payment)
                .couponCode("SAVE10")
                .invoiceNumber("INV-001")
                .shiprocketOrderId("SR-001")
                .awbNumber("AWB123")
                .courierName("BlueDart")
                .shippingStatus("IN_TRANSIT")
                .createdAt(LocalDateTime.of(2026, 1, 15, 10, 30))
                .build();

        item.setOrder(order);
        order.setItems(new ArrayList<>(List.of(item)));
        return order;
    }

    @Test
    void exportCsv_withOrders_shouldStreamCsvWithHeaders() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        assertThat(response.getHeader("Content-Disposition")).contains("orders_export_");
        String csv = response.getContentAsString();
        assertThat(csv).contains("order_id");
        assertThat(csv).contains("product_name");
        assertThat(csv).contains("seo_meta_title");
        assertThat(csv).contains("Almonds");
        assertThat(csv).contains("test@example.com");
    }

    @Test
    void exportCsv_withNoOrders_shouldReturnHeadersOnly() throws Exception {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        String csv = response.getContentAsString();
        assertThat(csv).contains("order_id");
        String[] lines = csv.trim().split("\n");
        assertThat(lines).hasSize(1);
    }

    @Test
    void exportCsv_orderWithNoItems_shouldStillExportRow() throws Exception {
        Order order = buildOrder(2L);
        order.setItems(new ArrayList<>());
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        String csv = response.getContentAsString();
        String[] lines = csv.trim().split("\n");
        assertThat(lines.length).isGreaterThan(1);
    }

    @Test
    void exportCsv_orderWithNullAddress_shouldExportEmptyAddress() throws Exception {
        Order order = buildOrder(3L);
        order.setShippingAddress(null);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        assertThat(response.getContentAsString()).contains("order_id");
    }

    @Test
    void exportCsv_orderWithNullPayment_shouldExportEmptyPaymentStatus() throws Exception {
        Order order = buildOrder(4L);
        order.setPayment(null);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        assertThat(response.getContentAsString()).contains("4");
    }

    @Test
    void importCsv_validFile_shouldUpdateOrder() throws Exception {
        String csv = "order_id,order_status,payment_method,discount,total,coupon_code,shipping_status\n"
                + "1,SHIPPED,COD,50,950,SAVE50,DISPATCHED\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("updatedOrders")).isEqualTo(1);
        assertThat(data.get("skippedRows")).isEqualTo(0);
        verify(orderRepository).save(order);
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.SHIPPED);
        assertThat(order.getPaymentMethod()).isEqualTo(Order.PaymentMethod.COD);
    }

    @Test
    void importCsv_missingOrderId_shouldSkipRow() throws Exception {
        String csv = "order_id,order_status\n,SHIPPED\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("skippedRows")).isEqualTo(1);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
    }

    @Test
    void importCsv_invalidOrderId_shouldSkipRow() throws Exception {
        String csv = "order_id,order_status\nabc,SHIPPED\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("skippedRows")).isEqualTo(1);
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid order_id"));
    }

    @Test
    void importCsv_orderNotFound_shouldSkipRow() throws Exception {
        String csv = "order_id,order_status\n999,SHIPPED\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("skippedRows")).isEqualTo(1);
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("not found"));
    }

    @Test
    void importCsv_invalidStatus_shouldLogErrorButContinue() throws Exception {
        String csv = "order_id,order_status\n1,INVALID_STATUS\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid order_status"));
    }

    @Test
    void importCsv_partialUpdate_shouldOnlyUpdateProvidedFields() throws Exception {
        String csv = "order_id,courier_name,awb_number\n1,FedEx,AWB999\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderCsvController.importCsv(file);

        assertThat(order.getCourierName()).isEqualTo("FedEx");
        assertThat(order.getAwbNumber()).isEqualTo("AWB999");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
    }

    @Test
    void importCsv_emptyFile_shouldReturnZeroCounts() throws Exception {
        String csv = "order_id,order_status\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("totalRows")).isEqualTo(0);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
    }

    @Test
    void importCsv_noModifications_shouldSkipRow() throws Exception {
        String csv = "order_id\n1\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        assertThat(data.get("skippedRows")).isEqualTo(1);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void importCsv_invalidDiscount_shouldLogError() throws Exception {
        String csv = "order_id,discount\n1,not-a-number\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid discount"));
    }

    @Test
    void importCsv_invalidTotal_shouldLogError() throws Exception {
        String csv = "order_id,total\n1,xyz\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid total"));
    }

    @Test
    void importCsv_invalidPaymentMethod_shouldLogError() throws Exception {
        String csv = "order_id,payment_method\n1,BITCOIN\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        var response = orderCsvController.importCsv(file);
        var body = response.getBody();

        assertThat(body).isNotNull();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) body.data();
        @SuppressWarnings("unchecked")
        java.util.List<String> errors = (java.util.List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid payment_method"));
    }

    @Test
    void importCsv_invoiceNumber_shouldUpdate() throws Exception {
        String csv = "order_id,invoice_number\n1,INV-999\n";
        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderCsvController.importCsv(file);

        assertThat(order.getInvoiceNumber()).isEqualTo("INV-999");
    }

    @Test
    void exportCsv_addressWithAddressLine2_shouldIncludeIt() throws Exception {
        Order order = buildOrder(5L);
        order.getShippingAddress().setAddressLine2("Apt 42");
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        MockHttpServletResponse response = new MockHttpServletResponse();
        orderCsvController.exportCsv(response);

        assertThat(response.getContentAsString()).contains("Apt 42");
    }
}
