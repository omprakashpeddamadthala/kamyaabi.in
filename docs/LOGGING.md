# Logging

This document describes how Kamyaabi logs, where to find log output, and
how to correlate a specific browser request with a backend log line.

## Log levels

| Level | When to use                                                                 |
|-------|-----------------------------------------------------------------------------|
| DEBUG | Method-entry-with-params, verbose diagnostic data. **dev profile only.**    |
| INFO  | Significant business events: login, order created, payment verified.       |
| WARN  | Recoverable problem or unexpected-but-handled condition.                   |
| ERROR | Exception, failure, data-integrity issue. Always includes a stack trace.   |

Rule of thumb: if a log line is useful during a production incident, make it
INFO or higher. If it's only useful when debugging locally, make it DEBUG.

## Log format

```
2026-04-25 10:23:45.123 [INFO ] [correlationId=abc-123] [thread=http-nio-8080-exec-1] c.k.service.OrderService - Order created successfully | orderId=ORD-456 userId=USR-789
```

The format is defined in
[`kamyaabi-backend/src/main/resources/logback-spring.xml`](../kamyaabi-backend/src/main/resources/logback-spring.xml)
via `LOG_PATTERN`. When the MDC key is missing the field renders as `--`.

## Log files

| File                         | Content                                 | Rotation |
|------------------------------|-----------------------------------------|----------|
| `logs/application.log`       | all levels ≥ the configured threshold   | daily    |
| `logs/application-YYYY-MM-DD.log` | rolled historical files             | 10-day retention |
| `logs/error.log`             | ERROR-only stream for on-call alerting  | daily    |
| `logs/error-YYYY-MM-DD.log`  | rolled historical error files           | 10-day retention |

### Rolling policy

- `TimeBasedRollingPolicy` — rolls once per day.
- `maxHistory`: **10 days** — files older than 10 days are deleted automatically.
- `cleanHistoryOnStart`: `true` — clears stale history on app boot.
- `totalSizeCap`: **1 GB** — if the cumulative size crosses 1 GB, oldest files are
  pruned first.

The `logs/` directory is created relative to the working directory of the
Java process (in Docker Compose that's the container's `/app` by default).
It is git-ignored.

## Profiles

| Profile | Root level | `com.kamyaabi` level | Appenders                        |
|---------|------------|----------------------|----------------------------------|
| dev     | INFO       | DEBUG                | CONSOLE + FILE + ERROR_FILE      |
| prod    | INFO       | INFO                 | CONSOLE + FILE + ERROR_FILE      |
| docker  | INFO       | INFO                 | CONSOLE + FILE + ERROR_FILE      |
| (none)  | INFO       | INFO                 | CONSOLE only (safe fallback)     |

## Correlation id

Every HTTP request is tagged with a correlation id by
`com.kamyaabi.config.CorrelationIdFilter`:

1. If the incoming request carries an `X-Correlation-Id` header, it is reused.
2. Otherwise a random UUID is generated.
3. The id is written to SLF4J MDC under the key `correlationId`, so every
   log line fired for that request includes it.
4. The same id is echoed back on the response header.
5. Every `ApiErrorResponse` body also includes it as `traceId`.

### Correlating a user-visible error to a log line

1. User sees a toast like `Something went wrong on our end. (ref: abc-123)`.
2. Copy the `ref:` value (`abc-123`).
3. Grep the log files for that id:

   ```bash
   grep 'correlationId=abc-123' kamyaabi-backend/logs/application.log
   ```

4. Every log line from that request is pulled out in order. The final ERROR
   line points at the failing method and stack.

The frontend reads the id from the `X-Correlation-Id` response header or
from the `traceId` field of the error body (see `extractTraceId` in
`kamyaabi-frontend/src/api/axiosInstance.ts`) and renders it in the
`ApiErrorNotifier` toast.

## Changing log levels at runtime (no redeploy)

The Actuator loggers endpoint is enabled and admin-gated. To lower a package
to DEBUG in production for the next 15 minutes:

```bash
# Requires a JWT with ROLE_ADMIN on the production instance.
curl -u admin:$ADMIN_PASS -X POST \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":"DEBUG"}' \
  https://kamyaabi.shop/actuator/loggers/com.kamyaabi.service.impl.AuthServiceImpl
```

Restore default:

```bash
curl -u admin:$ADMIN_PASS -X POST \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":null}' \
  https://kamyaabi.shop/actuator/loggers/com.kamyaabi.service.impl.AuthServiceImpl
```

Exposed loggers and current levels:

```bash
curl -u admin:$ADMIN_PASS https://kamyaabi.shop/actuator/loggers
```

## Rules for adding logs

- **Always** use SLF4J (`private static final Logger log = LoggerFactory.getLogger(Cls.class);`
  or Lombok's `@Slf4j`). Never `System.out.println`.
- **Never** log secrets — tokens, passwords, PAN card / Aadhaar numbers, CVVs.
- For parameterised logs, prefer `log.info("Order created {}", orderId)` over
  `log.info("Order created " + orderId)`.
- In the frontend, use `utils/logger.ts`. No raw `console.*` in app code.
