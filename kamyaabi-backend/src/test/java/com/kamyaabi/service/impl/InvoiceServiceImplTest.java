package com.kamyaabi.service.impl;

import com.kamyaabi.config.InvoiceProperties;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.User;
import com.kamyaabi.invoice.InvoiceDocument;
import com.kamyaabi.invoice.InvoicePdfRenderer;
import com.kamyaabi.invoice.InvoiceStorage;
import com.kamyaabi.invoice.InvoiceTemplateRenderer;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private InvoiceTemplateRenderer templateRenderer;
    @Mock private InvoicePdfRenderer pdfRenderer;
    @Mock private InvoiceStorage invoiceStorage;

    private InvoiceServiceImpl invoiceService;
    private Order paidOrder;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceServiceImpl(orderRepository, templateRenderer, pdfRenderer,
                invoiceStorage, new InvoiceProperties());
        User user = User.builder().id(7L).email("buyer@test.com").name("Buyer").role(User.Role.USER).build();
        paidOrder = Order.builder()
                .id(100L)
                .user(user)
                .status(Order.OrderStatus.PAID)
                .totalAmount(new BigDecimal("999.00"))
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.of(2026, 1, 2, 10, 0))
                .build();
    }

    @Test
    void generateInvoice_newPaidOrder_rendersStoresAndPersistsInvoiceUrl() {
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));
        when(templateRenderer.invoiceNumber(paidOrder)).thenReturn("INV-20260102-100");
        when(templateRenderer.render(paidOrder, "INV-20260102-100")).thenReturn("<html></html>");
        when(pdfRenderer.render("<html></html>")).thenReturn("pdf".getBytes());
        when(invoiceStorage.store(any(String.class), any(byte[].class))).thenReturn("/invoices/invoice_100.pdf");

        InvoiceDocument invoice = invoiceService.generateInvoice(100L);

        assertThat(invoice.invoiceNumber()).isEqualTo("INV-20260102-100");
        assertThat(invoice.invoiceUrl()).isEqualTo("/invoices/invoice_100.pdf");
        assertThat(invoice.content()).isEqualTo("pdf".getBytes());
        assertThat(paidOrder.getInvoiceNumber()).isEqualTo("INV-20260102-100");
        assertThat(paidOrder.getInvoiceUrl()).isEqualTo("/invoices/invoice_100.pdf");
        verify(orderRepository).save(paidOrder);
    }

    @Test
    void generateInvoice_existingInvoice_reusesStoredFile() {
        paidOrder.setInvoiceNumber("INV-20260102-100");
        paidOrder.setInvoiceUrl("/invoices/existing.pdf");
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));
        when(invoiceStorage.exists("/invoices/existing.pdf")).thenReturn(true);
        when(invoiceStorage.read("/invoices/existing.pdf")).thenReturn("existing".getBytes());

        InvoiceDocument invoice = invoiceService.generateInvoice(100L);

        assertThat(invoice.content()).isEqualTo("existing".getBytes());
        verifyNoInteractions(pdfRenderer);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void getInvoice_otherUserNonAdmin_shouldNotExposeOrder() {
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));

        assertThatThrownBy(() -> invoiceService.getInvoice(100L, 8L, false))
                .hasMessageContaining("Order not found");
    }

    @Test
    void generateInvoice_pendingOrder_shouldSucceed() {
        paidOrder.setStatus(Order.OrderStatus.PENDING);
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));
        when(templateRenderer.invoiceNumber(paidOrder)).thenReturn("INV-20260102-100");
        when(templateRenderer.render(paidOrder, "INV-20260102-100")).thenReturn("<html></html>");
        when(pdfRenderer.render("<html></html>")).thenReturn("pdf".getBytes());
        when(invoiceStorage.store(any(String.class), any(byte[].class))).thenReturn("/invoices/invoice_100.pdf");

        InvoiceDocument invoice = invoiceService.generateInvoice(100L);

        assertThat(invoice.invoiceNumber()).isEqualTo("INV-20260102-100");
        verify(orderRepository).save(paidOrder);
    }

    @Test
    void getInvoice_storedUrlButFileMissing_regeneratesInvoice() {
        paidOrder.setInvoiceUrl("/invoices/gone.pdf");
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));
        when(invoiceStorage.exists("/invoices/gone.pdf")).thenReturn(false);
        when(templateRenderer.invoiceNumber(paidOrder)).thenReturn("INV-20260102-100");
        when(templateRenderer.render(paidOrder, "INV-20260102-100")).thenReturn("<html></html>");
        when(pdfRenderer.render("<html></html>")).thenReturn("pdf".getBytes());
        when(invoiceStorage.store(any(String.class), any(byte[].class))).thenReturn("/invoices/invoice_100_new.pdf");

        InvoiceDocument invoice = invoiceService.getInvoice(100L, 7L, false);

        assertThat(invoice.invoiceUrl()).isEqualTo("/invoices/invoice_100_new.pdf");
        verify(pdfRenderer).render("<html></html>");
    }

    @Test
    void generateInvoiceAfterPayment_retriesAndThenSucceeds() {
        when(orderRepository.findByIdWithInvoiceDetails(100L)).thenReturn(Optional.of(paidOrder));
        when(templateRenderer.invoiceNumber(paidOrder)).thenReturn("INV-20260102-100");
        when(templateRenderer.render(paidOrder, "INV-20260102-100")).thenReturn("<html></html>");
        when(pdfRenderer.render("<html></html>")).thenThrow(new RuntimeException("boom")).thenReturn("pdf".getBytes());
        when(invoiceStorage.store(any(String.class), any(byte[].class))).thenReturn("/invoices/invoice_100.pdf");

        invoiceService.generateInvoiceAfterPayment(100L);

        verify(pdfRenderer, times(2)).render("<html></html>");
        verify(orderRepository).save(paidOrder);
    }
}
