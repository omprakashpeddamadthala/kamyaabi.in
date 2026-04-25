# Refactor Summary

This document lists every file changed by the production-grade refactor,
what changed, and why. See [`CHANGELOG.md`](./CHANGELOG.md) for a
user-facing Keep-a-Changelog entry and [`ANALYSIS.md`](./ANALYSIS.md) for
the pre-refactor audit that motivated these changes.

## 1. Added

### Backend

| File | Purpose |
|------|---------|
| `kamyaabi-backend/src/main/java/com/kamyaabi/config/CorrelationIdFilter.java` | Servlet filter (HIGHEST_PRECEDENCE) that generates / reuses `X-Correlation-Id`, writes it to SLF4J MDC under `correlationId`, and echoes it back on the response. |
| `kamyaabi-backend/src/main/resources/logback-spring.xml` | Profile-aware Logback config with console + daily-rolling `application.log` + ERROR-only `error.log`. 10-day `maxHistory`, `cleanHistoryOnStart=true`, 1 GB `totalSizeCap`. Renders MDC `correlationId` on every line. |
| `kamyaabi-backend/src/main/java/com/kamyaabi/dto/response/ApiErrorResponse.java` | New standard error DTO (`timestamp`, `status`, `error`, `message`, `path`, `traceId`, `fieldErrors`) returned by every `GlobalExceptionHandler` branch. |
| `kamyaabi-backend/src/main/java/com/kamyaabi/exception/BusinessException.java` | Domain-rule violation exception → HTTP 422. |
| `kamyaabi-backend/src/main/java/com/kamyaabi/config/EmailProviderHealthIndicator.java` | Custom Actuator health component reporting which email provider is active (`sendgrid`/`smtp`/`none`). |

### Frontend

| File | Purpose |
|------|---------|
| `kamyaabi-frontend/src/config/index.ts` | Single typed + runtime-validated access point for every `VITE_*` env var. Throws in prod if a required var is missing. |
| `kamyaabi-frontend/src/utils/logger.ts` | Logger facade. No more direct `console.*` calls in app code. |
| `kamyaabi-frontend/src/components/common/ErrorBoundary.tsx` | Class-based router-level error boundary with MUI fallback. |
| `kamyaabi-frontend/src/components/common/ApiErrorNotifier.tsx` | MUI Snackbar listening on `api:forbidden` / `api:server-error` window events from the axios interceptor, showing trace ids. |

### Documentation

| File | Purpose |
|------|---------|
| `ANALYSIS.md` | Phase 1 audit — findings + refactor plan. |
| `CONTRIBUTING.md` | Branch / commit conventions, PR checklist, review guidelines. |
| `CHANGELOG.md` | Keep-a-Changelog `[Unreleased]` entry. |
| `docs/ARCHITECTURE.md` | System architecture, layer rules, cross-cutting concerns, Mermaid diagrams. |
| `docs/API.md` | Endpoint catalogue, success/error envelopes, OAuth2 flow. |
| `docs/LOGGING.md` | Log levels, file paths, rotation policy, correlation-id lookup, `/actuator/loggers` runtime toggle. |

## 2. Modified

### Backend

| File | What changed | Why |
|------|--------------|-----|
| `application.yml` | Logging pattern/appenders removed (moved to `logback-spring.xml`); added `management.*` Actuator config exposing health/info/metrics/loggers/env; added `info.app.name|version|description`; `@project.version@` resource filtering. | Centralises log policy in the Logback file, enables runtime log-level tuning and build metadata for ops. |
| `exception/GlobalExceptionHandler.java` | Returns `ApiErrorResponse` for every branch; reads `HttpServletRequest` for `path`; pulls `traceId` from MDC; new 401 (`UnauthorizedException`) and 422 (`BusinessException`) branches; sanitised 500 message. | Uniform error shape across the API with trace-id correlation; no more inconsistent status mappings. |
| `security/SecurityConfig.java` | `/actuator/health` + `/actuator/info` remain public; every other `/actuator/**` now requires `ROLE_ADMIN`. | Prevents information disclosure through env/loggers/metrics in prod while keeping LB probes and build metadata public. |
| `config/AppProperties.java` | `@Validated` with `@NotBlank` / `@Positive` on each sub-group. | Fail-fast on misconfigured JWT / CORS / Razorpay instead of failing at the first request. |
| `controller/AuthController.java` | Removed inline `idToken` vs. user-info branching; now delegates to `authService.googleLoginFromRequest`. Added Javadoc. | Controllers should be thin adapters. Business branching moved to the service layer. |
| `service/AuthService.java` | Added `googleLoginFromRequest(Map)`; Javadoc for every method. | Service owns the legacy/modern branching. |
| `service/impl/AuthServiceImpl.java` | Implements `googleLoginFromRequest`. | See above. |
| `email/EmailServiceFactory.java` | Clarifying comment on why `@Autowired` is retained on the constructor (multi-ctor disambiguation for the test-only ctor). | Prevents accidental future removal that would break Spring instantiation. |

