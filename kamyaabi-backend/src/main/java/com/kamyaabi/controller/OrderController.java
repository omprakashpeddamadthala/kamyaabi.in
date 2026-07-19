package com.kamyaabi.controller;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.InvoiceUrlResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.invoice.InvoiceDocument;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.InvoiceService;
import com.kamyaabi.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;
    private final CurrentUser currentUser;

    public OrderController(OrderService orderService, InvoiceService invoiceService, CurrentUser currentUser) {
        this.orderService = orderService;
        this.invoiceService = invoiceService;
        this.currentUser = currentUser;
    }

    @PostMapping
    @PreAuthorize("!hasRole('ADMIN')")
    @Operation(summary = "Create order", description = "Create a new order from cart items")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        OrderResponse order = orderService.createOrder(currentUser.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", order));
    }

    @GetMapping
    @Operation(summary = "Get user orders", description = "Get paginated list of user's orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getUserOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getUserOrders(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}/invoice")
    @Operation(summary = "Download invoice", description = "Download the paid order invoice or return its stored URL")
    public ResponseEntity<?> getInvoice(@PathVariable Long id,
                                         @RequestParam(required = false) String format) {
        InvoiceDocument invoice = invoiceService.getInvoice(id, currentUser.getUserId(), false);
        if ("url".equalsIgnoreCase(format)) {
            return ResponseEntity.ok(ApiResponse.success(InvoiceUrlResponse.builder()
                    .invoiceUrl(invoice.invoiceUrl())
                    .build()));
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(invoice.filename())
                        .build()
                        .toString())
                .body(invoice.content());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details", description = "Get detailed order information")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/{id}/refresh-status")
    @PreAuthorize("!hasRole('ADMIN')")
    @Operation(summary = "Refresh order shipment status",
            description = "Triggers a live Shiprocket status pull for this order and returns the updated order. "
                    + "Call this in the background after loading the order detail page to ensure the latest status is shown.")
    public ResponseEntity<ApiResponse<OrderResponse>> refreshOrderStatus(@PathVariable Long id) {
        log.info("Customer-triggered Shiprocket status refresh for order {}", id);
        OrderResponse order = orderService.refreshShipmentStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Status refreshed", order));
    }
}
