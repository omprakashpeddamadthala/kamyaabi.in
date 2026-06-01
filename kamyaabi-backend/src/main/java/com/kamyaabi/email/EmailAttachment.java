package com.kamyaabi.email;

public record EmailAttachment(
        String filename,
        String contentType,
        byte[] content
) {
}
