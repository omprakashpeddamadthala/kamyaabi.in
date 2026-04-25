# Codebase Analysis — Kamyaabi (Spring Boot + React)

> Phase 1 deliverable for the production-grade refactor. This document captures the
> state of the codebase **before** any refactor work begins. Line/file counts and file
> paths are based on the `master` branch at the start of the refactor.

## 1. Project overview

- **Backend** — `kamyaabi-backend/` — Java 17, Spring Boot 3.2.5. ~100 `.java` source files.
- **Frontend** — `kamyaabi-frontend/` — React 18 + TypeScript 5.5 + Vite 5 + MUI 5 + Redux Toolkit. ~47 `.ts/.tsx` source files.
- **Infra** — Docker, Docker Compose, Nginx (reverse proxy + SSL via Certbot), GitHub Actions CI.
- **Business domain** — e-commerce (products, cart, checkout, orders, addresses, payments via Razorpay, Google OAuth2 login, transactional email via SendGrid/SMTP).

## 2. Top-level structure (observed)

```
kamyaabi.in/
├── kamyaabi-backend/
│   └── src/main/java/com/kamyaabi/
│       ├── KamyaabiApplication.java
│       ├── config/         (AppProperties, EmailProperties, CacheConfig, CorsConfig,
│       │                    SwaggerConfig, AsyncConfig, DataInitializer)
│       ├── controller/     (Auth, Product, Cart, Order, Payment, Profile, Address,
│       │                    Admin, Category)
│       ├── dto/
│       │   ├── request/
│       │   └── response/
│       ├── email/          (EmailService + SendGrid/SMTP impls + Factory + templates)
│       ├── entity/         (User, Product, Category, Cart, CartItem, Order,
│       │                    OrderItem, Payment, Address)
│       ├── event/          (OrderEvent + listener + publisher)
│       ├── exception/      (Custom exceptions + GlobalExceptionHandler)
│       ├── mapper/         (Entity ↔ DTO mappers — hand-written)
│       ├── repository/     (Spring Data JPA)
│       ├── security/       (JWT provider + filter, OAuth2 user service, CurrentUser)
│       ├── service/        (Interfaces + impl/ sub-package)
│       └── validation/     (IndianAddressValidator)
├── kamyaabi-frontend/
│   └── src/
│       ├── api/            (Axios instance + per-domain API modules)
│       ├── components/     (layout/, common/)
│       ├── config/         (brand.ts — domain/support-email constants)
│       ├── features/       (auth, cart, product, order — Redux slices)
│       ├── hooks/          (useAppDispatch.ts — minimal)
│       ├── pages/          (route-level pages — 12 total)
│       ├── routes/         (AppRoutes.tsx)
│       ├── store/          (Redux store)
│       ├── theme/          (MUI theme)
│       └── types/          (shared TS types)
├── nginx/                  (vm-nginx + container nginx configs)
├── .github/workflows/ci.yml
├── docker-compose.yml / docker-compose.prod.yml
├── deploy.sh, setup-vm-ssl.sh
└── README.md, DEPLOYMENT.md
```

## 3. Findings — backend

### 3.1 Structure
- Layered separation is **largely in place**: `controller / service / repository / entity / dto / mapper / exception`. Service interfaces live at the `service/` root with impls correctly nested under `service/impl/`.
- **Naming drift vs. target spec**: target uses `model/` and `constant/`; repo uses `entity/` and has no `constant/` or `util/` package. Since the spec explicitly forbids business-logic changes and a mass package rename would churn every import in the tree with zero runtime benefit, the refactor will **keep `entity/`** (idiomatic for JPA) and **add `constant/` + `util/`** packages as empty placeholders populated as needed.
- `email/` and `event/` are domain-adjacent utility packages that don't cleanly fit the target layout; they're left in place because each is internally cohesive (strategy/factory for email, Spring events for orders).

