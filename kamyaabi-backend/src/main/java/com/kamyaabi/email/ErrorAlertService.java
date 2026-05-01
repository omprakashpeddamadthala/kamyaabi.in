package com.kamyaabi.email;

import com.kamyaabi.config.CorrelationIdFilter;
import com.kamyaabi.config.EmailProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.List;

/**
 * Sends developer alert emails when an unhandled exception is intercepted —
 * either by the backend's {@code GlobalExceptionHandler} or by the frontend's
 * {@code ErrorBoundary} via the {@code /api/errors/report} endpoint.
 *
 * <p>The send is dispatched on the {@code emailTaskExecutor} so it never blocks
 * the request thread, and every send is wrapped in a try/catch so a mailer
 * failure can never bubble back into the application response.
 */
@Slf4j
@Service
public class ErrorAlertService {

    /** Cap on the rendered stack trace to keep emails small and prevent unbounded growth. */
    private static final int MAX_STACK_TRACE_CHARS = 8_000;

    private final EmailServiceFactory emailServiceFactory;
    private final EmailProperties emailProperties;
    private final String activeProfiles;

    public ErrorAlertService(EmailServiceFactory emailServiceFactory,
                             EmailProperties emailProperties,
                             @Value("${spring.profiles.active:default}") String activeProfiles) {
        this.emailServiceFactory = emailServiceFactory;
        this.emailProperties = emailProperties;
        this.activeProfiles = activeProfiles;
    }

    /**
     * Send a developer alert for a backend exception.
     */
    @Async("emailTaskExecutor")
    public void alertOnBackendException(Throwable throwable, HttpServletRequest request) {
        if (!shouldSend()) return;

        String requestPath = request != null ? request.getRequestURI() : "<unknown>";
        String requestMethod = request != null ? request.getMethod() : "<unknown>";
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        String traceId = MDC.get(CorrelationIdFilter.MDC_KEY);

        String subject = String.format("[Kamyaabi %s] Backend error: %s",
                activeProfiles,
                throwable.getClass().getSimpleName());

        String htmlContent = renderBackendErrorEmail(
                throwable,
                requestMethod + " " + requestPath,
                userAgent,
                traceId,
                Instant.now());

        sendToDevelopers(subject, htmlContent);
    }

    /**
     * Send a developer alert for a frontend exception reported by the
     * {@code ErrorBoundary} or a global window error handler.
     */
    @Async("emailTaskExecutor")
    public void alertOnFrontendException(String message,
                                         String stack,
                                         String componentStack,
                                         String url,
                                         String userAgent,
                                         String source,
                                         String traceId) {
        if (!shouldSend()) return;

        String safeMessage = trim(message, 500, "<no message>");
        String safeSource = trim(source, 100, "render");

        String subject = String.format("[Kamyaabi %s] Frontend error (%s): %s",
                activeProfiles,
                safeSource,
                safeMessage);

        String htmlContent = renderFrontendErrorEmail(
                safeMessage,
                stack,
                componentStack,
                url,
                userAgent,
                safeSource,
                traceId,
                Instant.now());

        sendToDevelopers(subject, htmlContent);
    }

    private boolean shouldSend() {
        if (!emailProperties.isEnabled()) {
            log.debug("Email notifications disabled, skipping developer alert");
            return false;
        }
        if (emailProperties.getDeveloperEmails() == null || emailProperties.getDeveloperEmails().isEmpty()) {
            log.debug("No developer emails configured (app.email.developer-emails); skipping alert");
            return false;
        }
        return true;
    }

    private void sendToDevelopers(String subject, String htmlContent) {
        List<String> recipients = emailProperties.getDeveloperEmails();
        EmailService service = emailServiceFactory.getEmailService();
        for (String recipient : recipients) {
            if (recipient == null || recipient.isBlank()) continue;
            try {
                service.sendEmail(recipient.trim(), subject, htmlContent);
                log.info("Developer error alert sent to {}", recipient);
            } catch (Exception sendFailure) {
                // Never propagate — the originating request must not be impacted.
                log.error("Failed to deliver developer error alert to {}: {}", recipient, sendFailure.getMessage());
            }
        }
    }

