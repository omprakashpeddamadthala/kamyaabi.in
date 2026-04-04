package com.kamyaabi.email;

import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.event.OrderEventType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

/**
 * Renders professional HTML email templates for order events.
 * Each event type maps to a different email template with dynamic placeholders.
 */
@Component
public class EmailTemplateEngine {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public String getSubject(OrderEventType eventType, Order order) {
        return switch (eventType) {
            case ORDER_PLACED -> "Order Confirmed - #" + order.getId() + " | Kamyaabi";
            case ORDER_CONFIRMED -> "Payment Received - Order #" + order.getId() + " | Kamyaabi";
            case ORDER_PROCESSING -> "Order Being Processed - #" + order.getId() + " | Kamyaabi";
            case ORDER_SHIPPED -> "Order Shipped - #" + order.getId() + " | Kamyaabi";
            case ORDER_DELIVERED -> "Order Delivered - #" + order.getId() + " | Kamyaabi";
            case ORDER_CANCELLED -> "Order Cancelled - #" + order.getId() + " | Kamyaabi";
            case ORDER_FAILED -> "Order Failed - #" + order.getId() + " | Kamyaabi";
            case PAYMENT_SUCCESS -> "Payment Successful - Order #" + order.getId() + " | Kamyaabi";
            case PAYMENT_PENDING -> "Payment Pending - Order #" + order.getId() + " | Kamyaabi";
            case PAYMENT_FAILED -> "Payment Failed - Order #" + order.getId() + " | Kamyaabi";
        };
    }

    public String getAdminSubject(OrderEventType eventType, Order order) {
        return "[Admin] " + getSubject(eventType, order);
    }

    public String renderCustomerEmail(OrderEventType eventType, Order order) {
        String customerName = order.getUser().getName();
        return switch (eventType) {
            case ORDER_PLACED -> renderOrderPlacedEmail(customerName, order);
            case ORDER_CONFIRMED -> renderOrderConfirmedEmail(customerName, order);
            case ORDER_PROCESSING -> renderStatusChangeEmail(customerName, order, "Being Processed",
                    "Your order is now being processed and will be shipped soon.", "#2196F3");
            case ORDER_SHIPPED -> renderStatusChangeEmail(customerName, order, "Shipped",
                    "Great news! Your order has been shipped and is on its way.", "#FF9800");
            case ORDER_DELIVERED -> renderStatusChangeEmail(customerName, order, "Delivered",
                    "Your order has been delivered. We hope you enjoy your premium dry fruits!", "#4CAF50");
            case ORDER_CANCELLED -> renderStatusChangeEmail(customerName, order, "Cancelled",
                    "Your order has been cancelled. If you have any questions, please contact our support.", "#F44336");
            case ORDER_FAILED -> renderOrderFailedEmail(customerName, order);
            case PAYMENT_SUCCESS -> renderPaymentSuccessEmail(customerName, order);
            case PAYMENT_PENDING -> renderStatusChangeEmail(customerName, order, "Payment Pending",
                    "Your payment is being processed. We'll update you once it's confirmed.", "#FF9800");
            case PAYMENT_FAILED -> renderPaymentFailedEmail(customerName, order);
        };
    }

    public String renderAdminEmail(OrderEventType eventType, Order order) {
        String customerName = order.getUser().getName();
        String customerEmail = order.getUser().getEmail();
        return renderAdminNotificationEmail(eventType, customerName, customerEmail, order);
    }

    private String renderOrderPlacedEmail(String customerName, Order order) {
        return wrapInLayout(
                "Order Placed Successfully!",
                "#4CAF50",
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">Thank you for your order! We've received your order and it's being reviewed.</p>"
                + renderOrderDetailsSection(order)
                + renderItemsTable(order)
                + renderTotalSection(order)
                + "<p style=\"font-size:14px;color:#777;margin-top:20px;\">We'll send you another email once your payment is confirmed.</p>"
        );
    }

