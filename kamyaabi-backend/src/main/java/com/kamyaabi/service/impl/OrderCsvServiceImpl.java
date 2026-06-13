package com.kamyaabi.service.impl;

import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.User;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.OrderCsvService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.Writer;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class OrderCsvServiceImpl implements OrderCsvService {

    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int FETCH_BATCH_SIZE = 500;
    private static final String CURRENCY_INR = "INR";

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

    public OrderCsvServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public void writeOrdersCsv(Writer writer) throws IOException {
        List<Order> orders = orderRepository.findAll();
        List<Long> ids = orders.stream().map(Order::getId).toList();

        Map<Long, Order> detailedOrders = new LinkedHashMap<>();
        if (!ids.isEmpty()) {
            for (int i = 0; i < ids.size(); i += FETCH_BATCH_SIZE) {
                List<Long> batch = ids.subList(i, Math.min(i + FETCH_BATCH_SIZE, ids.size()));
                orderRepository.findAllWithDetailsByIdIn(batch)
                        .forEach(o -> detailedOrders.put(o.getId(), o));
            }
        }

        try (CSVPrinter printer = new CSVPrinter(writer,
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS).build())) {

            for (Long orderId : ids) {
                Order o = detailedOrders.get(orderId);
                if (o == null) {
                    continue;
                }
                printOrderRows(printer, o);
            }
        }
    }

    private void printOrderRows(CSVPrinter printer, Order o) throws IOException {
        User user = o.getUser();
        String shippingAddr = formatAddress(o.getShippingAddress());
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
                    CURRENCY_INR,
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
            return;
        }

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
                    CURRENCY_INR,
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

    @Override
    public Map<String, Object> importOrders(InputStream inputStream) throws IOException {
        int totalRows = 0;
        int updatedOrders = 0;
        int skippedRows = 0;
        List<String> errors = new ArrayList<>();

        try (Reader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
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

                    if (applyOrderUpdates(optOrder.get(), record, rowNum, errors)) {
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
        return summary;
    }

    private boolean applyOrderUpdates(Order order, CSVRecord record, int rowNum, List<String> errors) {
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
        }
        return modified;
    }

    private String getField(CSVRecord record, String header) {
        try {
            return record.get(header);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String formatAddress(Address addr) {
        if (addr == null) {
            return "";
        }
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
