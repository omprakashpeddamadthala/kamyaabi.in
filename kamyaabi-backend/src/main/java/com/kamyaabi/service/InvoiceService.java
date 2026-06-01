package com.kamyaabi.service;

import com.kamyaabi.invoice.InvoiceDocument;

public interface InvoiceService {

    InvoiceDocument generateInvoice(Long orderId);

    InvoiceDocument getInvoice(Long orderId, Long requesterUserId, boolean requesterAdmin);

    void generateInvoiceAfterPayment(Long orderId);
}