### 3.2 Exception handling
- `GlobalExceptionHandler` exists (`@RestControllerAdvice`) and handles `ResourceNotFoundException`, `BadRequestException`, `DuplicateResourceException`, `PaymentException`, `AccessDeniedException`, `MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `ClientAbortException`, and a catch-all `Exception`.
- **Gaps**:
  - Error payload is the existing `ApiResponse` envelope (`success / message / data`) — it does **not** include `timestamp`, `status`, `error`, `path`, or `traceId` as required by the refactor spec.
  - No dedicated `BusinessException` (→ 422) class.
  - No correlation/trace ID is propagated into error responses.
  - `MethodArgumentNotValidException` returns field errors in `data` but the response shape does not match the target `ApiErrorResponse` contract.

### 3.3 Logging
- All classes correctly use SLF4J (`@Slf4j` from Lombok or `LoggerFactory.getLogger`). **Zero `System.out.println`** — good.
- **No `logback-spring.xml`** — the project relies on Spring Boot's default console appender, with only a pattern/level override in `application.yml`. There is therefore **no**:
  - Rolling file appender under `logs/application.log`
  - 10-day retention policy or `cleanHistoryOnStart`
  - Separate `logs/error.log` appender
  - Profile-based DEBUG/INFO toggle
- **No correlation-ID filter / MDC**. Log lines have no per-request trace identifier, making production log correlation hard.

### 3.4 Actuator
- `spring-boot-starter-actuator` is on the classpath, but **`application.yml` contains no `management.*` block**. Only default endpoints (`/actuator/health`, `/actuator/info`) are exposed, and `info.*` is empty. No custom health indicators, no Prometheus integration, no role-based actuator security.

### 3.5 Configuration
- Three profile YAMLs exist (`dev`, `prod`, `docker`) — good.
- Secrets are correctly externalised through `${ENV_VAR}` placeholders (JWT secret, DB creds, OAuth client id/secret, Razorpay keys, SendGrid API key).
- **`AppProperties`** (`@ConfigurationProperties(prefix="app")`) already covers JWT / CORS / Razorpay. **`EmailProperties`** exists for the email stack.
- Gaps: no `@Validated` / `jakarta.validation` constraints on config properties (malformed secrets fail at runtime instead of at startup). No explicit `info.app.*` metadata block.

### 3.6 Coding standards
- `@Autowired` field-style injection is present in **one** place (`email/EmailServiceFactory`); all other classes use constructor injection — good overall.
- DTOs use Lombok `@Data/@Builder` — compliant with spec.
- Request DTOs mostly use `jakarta.validation` annotations; controllers use `@Valid` — good.
- **Business logic in controller**: `AuthController#googleLogin` inspects the request payload to branch between ID-token and legacy flows. This is service-layer concern.
- `AuthServiceImpl` uses `@Value("${spring.security.oauth2.client.registration.google.client-id}")` — spec prefers `@ConfigurationProperties` for grouped config, but a single scalar override is acceptable here.
- Javadoc coverage is uneven: most service interfaces and public controller methods lack class-level Javadoc. Given the scale of 100+ files and the "no business-logic changes" constraint, Javadoc will be added to **public API surfaces** (controllers, service interfaces, global exception handler, config/property classes) rather than every private helper.
- No unused imports / dead commented-out blocks found in a grep sweep.

### 3.7 Tests
- `kamyaabi-backend/src/test/java/com/kamyaabi/...` exists with unit tests + JaCoCo wired in `pom.xml`. Tests build and run under Maven in CI. This refactor will not touch test contracts.

## 4. Findings — frontend

### 4.1 Structure
- `src/` already has `api/`, `components/`, `config/`, `features/`, `hooks/`, `pages/`, `routes/`, `store/`, `theme/`, `types/`.
- Gaps vs. spec: no `layouts/` (current layout lives in `components/layout/` — fine, will stay), no `constants/`, no `utils/`, and `config/` contains only `brand.ts` (no `index.ts` with typed + validated env vars).