### Backend tests

| File | What changed |
|------|--------------|
| `test/.../exception/GlobalExceptionHandlerTest.java` | Rewritten to assert on `ApiErrorResponse` (status, error, message, path, traceId, fieldErrors); new cases for 401 Unauthorized and 422 Business. |
| `test/.../controller/AuthControllerTest.java` | Stubs now mock `googleLoginFromRequest` (single-entry) instead of the older `googleLogin` / `processGoogleUser` split. |

### Frontend

| File | What changed | Why |
|------|--------------|-----|
| `App.tsx` | Mounts `<ApiErrorNotifier/>`; wraps `<BrowserRouter>` / `<Suspense>` inside `<ErrorBoundary>`. | Global error boundary + server-error toast. |
| `api/axiosInstance.ts` | Uses `config.apiBaseUrl`; 401/403/500 all logged via `logger`; 403 and 5xx emit `api:forbidden` / `api:server-error` window events; `extractTraceId` reads correlation id from either header or body. | Parity with backend error shape + observable failure modes. |
| `config/brand.ts` | Now a thin shim re-exporting from `config/index.ts`. | Single source of truth for env vars. |
| `pages/LoginPage.tsx` | Reads `config.googleClientId`; replaces `console.error` with `logger.error`. | No more direct env reads or `console.*` in app code. |

### Documentation

| File | What changed |
|------|--------------|
| `README.md` | Added `## Environment variables` tables (backend + frontend), `## Scripts cheat-sheet`, and `## Additional documentation` index linking every other doc. |
| `DEPLOYMENT.md` → `docs/DEPLOYMENT.md` | Moved (git rename; content unchanged). |

## 3. Commits

Atomic Conventional Commits on branch `devin/1777124723-fullstack-refactor`:

1. `docs: add ANALYSIS.md — Phase 1 audit of backend, frontend, docs`
2. `feat(logging): add logback-spring.xml with 10-day rolling + CorrelationIdFilter`
3. `feat(exception): ApiErrorResponse + BusinessException, traceId in errors`
4. `feat(actuator): expose health/info/metrics/loggers + secure + custom email indicator`
5. `refactor(backend): move legacy auth branching to service, @Validated AppProperties, Javadoc`
6. `feat(frontend): ErrorBoundary, typed config, logger, expanded axios interceptors`
7. `docs: add CONTRIBUTING, CHANGELOG, ARCHITECTURE, API, LOGGING; move DEPLOYMENT.md under docs/; expand README`

## 4. Explicit non-goals (preserved on purpose)

- **Business logic unchanged.** No repository queries, service-level domain
  rules, Razorpay flows, or JPA mappings were altered.
- **Public API contracts unchanged on the success path.** `ApiResponse<T>`
  shape is untouched for 2xx responses. Only the error-path payload changed
  (to `ApiErrorResponse`), which the frontend already tolerates since it
  branches on HTTP status.
- **No major dependency upgrades.** Only existing Spring Boot / React / MUI
  / axios versions were used.
- **`entity/` package kept as-is.** The target spec prefers `model/` but
  renaming would break ~50 import sites across controllers/services/mappers
  and push the change outside this refactor's scope.
