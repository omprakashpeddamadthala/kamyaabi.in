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
    private String companyName = "SM Enterprises";
    private String companyAddress = "House No. 2-114/5, Srinivasa Nagar, Aganampudi, Prasanthi Nagar, Visakhapatnam - 530053, Andhra Pradesh, India";
    private String companyEmail = "support@kamyaabi.in";
    private String companyPhone = "+91 9848999072";
    private String companyWebsite = "https://kamyaabi.in";
    private String logoUrl = "";
    private String currency = "INR";
    private String taxLabel = "GST";
    private String taxRate = "5%";
    private String refundPolicyNote = "Returns and refunds are handled as per Kamyaabi refund policy.";
}
