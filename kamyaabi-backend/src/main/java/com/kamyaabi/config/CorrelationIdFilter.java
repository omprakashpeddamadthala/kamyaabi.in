package com.kamyaabi.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that assigns a correlation (trace) ID to every incoming HTTP
 * request and propagates it via SLF4J's {@link MDC}. The id is used as the
 * {@code correlationId} field in every log line (see {@code logback-spring.xml})
 * and is echoed back on the response as the {@code X-Correlation-Id} header so
 * clients (and front-end error reporters) can cite it.
 *
 * <p>If the caller already supplies an {@code X-Correlation-Id} header, it is
 * honoured verbatim; otherwise a random UUID is generated.
 *
 * <p>Ordered {@link Ordered#HIGHEST_PRECEDENCE} so it runs before Spring
 * Security and any logging-sensitive filters.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    /** Name of the request/response header carrying the correlation ID. */
    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    /** Key under which the correlation ID is stored in the SLF4J {@link MDC}. */
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        final String incoming = request.getHeader(CORRELATION_ID_HEADER);
        final String correlationId = (incoming != null && !incoming.isBlank())
                ? incoming
                : UUID.randomUUID().toString();
        try {
            MDC.put(MDC_KEY, correlationId);
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
