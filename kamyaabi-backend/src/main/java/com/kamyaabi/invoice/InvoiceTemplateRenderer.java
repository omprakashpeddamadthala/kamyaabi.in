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
import java.io.InputStream;
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
                <!DOCTYPE html>
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    @page { size: A4; margin: 12mm 15mm; }
                    * { box-sizing: border-box; }
                    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; font-size: 11px; line-height: 1.4; }
                    .header-table { display: table; width: 100%; margin-bottom: 15px; }
                    .logo { max-width: 180px; max-height: 60px; }
                    .logo-placeholder { width: 45px; height: 45px; border-radius: 8px; background: #232f3e; color: #febd69; font-size: 20px; font-weight: 800; text-align: center; line-height: 45px; margin-bottom: 5px; }
                    .muted { color: #555; font-size: 10.5px; }
                    .panel-row { display: table; width: 100%; margin-bottom: 15px; }
                    .panel { display: table-cell; width: 50%; border: 1px solid #ccc; padding: 10px; vertical-align: top; }
                    .panel + .panel { border-left: 0; }
                    .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #232f3e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; }
                    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ccc; }
                    table.items th { background: #f3f3f3; color: #111; padding: 8px; font-size: 10px; text-align: left; text-transform: uppercase; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; font-weight: bold; }
                    table.items td { padding: 8px; vertical-align: middle; border-bottom: 1px solid #ddd; border-right: 1px solid #ccc; }
                    table.items th:last-child, table.items td:last-child { border-right: 0; }
                    .num { text-align: right; white-space: nowrap; }
                    .thumb { width: 55px; height: 55px; border-radius: 4px; object-fit: cover; vertical-align: middle; border: 1px solid #ddd; }
                    .item-container { overflow: hidden; }
                    .item-name { font-weight: bold; font-size: 11.5px; color: #0066c0; text-decoration: none; }
                    .totals-wrap { width: 100%; margin-top: 15px; }
                    .totals { margin-left: auto; width: 45%; border: 1px solid #ccc; border-collapse: collapse; }
                    .totals td { padding: 6px 10px; border-bottom: 1px solid #eee; }
                    .totals tr:last-child td { border-bottom: 0; }
                    .totals .label { color: #555; }
                    .discount { color: #B12704; font-weight: bold; }
                    .grand td { background: #f3f3f3; color: #111; font-size: 13px; font-weight: bold; border-top: 1px solid #ccc; border-bottom: 0; }
                    .grand .label { color: #111; }
                    .payment-info { margin-top: 12px; font-size: 10.5px; border: 1px dashed #ccc; padding: 8px; background: #fafafa; display: inline-block; min-width: 300px; }
                    .footer { position: fixed; left: 0; right: 0; bottom: 0; border-top: 1px solid #ddd; padding-top: 6px; font-size: 9.5px; color: #555; }
                    .footer-table { width: 100%; }
                    .footer-table td { border: 0; padding: 0; }
                    .qr { width: 65px; height: 65px; }
                    .thanks { font-size: 12px; color: #111; font-weight: bold; margin-bottom: 3px; }
                    .page:after { content: counter(page); }
                    #watermark { position: fixed; top: 32%; left: 10%; width: 80%; text-align: center; opacity: 0.05; z-index: -1000; }
                    #watermark img { width: 450px; height: auto; }
                  </style>
                </head>
                <body>
                """
                + getWatermarkHtml()
                + header(invoiceNumber, invoiceDate, dueDate, order)
                + billTo(order)
                + itemsTable(order.getItems())
                + totals(subtotal, discount, total)
                + payment(order)
                + footer(orderStatusUrl)
                + "</body></html>";
    }

    private String header(String invoiceNumber, LocalDate invoiceDate, LocalDate dueDate, Order order) {
        String logoHtml = getLogoHtml();
        return "<table style=\"width: 100%; border-collapse: collapse; border: 0; margin-bottom: 15px;\">"
                + "<tr>"
                + "<td style=\"width: 50%; vertical-align: top; border: 0; padding: 0; text-align: left;\">"
                + "<div style=\"display: block; margin-bottom: 5px;\">" + logoHtml + "</div>"
                + "<div style=\"font-size: 16px; font-weight: bold; color: #111; margin-top: 5px;\">" + html(invoiceProperties.getCompanyName()) + "</div>"
                + "<div class=\"muted\" style=\"line-height: 1.4;\">"
                + html(invoiceProperties.getCompanyAddress()) + "<br/>"
                + "Email: " + html(invoiceProperties.getCompanyEmail()) + " | Phone: " + html(invoiceProperties.getCompanyPhone()) + "<br/>"
                + "Website: " + html(invoiceProperties.getCompanyWebsite())
                + "</div>"
                + "</td>"
                + "<td style=\"width: 50%; vertical-align: top; border: 0; padding: 0; text-align: right;\">"
                + "<div style=\"font-size: 20px; font-weight: bold; color: #232f3e; margin-bottom: 8px;\">TAX INVOICE</div>"
                + "<div class=\"muted\" style=\"line-height: 1.5;\">"
                + "<strong>Invoice No:</strong> " + html(invoiceNumber) + "<br/>"
                + "<strong>Invoice Date:</strong> " + invoiceDate.format(DISPLAY_DATE) + "<br/>"
                + "<strong>Order ID:</strong> #" + order.getId() + "<br/>"
                + "<strong>Order Date:</strong> " + (order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().format(DISPLAY_DATE) : invoiceDate.format(DISPLAY_DATE))
                + "</div>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<hr style=\"border: 0; border-top: 1px solid #ddd; margin: 15px 0;\"/>";
    }

    private String getWatermarkHtml() {
        // Try reading local logo from classpath first
        try (InputStream is = getClass().getResourceAsStream("/images/logo.png")) {
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(bytes);
                return "<div id=\"watermark\"><img src=\"data:image/png;base64," + base64 + "\" alt=\"Watermark\" /></div>";
            }
        } catch (Exception e) {
            // Ignore
        }

        String logoUrl = text(invoiceProperties.getLogoUrl());
        if (!logoUrl.isBlank() && logoUrl.startsWith("http")) {
            return "<div id=\"watermark\"><img src=\"" + attr(transformCloudinaryUrl(logoUrl, "w_150,h_150,c_fill,q_80")) + "\" alt=\"Watermark\" /></div>";
        }
        return "";
    }

    private String getLogoHtml() {
        // Try reading local logo from classpath first
        try (InputStream is = getClass().getResourceAsStream("/images/logo.png")) {
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                String base64 = Base64.getEncoder().encodeToString(bytes);
                return "<img class=\"logo\" src=\"data:image/png;base64," + base64 + "\" alt=\"Logo\" />";
            }
        } catch (Exception e) {
            // Ignore
        }

        String logoUrl = text(invoiceProperties.getLogoUrl());
        if (!logoUrl.isBlank() && logoUrl.startsWith("http")) {
            return "<img class=\"logo\" src=\"" + attr(transformCloudinaryUrl(logoUrl, "w_150,h_150,c_fill,q_90")) + "\" alt=\"Logo\" />";
        }
        return "<div class=\"logo-placeholder\">K</div>";
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
        )).replace("<br/><br/>", "<br/>");

        String statusLabel = order.getStatus() == null ? "PENDING" : order.getStatus().name().replace('_', ' ');
        boolean paid = order.getStatus() == Order.OrderStatus.PAID || order.getStatus() == Order.OrderStatus.CONFIRMED
                || order.getStatus() == Order.OrderStatus.PROCESSING || order.getStatus() == Order.OrderStatus.SHIPPED
                || order.getStatus() == Order.OrderStatus.DELIVERED;
        String paymentStatus = paid ? "PAID" : html(statusLabel);

        return "<div class=\"panel-row\"><div class=\"panel\"><div class=\"section-title\">Billing / Shipping Address</div>"
                + "<strong>" + html(name) + "</strong><br/>"
                + "Email: " + html(order.getUser().getEmail()) + "<br/>"
                + addressLines
                + (phone.isBlank() ? "" : "<br/>Phone: " + html(phone))
                + "</div><div class=\"panel\"><div class=\"section-title\">Seller / Order Details</div>"
                + "<strong>Sold By:</strong> " + html(invoiceProperties.getCompanyName()) + "<br/>"
                + html(invoiceProperties.getCompanyAddress()) + "<br/>"
                + "<strong>Payment Method:</strong> " + html(order.getPaymentMethod() == null || order.getPaymentMethod() == Order.PaymentMethod.PREPAID ? "Online Payment" : "Cash on Delivery") + "<br/>"
                + "<strong>Payment Status:</strong> " + paymentStatus
                + "</div></div>";
    }

    private String formatWeight(BigDecimal weightKg) {
        if (weightKg == null || weightKg.compareTo(BigDecimal.ZERO) == 0) return "";
        double kg = weightKg.doubleValue();
        if (kg >= 1.0) {
            if (kg == (long) kg) {
                return String.format("%d kg", (long) kg);
            } else {
                return String.format("%.1f kg", kg);
            }
        } else {
            double grams = kg * 1000.0;
            return String.format("%d g", Math.round(grams));
        }
    }

    private String itemsTable(List<OrderItem> items) {
        StringBuilder rows = new StringBuilder();
        BigDecimal taxRate = parseTaxRate(invoiceProperties.getTaxRate());
        String taxLabel = invoiceProperties.getTaxLabel();
        if ("GST".equalsIgnoreCase(taxLabel) || taxLabel == null || taxLabel.isBlank()) {
            taxLabel = "IGST";
        }

        if (items == null || items.isEmpty()) {
            rows.append("<tr><td colspan=\"8\" class=\"muted\">No line items recorded for this order.</td></tr>");
        } else {
            int index = 1;
            for (OrderItem item : items) {
                Product product = item.getProduct();
                String productName = product == null ? "Item" : product.getName();
                String productImageUrl = product == null ? "" : product.getMainImageUrl();
                BigDecimal unitInclusive = amount(item.getPrice());
                BigDecimal unitExclusive = unitInclusive;
                if (taxRate.compareTo(BigDecimal.ZERO) > 0) {
                    unitExclusive = unitInclusive.divide(BigDecimal.ONE.add(taxRate), 2, RoundingMode.HALF_UP);
                }
                int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                BigDecimal lineTotal = unitInclusive.multiply(BigDecimal.valueOf(quantity));
                String image = productImageUrl == null || productImageUrl.isBlank()
                        ? ""
                        : "<img class=\"thumb\" src=\"" + attr(transformCloudinaryUrl(productImageUrl, "w_150,h_150,c_fill,q_80")) + "\" alt=\"\" />";
                String sku = "SKU-" + (product == null || product.getId() == null ? "NA" : product.getId());
                
                BigDecimal weightKg = item.getWeightKg();
                String weightStr = formatWeight(weightKg);
                String qtyDisplay = String.valueOf(quantity);
                if (!weightStr.isEmpty()) {
                    qtyDisplay = quantity + " x " + weightStr;
                }

                String productUrl = buildProductUrl(product == null ? "" : product.getSlug());

                String itemContent;
                if (!image.isEmpty()) {
                    itemContent = "<table style=\"width: 100%; border: 0 !important; margin: 0 !important; padding: 0 !important; background: transparent !important;\">"
                            + "<tr>"
                            + "<td style=\"width: 65px; border: 0 !important; padding: 0 !important; background: transparent !important; vertical-align: middle;\">"
                            + (productUrl.isEmpty() ? image : "<a href=\"" + attr(productUrl) + "\">" + image + "</a>")
                            + "</td>"
                            + "<td style=\"border: 0 !important; padding: 0 0 0 10px !important; background: transparent !important; vertical-align: middle; text-align: left;\">"
                            + (productUrl.isEmpty() ? "<span class=\"item-name\">" + html(productName) + "</span>"
                                                    : "<a class=\"item-name\" href=\"" + attr(productUrl) + "\">" + html(productName) + "</a>")
                            + "</td>"
                            + "</tr>"
                            + "</table>";
                } else {
                    itemContent = productUrl.isEmpty() ? "<span class=\"item-name\">" + html(productName) + "</span>"
                                                       : "<a class=\"item-name\" href=\"" + attr(productUrl) + "\">" + html(productName) + "</a>";
                }

                BigDecimal lineTax = BigDecimal.ZERO;
                if (taxRate.compareTo(BigDecimal.ZERO) > 0) {
                    lineTax = lineTotal.multiply(taxRate).divide(BigDecimal.ONE.add(taxRate), 2, RoundingMode.HALF_UP);
                }
                String igstRateDisplay = invoiceProperties.getTaxRate();
                String igstAmountDisplay = money(lineTax);

                rows.append("<tr><td>").append(index++).append("</td><td>")
                        .append(itemContent)
                        .append("</td><td>").append(html(sku)).append("</td><td style=\"text-align: center;\">").append(qtyDisplay)
                        .append("</td><td class=\"num\">").append(money(unitExclusive)).append("</td><td style=\"text-align: center;\">").append(igstRateDisplay)
                        .append("</td><td class=\"num\">").append(igstAmountDisplay).append("</td><td class=\"num\">").append(money(lineTotal))
                        .append("</td></tr>");
            }
        }
        return "<div class=\"section-title\" style=\"margin-top: 15px;\">Order Items</div>"
                + "<table class=\"items\"><thead><tr>"
                + "<th style=\"width: 5%;\">#</th><th style=\"width: 35%;\">Item Description</th><th style=\"width: 10%;\">SKU</th><th style=\"width: 10%; text-align: center;\">Qty</th><th class=\"num\" style=\"width: 11%;\">Unit Price<br/>(excl. tax)</th><th style=\"width: 9%; text-align: center;\">" + taxLabel + "<br/>Rate</th><th class=\"num\" style=\"width: 10%;\">" + taxLabel + "<br/>Amount</th><th class=\"num\" style=\"width: 10%;\">Total<br/>(incl. tax)</th>"
                + "</tr></thead><tbody>" + rows + "</tbody></table>";
    }

    private BigDecimal parseTaxRate(String rateStr) {
        if (rateStr == null || rateStr.isBlank()) return BigDecimal.ZERO;
        try {
            String clean = rateStr.replace("%", "").trim();
            return new BigDecimal(clean).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private String totals(BigDecimal subtotal, BigDecimal discount, BigDecimal total) {
        BigDecimal taxRate = parseTaxRate(invoiceProperties.getTaxRate());
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal subtotalExcl = subtotal;
        BigDecimal discountExcl = discount;

        if (taxRate.compareTo(BigDecimal.ZERO) > 0) {
            taxAmount = total.multiply(taxRate).divide(BigDecimal.ONE.add(taxRate), 2, RoundingMode.HALF_UP);
            subtotalExcl = subtotal.divide(BigDecimal.ONE.add(taxRate), 2, RoundingMode.HALF_UP);
            discountExcl = discount.divide(BigDecimal.ONE.add(taxRate), 2, RoundingMode.HALF_UP);
        }

        String taxLabel = invoiceProperties.getTaxLabel();
        if ("GST".equalsIgnoreCase(taxLabel) || taxLabel == null || taxLabel.isBlank()) {
            taxLabel = "IGST";
        }

        return "<div class=\"totals-wrap\"><table class=\"totals\"><tbody>"
                + row("Subtotal (excl. tax)", money(subtotalExcl), "")
                + (discount.compareTo(BigDecimal.ZERO) > 0 ? row("Discount (excl. tax)", "-" + money(discountExcl), "discount") : "")
                + row(taxLabel + " (" + invoiceProperties.getTaxRate() + ")", money(taxAmount), "")
                + "<tr class=\"grand\"><td class=\"label\">Grand Total (incl. tax)</td><td class=\"num\">" + money(total) + "</td></tr>"
                + "</tbody></table></div>";
    }

    private String payment(Order order) {
        Payment payment = order.getPayment();
        String method = order.getPaymentMethod() == null || order.getPaymentMethod() == Order.PaymentMethod.PREPAID
                ? "Razorpay / Online" : "Cash on Delivery";
        String transaction = payment != null && payment.getRazorpayPaymentId() != null ? payment.getRazorpayPaymentId() : "N/A";
        return "<div class=\"payment-info\">"
                + "<strong>Payment Method:</strong> " + html(method) + "<br/>"
                + "<strong>Transaction ID:</strong> " + html(transaction)
                + "</div>";
    }

    private String footer(String orderStatusUrl) {
        return "<div class=\"footer\"><table class=\"footer-table\"><tr><td>"
                + "<div class=\"thanks\">Thank you for shopping with us!</div>"
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
            case "INR" -> "Rs. ";
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

    private String transformCloudinaryUrl(String url, String transform) {
        if (url == null || url.isBlank()) return "";
        if (url.contains("res.cloudinary.com")) {
            String transformed = url;
            if (url.contains("/upload/")) {
                transformed = url.replace("/upload/", "/upload/" + transform + "/");
            }
            int lastDot = transformed.lastIndexOf('.');
            if (lastDot > transformed.lastIndexOf('/')) {
                transformed = transformed.substring(0, lastDot);
            }
            return transformed + ".png";
        }
        return url;
    }

    private String buildProductUrl(String slug) {
        if (slug == null || slug.isBlank()) return "";
        String base = text(appProperties.getFrontendUrl()).isBlank() ? text(invoiceProperties.getCompanyWebsite()) : text(appProperties.getFrontendUrl());
        return base.replaceAll("/+$", "") + "/products/" + slug;
    }
}
