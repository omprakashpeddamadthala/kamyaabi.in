package com.kamyaabi.invoice;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.kamyaabi.config.AppProperties;
import com.kamyaabi.config.InvoiceProperties;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Payment;
import com.kamyaabi.entity.Product;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Component
public class InvoiceTemplateRenderer {

    private static final DateTimeFormatter INVOICE_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final InvoiceProperties invoiceProperties;
    private final AppProperties appProperties;

    public InvoiceTemplateRenderer(InvoiceProperties invoiceProperties, AppProperties appProperties) {
        this.invoiceProperties = invoiceProperties;
        this.appProperties = appProperties;
    }

    public String invoiceNumber(Order order) {
        LocalDateTime createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        return "INV-" + createdAt.toLocalDate().format(INVOICE_DATE) + "-" + order.getId();
    }

    public String render(Order order, String invoiceNumber) {
        LocalDate invoiceDate = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now();
        LocalDate dueDate = invoiceDate;
        BigDecimal discount = amount(order.getDiscountAmount());
        BigDecimal total = amount(order.getTotalAmount());
        BigDecimal subtotal = order.getItems() == null ? total.add(discount) : order.getItems().stream()
                .map(item -> amount(item.getPrice()).multiply(BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (subtotal.compareTo(BigDecimal.ZERO) == 0) {
            subtotal = total.add(discount);
        }
        String orderStatusUrl = buildOrderStatusUrl(order.getId());

        return """
                <!doctype html>
                <html>
                <head>
                  <meta charset=\"UTF-8\" />
                  <style>
                    @page { size: A4; margin: 16mm; }
                    * { box-sizing: border-box; }
                    body { font-family: Arial, Helvetica, sans-serif; color: #24311d; margin: 0; font-size: 12px; }
                    .top { display: table; width: 100%; margin-bottom: 22px; }
                    .brand { display: table-cell; width: 48%; vertical-align: top; }
                    .company { display: table-cell; width: 52%; text-align: right; vertical-align: top; color: #4b5563; line-height: 1.45; }
                    .logo { width: 74px; height: 74px; border-radius: 16px; background: #8b6914; color: #fff; font-size: 28px; font-weight: 800; text-align: center; line-height: 74px; margin-bottom: 10px; }
                    .brand-name { font-size: 24px; font-weight: 800; color: #8b6914; letter-spacing: .4px; }
                    .title-row { display: table; width: 100%; border-top: 3px solid #8b6914; border-bottom: 1px solid #e5e7eb; padding: 14px 0; margin-bottom: 20px; }
                    .title { display: table-cell; font-size: 34px; font-weight: 800; color: #111827; letter-spacing: 1.8px; }
                    .meta { display: table-cell; text-align: right; color: #374151; line-height: 1.65; }
                    .paid { display: inline-block; background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 5px 11px; border-radius: 999px; font-weight: 800; margin-top: 4px; }
                    .panel-row { display: table; width: 100%; margin-bottom: 18px; }
                    .panel { display: table-cell; width: 50%; background: #f8fafc; border: 1px solid #e5e7eb; padding: 13px; line-height: 1.55; vertical-align: top; }
                    .panel + .panel { border-left: 0; }
                    .section-title { color: #8b6914; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 7px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th { background: #8b6914; color: #fff; padding: 9px 8px; font-size: 11px; text-align: left; text-transform: uppercase; }
                    td { border-bottom: 1px solid #e5e7eb; padding: 9px 8px; vertical-align: middle; }
                    tr:nth-child(even) td { background: #fbfaf5; }
                    .num { text-align: right; white-space: nowrap; }
                    .thumb { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; vertical-align: middle; margin-right: 8px; border: 1px solid #e5e7eb; }
                    .item-name { font-weight: 700; }
                    .muted { color: #6b7280; }
                    .totals-wrap { width: 100%; margin-top: 16px; }
                    .totals { margin-left: auto; width: 42%; border: 1px solid #e5e7eb; }
                    .totals td { padding: 8px 10px; }
                    .totals .label { color: #4b5563; }
                    .discount { color: #b91c1c; }
                    .grand td { background: #111827; color: #fff; font-size: 15px; font-weight: 800; border-bottom: 0; }
                    .payment { margin-top: 12px; line-height: 1.6; color: #374151; }
                    .footer { position: fixed; left: 0; right: 0; bottom: 0; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 10px; color: #6b7280; }
                    .footer-table { width: 100%; }
                    .footer-table td { border: 0; padding: 0; }
                    .qr { width: 72px; height: 72px; }
                    .thanks { font-size: 14px; color: #8b6914; font-weight: 800; margin-bottom: 4px; }
                    .page:after { content: counter(page); }
                  </style>
                </head>
                <body>
                """
                + header()
                + title(invoiceNumber, invoiceDate, dueDate)
                + billTo(order)
                + itemsTable(order.getItems())
                + totals(subtotal, discount, total)
                + payment(order)
                + footer(orderStatusUrl)
                + "</body></html>";
    }

    private String header() {
        String logoUrl = text(invoiceProperties.getLogoUrl());
        String logo = logoUrl.isBlank()
                ? "<div class=\"logo\">K</div>"
                : "<img class=\"logo\" src=\"" + attr(logoUrl) + "\" alt=\"Kamyaabi logo\" />";
        return "<div class=\"top\"><div class=\"brand\">" + logo
                + "<div class=\"brand-name\">" + html(invoiceProperties.getCompanyName()) + "</div>"
                + "<div class=\"muted\">Premium Dry Fruits</div></div>"
                + "<div class=\"company\"><strong>" + html(invoiceProperties.getCompanyName()) + "</strong><br/>"
                + html(invoiceProperties.getCompanyAddress()) + "<br/>"
                + html(invoiceProperties.getCompanyEmail()) + " | " + html(invoiceProperties.getCompanyPhone()) + "<br/>"
                + html(invoiceProperties.getCompanyWebsite()) + "</div></div>";
    }

    private String title(String invoiceNumber, LocalDate invoiceDate, LocalDate dueDate) {
        return "<div class=\"title-row\"><div class=\"title\">TAX INVOICE</div><div class=\"meta\">"
                + "<strong>Invoice #:</strong> " + html(invoiceNumber) + "<br/>"
                + "<strong>Invoice date:</strong> " + invoiceDate.format(DISPLAY_DATE) + "<br/>"
                + "<strong>Due date:</strong> " + dueDate.format(DISPLAY_DATE) + "<br/>"
                + "<span class=\"paid\">PAID &#10003;</span>"
                + "</div></div>";
    }

    private String billTo(Order order) {
        Address address = order.getShippingAddress();
        String name = address != null && address.getFullName() != null ? address.getFullName() : order.getUser().getName();
        String phone = address != null ? text(address.getPhone()) : "";
        String addressLines = address == null ? "" : String.join("<br/>", List.of(
                html(address.getStreet()),
                text(address.getAddressLine2()).isBlank() ? "" : html(address.getAddressLine2()),
                html(address.getCity()) + ", " + html(address.getState()) + " " + html(address.getPincode()),
                "India"
        )).replace("<br/><br/>", "<br>");
        return "<div class=\"panel-row\"><div class=\"panel\"><div class=\"section-title\">Bill To</div>"
                + "<strong>" + html(name) + "</strong><br/>"
                + html(order.getUser().getEmail()) + "<br/>"
                + addressLines
                + (phone.isBlank() ? "" : "<br/>Phone: " + html(phone))
                + "</div><div class=\"panel\"><div class=\"section-title\">Order</div>"
                + "Order ID: #" + order.getId() + "<br/>Customer ID: #" + order.getUser().getId() + "<br/>"
                + "Payment status: PAID<br/>Currency: " + html(invoiceProperties.getCurrency())
                + "</div></div>";
    }

    private String itemsTable(List<OrderItem> items) {
        StringBuilder rows = new StringBuilder();
        if (items == null || items.isEmpty()) {
            rows.append("<tr><td colspan=\"6\" class=\"muted\">No line items recorded for this order.</td></tr>");
        } else {
            int index = 1;
            for (OrderItem item : items) {
                Product product = item.getProduct();
                String productName = product == null ? "Item" : product.getName();
                String productDescription = product == null ? "" : product.getDescription();
                String productImageUrl = product == null ? "" : product.getImageUrl();
                BigDecimal unit = amount(item.getPrice());
                int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                BigDecimal lineTotal = unit.multiply(BigDecimal.valueOf(quantity));
                String image = productImageUrl == null || productImageUrl.isBlank()
                        ? ""
                        : "<img class=\"thumb\" src=\"" + attr(productImageUrl) + "\" alt=\"\" />";
                String sku = "SKU-" + (product == null || product.getId() == null ? "NA" : product.getId());
                rows.append("<tr><td>").append(index++).append("</td><td>")
                        .append(image).append("<span class=\"item-name\">").append(html(productName)).append("</span>")
                        .append(productDescription == null || productDescription.isBlank() ? "" : "<br/><span class=\"muted\">" + html(shorten(productDescription)) + "</span>")
                        .append("</td><td>").append(html(sku)).append("</td><td class=\"num\">").append(quantity)
                        .append("</td><td class=\"num\">").append(money(unit)).append("</td><td class=\"num\">").append(money(lineTotal))
                        .append("</td></tr>");
            }
        }
        return "<div class=\"section-title\">Order Summary</div><table><thead><tr>"
                + "<th>#</th><th>Item Description</th><th>SKU</th><th class=\"num\">Qty</th><th class=\"num\">Unit Price</th><th class=\"num\">Total</th>"
                + "</tr></thead><tbody>" + rows + "</tbody></table>";
    }

    private String totals(BigDecimal subtotal, BigDecimal discount, BigDecimal total) {
        return "<div class=\"totals-wrap\"><table class=\"totals\"><tbody>"
                + row("Subtotal", money(subtotal), "")
                + (discount.compareTo(BigDecimal.ZERO) > 0 ? row("Discount", "-" + money(discount), "discount") : "")
                + row("Shipping charges", money(BigDecimal.ZERO), "")
                + row(invoiceProperties.getTaxLabel() + " (" + invoiceProperties.getTaxRate() + ")", money(BigDecimal.ZERO), "")
                + "<tr class=\"grand\"><td>Total</td><td class=\"num\">" + money(total) + "</td></tr>"
                + "</tbody></table></div>";
    }

    private String payment(Order order) {
        Payment payment = order.getPayment();
        String method = order.getPaymentMethod() == null || order.getPaymentMethod() == Order.PaymentMethod.PREPAID
                ? "Razorpay / Online" : "Cash on Delivery";
        String transaction = payment != null && payment.getRazorpayPaymentId() != null ? payment.getRazorpayPaymentId() : "N/A";
        return "<div class=\"payment\"><strong>Payment method:</strong> " + html(method)
                + "<br/><strong>Transaction ID:</strong> " + html(transaction) + "</div>";
    }

    private String footer(String orderStatusUrl) {
        return "<div class=\"footer\"><table class=\"footer-table\"><tr><td>"
                + "<div class=\"thanks\">Thank you for your purchase!</div>"
                + html(invoiceProperties.getRefundPolicyNote()) + "<br/>"
                + "Support: " + html(invoiceProperties.getCompanyEmail()) + " | " + html(invoiceProperties.getCompanyWebsite())
                + "<br/>Page <span class=\"page\"></span>"
                + "</td><td style=\"width:80px;text-align:right;\"><img class=\"qr\" src=\"" + qrDataUri(orderStatusUrl) + "\" alt=\"Order QR\" /></td></tr></table></div>";
    }

    private String row(String label, String value, String css) {
        return "<tr><td class=\"label\">" + html(label) + "</td><td class=\"num " + css + "\">" + value + "</td></tr>";
    }

    private String buildOrderStatusUrl(Long orderId) {
        String base = text(appProperties.getFrontendUrl()).isBlank() ? text(invoiceProperties.getCompanyWebsite()) : text(appProperties.getFrontendUrl());
        return base.replaceAll("/+$", "") + "/orders/" + URLEncoder.encode(String.valueOf(orderId), StandardCharsets.UTF_8);
    }

    private String qrDataUri(String value) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(value, BarcodeFormat.QR_CODE, 144, 144);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception e) {
            throw new InvoiceGenerationException("Failed to render order QR code", e);
        }
    }

    private String money(BigDecimal value) {
        return symbol(invoiceProperties.getCurrency()) + amount(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal amount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String symbol(String currency) {
        return switch (text(currency).toUpperCase()) {
            case "INR" -> "₹";
            case "USD" -> "$";
            case "EUR" -> "€";
            case "GBP" -> "£";
            default -> text(currency) + " ";
        };
    }

    private String shorten(String value) {
        String plain = value.replaceAll("<[^>]*>", "").trim();
        return plain.length() <= 90 ? plain : plain.substring(0, 87) + "...";
    }

    private String text(String value) {
        return value == null ? "" : value;
    }

    private String html(String value) {
        return text(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String attr(String value) {
        return html(value);
    }
}
