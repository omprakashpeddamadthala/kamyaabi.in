package com.kamyaabi.invoice;

import com.kamyaabi.config.InvoiceProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component
public class InvoiceStorage {

    private final InvoiceProperties properties;

    public InvoiceStorage(InvoiceProperties properties) {
        this.properties = properties;
    }

    public String store(String filename, byte[] content) {
        try {
            Path directory = Paths.get(properties.getStorageDirectory()).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            Path target = directory.resolve(filename).normalize();
            Files.write(target, content);
            log.info("Stored invoice PDF at {}", target);
            return target.toString();
        } catch (IOException e) {
            throw new InvoiceGenerationException("Failed to store invoice PDF", e);
        }
    }

    public byte[] read(String invoiceUrl) {
        try {
            return Files.readAllBytes(resolve(invoiceUrl));
        } catch (IOException e) {
            throw new InvoiceGenerationException("Failed to read invoice PDF", e);
        }
    }

    public boolean exists(String invoiceUrl) {
        return invoiceUrl != null && !invoiceUrl.isBlank() && Files.exists(resolve(invoiceUrl));
    }

    private Path resolve(String invoiceUrl) {
        return Paths.get(invoiceUrl).toAbsolutePath().normalize();
    }
}