### 4.2 TypeScript & coding standards
- `tsconfig.app.json` already sets `"strict": true`. **Zero `any` types** found via grep — good.
- `"noUnusedLocals"` and `"noUnusedParameters"` are **disabled**. The refactor will leave these as-is to avoid a repo-wide cleanup pass; tightening them is a follow-up.
- Named exports are used for slices / APIs; pages use default exports — matches spec.
- API calls are cleanly isolated in `src/api/` modules — good.
- **`console.error` usage**: exactly one occurrence in `pages/LoginPage.tsx`. Everything else is clean.

### 4.3 Error handling
- **No `ErrorBoundary`** wrapping routes — an uncaught render error today unmounts the whole app.
- Axios interceptor handles **401 only** (clears session + redirects to `/login`). **403 and 500 are not handled**; there is no toast/notification surface and no structured logging of API errors.
- API hooks/slices handle loading + error states, but empty-state handling is inconsistent across pages.

### 4.4 Environment / config
- Env vars are read ad-hoc from `import.meta.env` (e.g. in `api/axiosInstance.ts`, `config/brand.ts`, `pages/LoginPage.tsx`).
- **No `src/config/index.ts`** centralising + validating env vars with type-safe access. Missing vars silently fall back to empty strings at runtime.
- `.env.example` is present at repo root (shared by frontend + backend). No `.env.development` / `.env.production` in the frontend.

## 5. Findings — documentation

- `README.md` — present, reasonably complete (tech stack, structure, quickstart).
- `DEPLOYMENT.md` — present, detailed (VM + Nginx + Certbot). Will be moved into `docs/DEPLOYMENT.md` and the root copy removed to match the spec layout.
- **Missing**: `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/LOGGING.md`.

## 6. Refactor plan (phased, atomic commits)

| # | Commit                                                                                     | Scope |
|---|--------------------------------------------------------------------------------------------|-------|
| 1 | `docs: add ANALYSIS.md — Phase 1 audit of backend, frontend, docs`                         | this file |
| 2 | `feat(logging): add logback-spring.xml with 10-day rolling policy + CorrelationIdFilter`   | backend |
| 3 | `feat(exception): add ApiErrorResponse DTO + BusinessException + traceId in error payload` | backend |
| 4 | `feat(actuator): expose health/info/metrics/prometheus, add custom DB health, info.app.*`  | backend |
| 5 | `refactor(config): @Validated ConfigurationProperties, remove @Autowired, move legacy auth branch to service` | backend |
| 6 | `feat(frontend): ErrorBoundary, expand axios interceptors (403/500), toast + logger util`  | frontend |
| 7 | `feat(frontend): src/config/index.ts with runtime env validation, replace ad-hoc reads`    | frontend |
| 8 | `docs: add CONTRIBUTING, CHANGELOG, ARCHITECTURE, API, LOGGING; move DEPLOYMENT.md under docs/; update README` | docs |
| 9 | `docs: REFACTOR_SUMMARY.md — every file changed, what, why`                                | docs |

## 7. Explicit non-goals (to preserve contracts)

- **Do not** rename `entity/ → model/` — breaks 50+ imports with no runtime benefit.
- **Do not** change public REST paths, request shapes, or success-response shapes.
- **Do not** bump Spring Boot / React / any other major dependency.
- **Do not** modify business logic. Bug fixes only if clearly broken and in scope.
- **Do not** touch existing tests beyond what's required for compilation (none expected).

## 8. Expected error-response shape change (additive / accepted)

The refactor adds a dedicated `ApiErrorResponse` payload for error paths:

```json
{
  "timestamp": "2026-01-15T10:23:45.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable message",
  "path": "/api/resource",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldErrors": { "fieldName": "must not be blank" }
}
```

This **supersedes** the prior `{ success:false, message, data }` error shape. The frontend
currently does not consume the error body keys (it branches only on `error.response?.status`),
so no frontend changes are required for the wire-level shape change. The change is called
out here for downstream API consumers.
