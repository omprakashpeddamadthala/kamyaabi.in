package com.kamyaabi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.invoice")
public class InvoiceProperties {

    private String storageDirectory = "invoices";
    private String companyName = "Kamyaabi";
    private String companyAddress = "Premium Dry Fruits, India";
    private String companyEmail = "support@kamyaabi.in";
    private String companyPhone = "+91 9848999072";
    private String companyWebsite = "https://kamyaabi.in";
    private String logoUrl = "";
    private String currency = "INR";
    private String taxLabel = "GST";
    private String taxRate = "0%";
    private String refundPolicyNote = "Returns and refunds are handled as per Kamyaabi refund policy.";
}