    private String renderOrderConfirmedEmail(String customerName, Order order) {
        return wrapInLayout(
                "Payment Received!",
                "#2196F3",
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">Your payment has been successfully received and your order is confirmed!</p>"
                + renderOrderDetailsSection(order)
                + renderItemsTable(order)
                + renderTotalSection(order)
                + "<p style=\"font-size:14px;color:#777;margin-top:20px;\">Your order will be processed and shipped soon. We'll keep you updated!</p>"
        );
    }

    private String renderStatusChangeEmail(String customerName, Order order, String statusLabel, String message, String color) {
        return wrapInLayout(
                "Order " + statusLabel,
                color,
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">" + message + "</p>"
                + renderOrderDetailsSection(order)
                + renderStatusBadge(statusLabel, color)
                + renderTotalSection(order)
        );
    }

    private String renderPaymentSuccessEmail(String customerName, Order order) {
        return wrapInLayout(
                "Payment Successful!",
                "#4CAF50",
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">Your payment has been successfully processed and your order is now confirmed!</p>"
                + renderOrderDetailsSection(order)
                + renderItemsTable(order)
                + renderTotalSection(order)
                + "<p style=\"font-size:14px;color:#777;margin-top:20px;\">Your order will be processed and shipped soon. We'll keep you updated!</p>"
        );
    }

    private String renderPaymentFailedEmail(String customerName, Order order) {
        return wrapInLayout(
                "Payment Failed",
                "#F44336",
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">Unfortunately, your payment could not be processed. Please try again or use a different payment method.</p>"
                + renderOrderDetailsSection(order)
                + renderTotalSection(order)
                + "<p style=\"font-size:14px;color:#777;margin-top:20px;\">If you were charged, a refund will be processed automatically within 5-7 business days.</p>"
        );
    }

    private String renderOrderFailedEmail(String customerName, Order order) {
        return wrapInLayout(
                "Order Failed",
                "#F44336",
                "<p style=\"font-size:16px;color:#333;\">Hi " + escapeHtml(customerName) + ",</p>"
                + "<p style=\"font-size:15px;color:#555;\">Unfortunately, there was an issue processing your order. Please try again or contact our support team.</p>"
                + renderOrderDetailsSection(order)
                + renderTotalSection(order)
                + "<p style=\"font-size:14px;color:#777;margin-top:20px;\">If you were charged, a refund will be processed automatically within 5-7 business days.</p>"
        );
    }

    private String renderAdminNotificationEmail(OrderEventType eventType, String customerName, String customerEmail, Order order) {
        String eventLabel = eventType.name().replace("ORDER_", "").replace("_", " ");
        return wrapInLayout(
                "Admin: Order " + eventLabel,
                "#673AB7",
                "<p style=\"font-size:16px;color:#333;\">New order event notification</p>"
                + "<table style=\"width:100%;border-collapse:collapse;margin:15px 0;\">"
                + "<tr><td style=\"padding:8px;font-weight:bold;color:#555;\">Event:</td><td style=\"padding:8px;color:#333;\">" + eventLabel + "</td></tr>"
                + "<tr><td style=\"padding:8px;font-weight:bold;color:#555;\">Customer:</td><td style=\"padding:8px;color:#333;\">" + escapeHtml(customerName) + "</td></tr>"
                + "<tr><td style=\"padding:8px;font-weight:bold;color:#555;\">Email:</td><td style=\"padding:8px;color:#333;\">" + escapeHtml(customerEmail) + "</td></tr>"
                + "</table>"
                + renderOrderDetailsSection(order)
                + renderItemsTable(order)
                + renderTotalSection(order)
        );
    }

