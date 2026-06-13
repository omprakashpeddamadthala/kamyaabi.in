package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.User;
import com.kamyaabi.repository.OrderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Order CSV", description = "Admin order CSV export/import")
public class OrderCsvController {

    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private static final String[] CSV_HEADERS = {
            "order_id", "order_date", "order_status", "payment_status", "payment_method",
            "shipping_address", "billing_address",
            "subtotal", "discount", "total", "currency",
            "customer_id", "customer_email", "customer_name",
            "coupon_code", "invoice_number",
            "shiprocket_order_id", "awb_number", "courier_name", "shipping_status",
            "product_id", "product_name", "product_sku", "product_category",
            "product_price", "product_quantity", "product_weight",
            "product_image_url",
            "seo_meta_title", "seo_meta_description", "seo_slug",
            "seo_canonical_url", "seo_og_image"
    };

    private final OrderRepository orderRepository;

    public OrderCsvController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/export/csv")
    @Transactional(readOnly = true)
    @Operation(summary = "Export orders CSV",
            description = "Streams a CSV download of all orders with product details and SEO fields.")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"orders_export_" + System.currentTimeMillis() + ".csv\"");

        List<Order> orders = orderRepository.findAll();
        List<Long> ids = orders.stream().map(Order::getId).toList();

        Map<Long, Order> detailedOrders = new LinkedHashMap<>();
        if (!ids.isEmpty()) {
            for (int i = 0; i < ids.size(); i += 500) {
                List<Long> batch = ids.subList(i, Math.min(i + 500, ids.size()));
                orderRepository.findAllWithDetailsByIdIn(batch)
                        .forEach(o -> detailedOrders.put(o.getId(), o));
            }
        }

        try (CSVPrinter printer = new CSVPrinter(response.getWriter(),
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS).build())) {

            for (Long orderId : ids) {
                Order o = detailedOrders.get(orderId);
                if (o == null) continue;

                User user = o.getUser();
                Address addr = o.getShippingAddress();
                String shippingAddr = formatAddress(addr);
                String paymentStatus = o.getPayment() != null ? o.getPayment().getStatus().name() : "";

                List<OrderItem> items = o.getItems();
                if (items == null || items.isEmpty()) {
                    printer.printRecord(
                            o.getId(),
                            o.getCreatedAt() != null ? o.getCreatedAt().format(DT_FORMAT) : "",
                            o.getStatus(),
                            paymentStatus,
                            o.getPaymentMethod(),
                            shippingAddr,
                            "",
                            o.getTotalAmount(),
                            o.getDiscountAmount(),
                            o.getTotalAmount(),
                            "INR",
                            user != null ? user.getId() : "",
                            user != null ? user.getEmail() : "",
                            user != null ? user.getName() : "",
                            o.getCouponCode(),
                            o.getInvoiceNumber(),
                            o.getShiprocketOrderId(),
                            o.getAwbNumber(),
                            o.getCourierName(),
                            o.getShippingStatus(),
                            "", "", "", "", "", "", "", "",
                            "", "", "", "", ""
                    );
                } else {
                    for (OrderItem item : items) {
                        Product p = item.getProduct();
                        printer.printRecord(
                                o.getId(),
                                o.getCreatedAt() != null ? o.getCreatedAt().format(DT_FORMAT) : "",
                                o.getStatus(),
                                paymentStatus,
                                o.getPaymentMethod(),
                                shippingAddr,
                                "",
                                o.getTotalAmount(),
                                o.getDiscountAmount(),
                                o.getTotalAmount(),
                                "INR",
                                user != null ? user.getId() : "",
                                user != null ? user.getEmail() : "",
                                user != null ? user.getName() : "",
                                o.getCouponCode(),
                                o.getInvoiceNumber(),
                                o.getShiprocketOrderId(),
                                o.getAwbNumber(),
                                o.getCourierName(),
                                o.getShippingStatus(),
                                p != null ? p.getId() : "",
                                p != null ? p.getName() : "",
                                p != null ? p.getWeight() : "",
                                p != null && p.getCategory() != null ? p.getCategory().getName() : "",
                                item.getPrice(),
                                item.getQuantity(),
                                item.getWeightKg(),
                                p != null ? p.getImageUrl() : "",
                                p != null ? p.getSeoTitle() : "",
                                p != null ? p.getSeoDescription() : "",
                                p != null ? p.getSlug() : "",
                                p != null ? p.getCanonicalUrl() : "",
                                p != null ? p.getOgImageUrl() : ""
                        );
                    }
                }
            }
        }
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import orders CSV",
            description = "Imports/updates orders from a CSV upload. Only provided fields are updated.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file) throws IOException {

        int totalRows = 0;
        int updatedOrders = 0;
        int skippedRows = 0;
        List<String> errors = new ArrayList<>();

        try (Reader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            int rowNum = 1;
            for (CSVRecord record : parser) {
                rowNum++;
                totalRows++;
                try {
                    String orderIdStr = getField(record, "order_id");
                    if (orderIdStr == null || orderIdStr.isBlank()) {
                        errors.add("Row " + rowNum + ": missing order_id");
                        skippedRows++;
                        continue;
                    }

                    long orderId;
                    try {
                        orderId = Long.parseLong(orderIdStr);
                    } catch (NumberFormatException e) {
                        errors.add("Row " + rowNum + ": invalid order_id '" + orderIdStr + "'");
                        skippedRows++;
                        continue;
                    }

                    Optional<Order> optOrder = orderRepository.findById(orderId);
                    if (optOrder.isEmpty()) {
                        errors.add("Row " + rowNum + ": order_id " + orderId + " not found");
                        skippedRows++;
                        continue;
                    }

                    Order order = optOrder.get();
                    boolean modified = false;

                    String status = getField(record, "order_status");
                    if (status != null && !status.isBlank()) {
                        try {
                            order.setStatus(Order.OrderStatus.valueOf(status.trim().toUpperCase()));
                            modified = true;
                        } catch (IllegalArgumentException e) {
                            errors.add("Row " + rowNum + ": invalid order_status '" + status + "'");
                        }
                    }

                    String paymentMethod = getField(record, "payment_method");
                    if (paymentMethod != null && !paymentMethod.isBlank()) {
                        try {
                            order.setPaymentMethod(Order.PaymentMethod.valueOf(paymentMethod.trim().toUpperCase()));
                            modified = true;
                        } catch (IllegalArgumentException e) {
                            errors.add("Row " + rowNum + ": invalid payment_method '" + paymentMethod + "'");
                        }
                    }

                    String discount = getField(record, "discount");
                    if (discount != null && !discount.isBlank()) {
                        try {
                            order.setDiscountAmount(new BigDecimal(discount.trim()));
                            modified = true;
                        } catch (NumberFormatException e) {
                            errors.add("Row " + rowNum + ": invalid discount '" + discount + "'");
                        }
                    }

                    String total = getField(record, "total");
                    if (total != null && !total.isBlank()) {
                        try {
                            order.setTotalAmount(new BigDecimal(total.trim()));
                            modified = true;
                        } catch (NumberFormatException e) {
                            errors.add("Row " + rowNum + ": invalid total '" + total + "'");
                        }
                    }

                    String couponCode = getField(record, "coupon_code");
                    if (couponCode != null && !couponCode.isBlank()) {
                        order.setCouponCode(couponCode.trim());
                        modified = true;
                    }

                    String invoiceNumber = getField(record, "invoice_number");
                    if (invoiceNumber != null && !invoiceNumber.isBlank()) {
                        order.setInvoiceNumber(invoiceNumber.trim());
                        modified = true;
                    }

                    String shippingStatus = getField(record, "shipping_status");
                    if (shippingStatus != null && !shippingStatus.isBlank()) {
                        order.setShippingStatus(shippingStatus.trim());
                        modified = true;
                    }

                    String courierName = getField(record, "courier_name");
                    if (courierName != null && !courierName.isBlank()) {
                        order.setCourierName(courierName.trim());
                        modified = true;
                    }

                    String awbNumber = getField(record, "awb_number");
                    if (awbNumber != null && !awbNumber.isBlank()) {
                        order.setAwbNumber(awbNumber.trim());
                        modified = true;
                    }

                    if (modified) {
                        orderRepository.save(order);
                        updatedOrders++;
                    } else {
                        skippedRows++;
                    }
                } catch (Exception e) {
                    log.warn("Error processing CSV row {}: {}", rowNum, e.getMessage());
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                    skippedRows++;
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("success", true);
        summary.put("totalRows", totalRows);
        summary.put("updatedOrders", updatedOrders);
        summary.put("skippedRows", skippedRows);
        summary.put("errors", errors);

        return ResponseEntity.ok(ApiResponse.success("CSV import completed", summary));
    }

    private String getField(CSVRecord record, String header) {
        try {
            return record.get(header);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String formatAddress(Address addr) {
        if (addr == null) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(addr.getFullName());
        sb.append(", ").append(addr.getStreet());
        if (addr.getAddressLine2() != null && !addr.getAddressLine2().isBlank()) {
            sb.append(", ").append(addr.getAddressLine2());
        }
        sb.append(", ").append(addr.getCity());
        sb.append(", ").append(addr.getState());
        sb.append(" - ").append(addr.getPincode());
        if (addr.getPhone() != null && !addr.getPhone().isBlank()) {
            sb.append(" (").append(addr.getPhone()).append(")");
        }
        return sb.toString();
    }
}