    private String renderBackendErrorEmail(Throwable throwable,
                                           String requestLine,
                                           String userAgent,
                                           String traceId,
                                           Instant timestamp) {
        String stack = renderStackTrace(throwable);
        return "<html><body style='font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;'>"
                + "<h2 style='color:#b00020;margin:0 0 12px;'>Kamyaabi backend error</h2>"
                + "<p><strong>Environment:</strong> " + escape(activeProfiles) + "</p>"
                + "<p><strong>Timestamp:</strong> " + escape(timestamp.toString()) + "</p>"
                + "<p><strong>Request:</strong> " + escape(requestLine) + "</p>"
                + (userAgent != null ? "<p><strong>User-Agent:</strong> " + escape(userAgent) + "</p>" : "")
                + (traceId != null ? "<p><strong>Trace id:</strong> " + escape(traceId) + "</p>" : "")
                + "<p><strong>Exception:</strong> " + escape(throwable.getClass().getName()) + "</p>"
                + "<p><strong>Message:</strong> " + escape(String.valueOf(throwable.getMessage())) + "</p>"
                + "<h3 style='margin:16px 0 6px;'>Stack trace</h3>"
                + "<pre style='background:#f5f5f0;padding:12px;border-radius:6px;overflow:auto;font-size:12px;'>"
                + escape(stack)
                + "</pre>"
                + "</body></html>";
    }

    private String renderFrontendErrorEmail(String message,
                                            String stack,
                                            String componentStack,
                                            String url,
                                            String userAgent,
                                            String source,
                                            String traceId,
                                            Instant timestamp) {
        return "<html><body style='font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;'>"
                + "<h2 style='color:#b00020;margin:0 0 12px;'>Kamyaabi frontend error</h2>"
                + "<p><strong>Environment:</strong> " + escape(activeProfiles) + "</p>"
                + "<p><strong>Timestamp:</strong> " + escape(timestamp.toString()) + "</p>"
                + "<p><strong>Source:</strong> " + escape(source) + "</p>"
                + (url != null ? "<p><strong>URL:</strong> " + escape(url) + "</p>" : "")
                + (userAgent != null ? "<p><strong>User-Agent:</strong> " + escape(userAgent) + "</p>" : "")
                + (traceId != null && !traceId.isBlank()
                        ? "<p><strong>Trace id:</strong> " + escape(traceId) + "</p>" : "")
                + "<p><strong>Message:</strong> " + escape(message) + "</p>"
                + (stack != null && !stack.isBlank()
                        ? "<h3 style='margin:16px 0 6px;'>Stack trace</h3>"
                            + "<pre style='background:#f5f5f0;padding:12px;border-radius:6px;overflow:auto;font-size:12px;'>"
                            + escape(trim(stack, MAX_STACK_TRACE_CHARS, ""))
                            + "</pre>"
                        : "")
                + (componentStack != null && !componentStack.isBlank()
                        ? "<h3 style='margin:16px 0 6px;'>Component stack</h3>"
                            + "<pre style='background:#f5f5f0;padding:12px;border-radius:6px;overflow:auto;font-size:12px;'>"
                            + escape(trim(componentStack, MAX_STACK_TRACE_CHARS, ""))
                            + "</pre>"
                        : "")
                + "</body></html>";
    }

    private static String renderStackTrace(Throwable throwable) {
        StringWriter writer = new StringWriter();
        throwable.printStackTrace(new PrintWriter(writer));
        String text = writer.toString();
        return trim(text, MAX_STACK_TRACE_CHARS, "");
    }

    private static String trim(String value, int maxChars, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        if (value.length() <= maxChars) return value;
        return value.substring(0, maxChars) + "\n…(truncated)";
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
