package com.kamyaabi.invoice;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.config.InvoiceProperties;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Payment;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceTemplateRendererTest {

    @Test
    void render_includesProfessionalInvoiceSectionsAndOrderData() {
        InvoiceProperties invoiceProperties = new InvoiceProperties();
        invoiceProperties.setCompanyName("Kamyaabi Test");
        AppProperties appProperties = new AppProperties();
        appProperties.setFrontendUrl("https://kamyaabi.in");
        InvoiceTemplateRenderer renderer = new InvoiceTemplateRenderer(invoiceProperties, appProperties);

        User user = User.builder().id(1L).email("buyer@test.com").name("Buyer").role(User.Role.USER).build();
        Address address = Address.builder().id(1L).user(user).fullName("Buyer Name").phone("9999999999")
                .street("Street 1").city("Hyderabad").state("Telangana").pincode("500001").build();
        Product product = Product.builder().id(44L).name("Cashews").description("Premium cashews")
                .imageUrl("https://cdn.test/cashews.jpg").build();
        OrderItem item = OrderItem.builder().id(10L).product(product).quantity(2)
                .price(new BigDecimal("499.00")).build();
        Payment payment = Payment.builder().razorpayPaymentId("pay_123")
                .status(Payment.PaymentStatus.COMPLETED).build();
        Order order = Order.builder().id(100L).user(user).shippingAddress(address).items(List.of(item))
                .payment(payment).paymentMethod(Order.PaymentMethod.PREPAID).discountAmount(new BigDecimal("50.00"))
                .totalAmount(new BigDecimal("948.00")).status(Order.OrderStatus.PAID)
                .createdAt(LocalDateTime.of(2026, 1, 2, 12, 0)).build();

        String html = renderer.render(order, renderer.invoiceNumber(order));

        assertThat(renderer.invoiceNumber(order)).isEqualTo("INV-20260102-100");
        assertThat(html).contains("TAX INVOICE", "PAID", "Billing / Shipping Address", "Order Items", "Cashews", "SKU-44");
        assertThat(html).contains("Buyer Name", "buyer@test.com", "pay_123", "Thank you for shopping with us!");
        assertThat(html).contains("Payment Status:", "Payment Method:");
        assertThat(html).contains("data:image/png;base64,");
    }

    @Test
    void render_zeroItemOrder_fallsBackToTotalAmount() {
        InvoiceProperties invoiceProperties = new InvoiceProperties();
        AppProperties appProperties = new AppProperties();
        InvoiceTemplateRenderer renderer = new InvoiceTemplateRenderer(invoiceProperties, appProperties);
        User user = User.builder().id(1L).email("buyer@test.com").name("Buyer").role(User.Role.USER).build();
        Order order = Order.builder().id(100L).user(user).items(List.of()).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PAID).createdAt(LocalDateTime.of(2026, 1, 2, 12, 0)).build();

        String html = renderer.render(order, renderer.invoiceNumber(order));

        assertThat(html).contains("No line items recorded", "Rs. 100.00");
    }

    @Test
    void render_withCloudinaryLogoAndIgstCalculation() {
        InvoiceProperties invoiceProperties = new InvoiceProperties();
        invoiceProperties.setCompanyName("Kamyaabi Test");
        invoiceProperties.setLogoUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg");
        invoiceProperties.setTaxRate("5%");
        invoiceProperties.setTaxLabel("IGST");

        AppProperties appProperties = new AppProperties();
        appProperties.setFrontendUrl("https://kamyaabi.in");
        InvoiceTemplateRenderer renderer = new InvoiceTemplateRenderer(invoiceProperties, appProperties);

        User user = User.builder().id(1L).email("buyer@test.com").name("Buyer").role(User.Role.USER).build();
        Address address = Address.builder().id(1L).user(user).fullName("Buyer Name").phone("9999999999")
                .street("Street 1").city("Hyderabad").state("Telangana").pincode("500001").build();
        Product product = Product.builder().id(44L).name("Cashews").description("Premium cashews").build();

        // Price = 250.00 inclusive of tax.
        // Direct Tax = 250.00 * 5% = 12.50
        // Exclusive price = 250.00 - 12.50 = 237.50
        // Quantity = 1
        OrderItem item = OrderItem.builder().id(10L).product(product).quantity(1)
                .price(new BigDecimal("250.00")).build();

        Order order = Order.builder().id(100L).user(user).shippingAddress(address).items(List.of(item))
                .totalAmount(new BigDecimal("250.00")).status(Order.OrderStatus.PAID)
                .createdAt(LocalDateTime.of(2026, 1, 2, 12, 0)).build();

        String html = renderer.render(order, renderer.invoiceNumber(order));

        // Verify the Cloudinary logo URL is transformed with c_limit
        assertThat(html).contains("https://res.cloudinary.com/demo/image/upload/w_360,h_120,c_limit,q_90/sample.png");

        // Verify the IGST amount is Rs. 12.50 and unit price excl. tax is Rs. 237.50
        assertThat(html).contains("Rs. 237.50", "Rs. 12.50", "Rs. 250.00");
    }
}
