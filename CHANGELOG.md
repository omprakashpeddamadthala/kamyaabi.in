# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Backend — Observability**
  - `logback-spring.xml` with daily rolling file appender at
    `logs/application.log`, 10-day retention, 1 GB total size cap, and a
    separate `logs/error.log` for ERROR-level events.
  - `CorrelationIdFilter` populates SLF4J `MDC` with a per-request correlation
    id, echoes it back via `X-Correlation-Id`, and honours an incoming header.
  - Profile-aware log levels (DEBUG in `dev`, INFO in `prod`/`docker`).
- **Backend — Error handling**
  - `ApiErrorResponse` DTO (`timestamp`, `status`, `error`, `message`, `path`,
    `traceId`, `fieldErrors`) returned by every exception branch.
  - `BusinessException` (→ HTTP 422) for service-layer domain-rule violations.
  - `UnauthorizedException` now maps to HTTP 401 explicitly in the global
    handler.
- **Backend — Actuator**
  - `management.*` configuration exposing `health`, `info`, `metrics`,
    `loggers`, and `env`. Liveness/readiness probes enabled.
  - `/actuator/loggers` toggle for runtime log-level changes.
  - Custom `EmailProviderHealthIndicator` reporting the active email provider
    (`sendgrid` / `smtp` / `none`).
  - `info.app.name|version|description` metadata populated via
    `spring.application.name` and `@project.version@`.
- **Backend — Config & code quality**
  - `AppProperties` now `@Validated` with `@NotBlank` / `@Positive`
    constraints so misconfigured deployments fail fast at startup.
  - `AuthService#googleLoginFromRequest` centralises the legacy/new Google
    payload branching that previously lived in `AuthController`.
  - Javadoc added to public auth surfaces and new classes.
- **Frontend**
  - `src/config/index.ts` — single typed + runtime-validated entry point for
    every `VITE_*` env var. Required vars throw in prod builds, warn in dev.
    `src/config/brand.ts` becomes a deprecated shim.
  - `src/utils/logger.ts` — logger facade. No more direct `console.*` calls
    in app code.
  - `src/components/common/ErrorBoundary.tsx` — class-based router-level
    error boundary with a safe fallback UI.
  - `src/components/common/ApiErrorNotifier.tsx` — MUI Snackbar toast driven
    by `api:forbidden` / `api:server-error` window events emitted by the
    axios response interceptor (includes trace id when available).
  - Axios response interceptor now handles 403 and ≥500 in addition to 401,
    and extracts the correlation id from either the response header or the
    new error body.
- **Docs**
  - `ANALYSIS.md` — Phase 1 audit of the pre-refactor codebase.
  - `CONTRIBUTING.md` — branch/commit conventions, PR checklist, review guide.
  - `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/LOGGING.md`.
  - `docs/DEPLOYMENT.md` — moved from repo root, referenced from README.

### Changed

- Backend error responses: old `{ success:false, message, data }` envelope
  replaced with `ApiErrorResponse` shape described above.
- `application.yml` logging block reduced to framework level tuning;
  appenders/patterns now live in `logback-spring.xml`.
- Actuator `/actuator/health` and `/actuator/info` remain public for
  load-balancer probes and build metadata; every other actuator endpoint is
  now `ROLE_ADMIN`-gated.

### Removed

- Root-level `DEPLOYMENT.md` (now `docs/DEPLOYMENT.md`).

### Notes for API consumers

The success-path response shape (`ApiResponse<T>`) is **unchanged**. The
error-path response shape is **new** (`ApiErrorResponse`). Clients that
only branched on `error.response.status` (such as the React frontend in
this repo) require no code changes.

---

_Prior release history is tracked via merged PR descriptions on GitHub
until the first tagged release._
