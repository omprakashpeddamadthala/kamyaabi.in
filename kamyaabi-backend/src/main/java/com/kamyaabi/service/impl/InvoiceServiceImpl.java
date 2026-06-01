package com.kamyaabi.service.impl;

import com.kamyaabi.config.InvoiceProperties;
import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.invoice.InvoiceDocument;
import com.kamyaabi.invoice.InvoicePdfRenderer;
import com.kamyaabi.invoice.InvoiceStorage;
import com.kamyaabi.invoice.InvoiceTemplateRenderer;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.InvoiceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Slf4j
@Service
public class InvoiceServiceImpl implements InvoiceService {

    private static final Set<Order.OrderStatus> INVOICE_STATUSES = Set.of(
            Order.OrderStatus.PAID,
            Order.OrderStatus.CONFIRMED,
            Order.OrderStatus.PROCESSING,
            Order.OrderStatus.SHIPPED,
            Order.OrderStatus.DELIVERED
    );

    private final OrderRepository orderRepository;
    private final InvoiceTemplateRenderer templateRenderer;
    private final InvoicePdfRenderer pdfRenderer;
    private final InvoiceStorage invoiceStorage;
    private final InvoiceProperties invoiceProperties;

    public InvoiceServiceImpl(OrderRepository orderRepository,
                              InvoiceTemplateRenderer templateRenderer,
                              InvoicePdfRenderer pdfRenderer,
                              InvoiceStorage invoiceStorage,
                              InvoiceProperties invoiceProperties) {
        this.orderRepository = orderRepository;
        this.templateRenderer = templateRenderer;
        this.pdfRenderer = pdfRenderer;
        this.invoiceStorage = invoiceStorage;
        this.invoiceProperties = invoiceProperties;
    }

    @Override
    @Transactional
    public InvoiceDocument generateInvoice(Long orderId) {
        Order order = orderRepository.findByIdWithInvoiceDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        assertInvoiceAllowed(order);

        if (order.getInvoiceUrl() != null && invoiceStorage.exists(order.getInvoiceUrl())) {
            ensureInvoiceNumberPersisted(order);
            return readExisting(order);
        }

        String invoiceNumber = templateRenderer.invoiceNumber(order);
        String html = templateRenderer.render(order, invoiceNumber);
        byte[] content = pdfRenderer.render(html);
        String filename = "invoice_" + order.getId() + "_" + Instant.now().toEpochMilli() + ".pdf";
        String invoiceUrl = invoiceStorage.store(filename, content);

        order.setInvoiceNumber(invoiceNumber);
        order.setInvoiceUrl(invoiceUrl);
        orderRepository.save(order);

        return new InvoiceDocument(order.getId(), invoiceNumber, invoiceUrl, filename, content);
    }

    @Override
    @Transactional
    public InvoiceDocument getInvoice(Long orderId, Long requesterUserId, boolean requesterAdmin) {
        Order order = orderRepository.findByIdWithInvoiceDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!requesterAdmin && (requesterUserId == null || !order.getUser().getId().equals(requesterUserId))) {
            throw new ResourceNotFoundException("Order", orderId);
        }
        assertInvoiceAllowed(order);
        if (order.getInvoiceUrl() == null || order.getInvoiceUrl().isBlank()) {
            return generateInvoice(orderId);
        }
        return readExisting(order);
    }

    @Override
    @Async("invoiceTaskExecutor")
    public void generateInvoiceAfterPayment(Long orderId) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                InvoiceDocument invoice = generateInvoice(orderId);
                log.info("Invoice {} ready for order {}", invoice.invoiceNumber(), orderId);
                return;
            } catch (Exception e) {
                if (attempt == 3) {
                    log.error("Invoice generation failed after {} attempts for order {}", attempt, orderId, e);
                } else {
                    log.warn("Invoice generation attempt {} failed for order {}; retrying", attempt, orderId, e);
                    sleepBeforeRetry(attempt);
                }
            }
        }
    }

    private void ensureInvoiceNumberPersisted(Order order) {
        if (order.getInvoiceNumber() == null || order.getInvoiceNumber().isBlank()) {
            order.setInvoiceNumber(templateRenderer.invoiceNumber(order));
            orderRepository.save(order);
        }
    }

    private InvoiceDocument readExisting(Order order) {
        String invoiceNumber = order.getInvoiceNumber() == null || order.getInvoiceNumber().isBlank()
                ? templateRenderer.invoiceNumber(order) : order.getInvoiceNumber();
        String filename = "invoice_" + order.getId() + ".pdf";
        return new InvoiceDocument(order.getId(), invoiceNumber, order.getInvoiceUrl(), filename,
                invoiceStorage.read(order.getInvoiceUrl()));
    }

    private void assertInvoiceAllowed(Order order) {
        if (!INVOICE_STATUSES.contains(order.getStatus())) {
            throw new IllegalStateException("Invoice is available only after payment is confirmed");
        }
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            Thread.sleep(500L * attempt);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
