package com.kamyaabi.exception;

/**
 * Thrown by service-layer code when a request is syntactically valid but violates a
 * domain/business rule (e.g. "cannot cancel an already-shipped order", "cart is empty",
 * "coupon expired"). Mapped to HTTP 422 Unprocessable Entity by the global handler.
 *
 * <p>Prefer this over {@link BadRequestException} when the input itself is well-formed
 * but the operation cannot be completed due to server-side business state.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
