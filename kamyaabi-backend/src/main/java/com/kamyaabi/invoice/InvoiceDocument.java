package com.kamyaabi.invoice;

public record InvoiceDocument(
        Long orderId,
        String invoiceNumber,
        String invoiceUrl,
        String filename,
        byte[] content
) {
}