    private String renderOrderDetailsSection(Order order) {
        String dateStr = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "N/A";
        String addressStr = "";
        if (order.getShippingAddress() != null) {
            addressStr = escapeHtml(order.getShippingAddress().getFullName()) + ", "
                    + escapeHtml(order.getShippingAddress().getStreet()) + ", "
                    + escapeHtml(order.getShippingAddress().getCity()) + ", "
                    + escapeHtml(order.getShippingAddress().getState()) + " - "
                    + escapeHtml(order.getShippingAddress().getPincode());
        }
        return "<div style=\"background:#f8f9fa;border-radius:8px;padding:15px;margin:15px 0;\">"
                + "<table style=\"width:100%;\">"
                + "<tr><td style=\"padding:5px 10px;font-weight:bold;color:#555;\">Order ID:</td><td style=\"padding:5px 10px;color:#333;\">#" + order.getId() + "</td></tr>"
                + "<tr><td style=\"padding:5px 10px;font-weight:bold;color:#555;\">Date:</td><td style=\"padding:5px 10px;color:#333;\">" + dateStr + "</td></tr>"
                + "<tr><td style=\"padding:5px 10px;font-weight:bold;color:#555;\">Status:</td><td style=\"padding:5px 10px;color:#333;\">" + order.getStatus().name() + "</td></tr>"
                + (addressStr.isEmpty() ? "" : "<tr><td style=\"padding:5px 10px;font-weight:bold;color:#555;\">Shipping:</td><td style=\"padding:5px 10px;color:#333;\">" + addressStr + "</td></tr>")
                + "</table></div>";
    }

    private String renderItemsTable(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return "";
        }
        String rows = order.getItems().stream()
                .map(this::renderItemRow)
                .collect(Collectors.joining());

        return "<table style=\"width:100%;border-collapse:collapse;margin:15px 0;\">"
                + "<thead><tr style=\"background:#f0f0f0;\">"
                + "<th style=\"padding:10px;text-align:left;border-bottom:2px solid #ddd;\">Item</th>"
                + "<th style=\"padding:10px;text-align:center;border-bottom:2px solid #ddd;\">Qty</th>"
                + "<th style=\"padding:10px;text-align:right;border-bottom:2px solid #ddd;\">Price</th>"
                + "<th style=\"padding:10px;text-align:right;border-bottom:2px solid #ddd;\">Subtotal</th>"
                + "</tr></thead><tbody>" + rows + "</tbody></table>";
    }

    private String renderItemRow(OrderItem item) {
        BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return "<tr>"
                + "<td style=\"padding:10px;border-bottom:1px solid #eee;color:#333;\">" + escapeHtml(item.getProduct().getName()) + "</td>"
                + "<td style=\"padding:10px;text-align:center;border-bottom:1px solid #eee;color:#555;\">" + item.getQuantity() + "</td>"
                + "<td style=\"padding:10px;text-align:right;border-bottom:1px solid #eee;color:#555;\">" + formatCurrency(item.getPrice()) + "</td>"
                + "<td style=\"padding:10px;text-align:right;border-bottom:1px solid #eee;color:#333;font-weight:bold;\">" + formatCurrency(subtotal) + "</td>"
                + "</tr>";
    }

    private String renderTotalSection(Order order) {
        return "<div style=\"text-align:right;margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;\">"
                + "<span style=\"font-size:18px;font-weight:bold;color:#333;\">Total: " + formatCurrency(order.getTotalAmount()) + "</span>"
                + "</div>";
    }

    private String renderStatusBadge(String status, String color) {
        return "<div style=\"text-align:center;margin:20px 0;\">"
                + "<span style=\"display:inline-block;padding:10px 25px;background:" + color + ";color:white;border-radius:25px;font-size:16px;font-weight:bold;\">"
                + status
                + "</span></div>";
    }

    private String wrapInLayout(String title, String headerColor, String bodyContent) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">"
                + "<title>" + escapeHtml(title) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;\">"
                + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;\">"
                + "<tr><td style=\"padding:20px 0;\">"
                + "<table role=\"presentation\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);\">"
                // Header
                + "<tr><td style=\"background:" + headerColor + ";padding:30px;text-align:center;\">"
                + "<h1 style=\"margin:0;color:#ffffff;font-size:24px;\">" + escapeHtml(title) + "</h1>"
                + "</td></tr>"
                // Body
                + "<tr><td style=\"padding:30px;\">" + bodyContent + "</td></tr>"
                // Footer
                + "<tr><td style=\"background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #eee;\">"
                + "<p style=\"margin:0 0 5px;color:#999;font-size:12px;\">Kamyaabi - Premium Dry Fruits</p>"
                + "<p style=\"margin:0;color:#bbb;font-size:11px;\">This is an automated email. Please do not reply directly.</p>"
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "\u20B90.00";
        return "\u20B9" + String.format("%,.2f", amount);
    }

    String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
