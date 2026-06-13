package com.kamyaabi.service.impl;

import com.kamyaabi.entity.*;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCsvServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderCsvServiceImpl orderCsvService;

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

    private String exportToString() throws Exception {
        StringWriter writer = new StringWriter();
        orderCsvService.writeOrdersCsv(writer);
        return writer.toString();
    }

    private Map<String, Object> importFrom(String csv) throws Exception {
        InputStream in = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
        return orderCsvService.importOrders(in);
    }

    @Test
    void writeOrdersCsv_withOrders_shouldStreamCsvWithHeaders() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        String csv = exportToString();
        assertThat(csv).contains("order_id");
        assertThat(csv).contains("product_name");
        assertThat(csv).contains("seo_meta_title");
        assertThat(csv).contains("Almonds");
        assertThat(csv).contains("test@example.com");
    }

    @Test
    void writeOrdersCsv_withNoOrders_shouldReturnHeadersOnly() throws Exception {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        String csv = exportToString();
        assertThat(csv).contains("order_id");
        String[] lines = csv.trim().split("\n");
        assertThat(lines).hasSize(1);
    }

    @Test
    void writeOrdersCsv_orderWithNoItems_shouldStillExportRow() throws Exception {
        Order order = buildOrder(2L);
        order.setItems(new ArrayList<>());
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        String csv = exportToString();
        String[] lines = csv.trim().split("\n");
        assertThat(lines.length).isGreaterThan(1);
    }

    @Test
    void writeOrdersCsv_orderWithNullAddress_shouldExportEmptyAddress() throws Exception {
        Order order = buildOrder(3L);
        order.setShippingAddress(null);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        assertThat(exportToString()).contains("order_id");
    }

    @Test
    void writeOrdersCsv_orderWithNullPayment_shouldExportEmptyPaymentStatus() throws Exception {
        Order order = buildOrder(4L);
        order.setPayment(null);
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        assertThat(exportToString()).contains("4");
    }

    @Test
    void writeOrdersCsv_addressWithAddressLine2_shouldIncludeIt() throws Exception {
        Order order = buildOrder(5L);
        order.getShippingAddress().setAddressLine2("Apt 42");
        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findAllWithDetailsByIdIn(anyList())).thenReturn(List.of(order));

        assertThat(exportToString()).contains("Apt 42");
    }

    @Test
    void importOrders_validFile_shouldUpdateOrder() throws Exception {
        String csv = "order_id,order_status,payment_method,discount,total,coupon_code,shipping_status\n"
                + "1,SHIPPED,COD,50,950,SAVE50,DISPATCHED\n";

        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Map<String, Object> data = importFrom(csv);
        assertThat(data.get("updatedOrders")).isEqualTo(1);
        assertThat(data.get("skippedRows")).isEqualTo(0);
        verify(orderRepository).save(order);
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.SHIPPED);
        assertThat(order.getPaymentMethod()).isEqualTo(Order.PaymentMethod.COD);
    }

    @Test
    void importOrders_missingOrderId_shouldSkipRow() throws Exception {
        Map<String, Object> data = importFrom("order_id,order_status\n,SHIPPED\n");
        assertThat(data.get("skippedRows")).isEqualTo(1);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_invalidOrderId_shouldSkipRow() throws Exception {
        Map<String, Object> data = importFrom("order_id,order_status\nabc,SHIPPED\n");
        assertThat(data.get("skippedRows")).isEqualTo(1);
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid order_id"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_orderNotFound_shouldSkipRow() throws Exception {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> data = importFrom("order_id,order_status\n999,SHIPPED\n");
        assertThat(data.get("skippedRows")).isEqualTo(1);
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("not found"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_invalidStatus_shouldLogErrorButContinue() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Map<String, Object> data = importFrom("order_id,order_status\n1,INVALID_STATUS\n");
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid order_status"));
    }

    @Test
    void importOrders_partialUpdate_shouldOnlyUpdateProvidedFields() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        importFrom("order_id,courier_name,awb_number\n1,FedEx,AWB999\n");
        assertThat(order.getCourierName()).isEqualTo("FedEx");
        assertThat(order.getAwbNumber()).isEqualTo("AWB999");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
    }

    @Test
    void importOrders_emptyFile_shouldReturnZeroCounts() throws Exception {
        Map<String, Object> data = importFrom("order_id,order_status\n");
        assertThat(data.get("totalRows")).isEqualTo(0);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
    }

    @Test
    void importOrders_noModifications_shouldSkipRow() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Map<String, Object> data = importFrom("order_id\n1\n");
        assertThat(data.get("skippedRows")).isEqualTo(1);
        assertThat(data.get("updatedOrders")).isEqualTo(0);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_invalidDiscount_shouldLogError() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Map<String, Object> data = importFrom("order_id,discount\n1,not-a-number\n");
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid discount"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_invalidTotal_shouldLogError() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Map<String, Object> data = importFrom("order_id,total\n1,xyz\n");
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid total"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void importOrders_invalidPaymentMethod_shouldLogError() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Map<String, Object> data = importFrom("order_id,payment_method\n1,BITCOIN\n");
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).anyMatch(e -> e.contains("invalid payment_method"));
    }

    @Test
    void importOrders_invoiceNumber_shouldUpdate() throws Exception {
        Order order = buildOrder(1L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        importFrom("order_id,invoice_number\n1,INV-999\n");
        assertThat(order.getInvoiceNumber()).isEqualTo("INV-999");
    }
}
