# Kamyaabi Backend — Project Specification

Status: **Baseline (documents the system as it exists on `master`, commit `fa2c5d4`).**
Any new feature must add a section under §22 "Change Log / Pending Changes" and be approved before implementation.

---

## 1. Application Purpose

Kamyaabi is a D2C eCommerce platform selling premium dry fruits in India (kamyaabi.in / kamyaabi.shop).
This Spring Boot service is the REST API behind the React storefront and admin panel. It handles:

- Product catalog (categories, products, variations, images, tags, FAQs, reviews).
- Cart, wishlist, addresses, checkout, coupons.
- Payments (Razorpay prepaid + Cash on Delivery).
- Order lifecycle, invoices (PDF), shipping via Shiprocket, delivery estimates.
- Blog (CMS), hero banners, gallery, site settings.
- SEO artefacts: sitemaps, robots.txt, slugs, product SEO metadata.
- Transactional email and admin/developer error alerts.

## 2. Target Users

| User | Description |
|---|---|
| Anonymous visitor | Browses catalog, blog, tracks orders, checks pincode serviceability. |
| Customer (`USER`) | Logs in with Google or WhatsApp OTP; manages cart, wishlist, addresses, orders, reviews, profile. |
| Admin (`ADMIN`) | Manages catalog, orders, users, coupons, blog, banners, settings, shipping, CSV import/export. |
| Search engines | Crawl sitemaps / robots.txt. |
| External systems | Shiprocket webhook callbacks. |

## 3. Java Version

Java **21** (LTS). Build and runtime images use Eclipse Temurin 21.

## 4. Spring Boot Version

Spring Boot **4.1.1** (Spring Framework 7, Jackson 3). Upgraded from 3.2.5 — see `MIGRATION_REPORT.md`.
This intentionally overrides the "Spring Boot 3.x" default in CLAUDE.md §5.

## 5. Technology Stack

| Area | Technology |
|---|---|
| Build | Maven 3.9 |
| Web | spring-boot-starter-webmvc, RestTemplate (starter-restclient) |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL (prod), H2 in-memory (dev/test) |
| Migrations | Flyway 13.3.0 (`db/migration`, V0–V29) — enabled in prod only |
| Security | Spring Security, OAuth2 Client (Google), JJWT 0.12.5 (HS256) |
| Validation | Jakarta Bean Validation + custom `IndianAddressValidator` |
| Cache | Spring Cache + Caffeine (`maximumSize=500, expireAfterWrite=10m`) |
| API docs | springdoc-openapi 3.1.0 (`/swagger-ui.html`, `/api-docs`) |
| Monitoring | Spring Boot Actuator, custom `EmailProviderHealthIndicator` |
| Logging | SLF4J + Logback (`logback-spring.xml`), correlation-ID MDC |
| Payments | Razorpay Java SDK 1.4.6 |
| Media | Cloudinary 1.37.0 |
| Email | SendGrid 4.10.2 / SMTP (spring-boot-starter-mail) |
| Invoices | OpenHTMLtoPDF 1.0.10, ZXing 3.5.3 (QR) |
| Google login | google-api-client 2.2.0 (ID-token verification) |
| CSV | Apache Commons CSV 1.11.0 |
| Boilerplate | Lombok |
| Tests | JUnit 5, Mockito, Spring Boot Test, MockMvc, spring-security-test, JaCoCo (≥ 80 % line coverage gate) |

## 6. Application Architecture

Layered monolith:

```
Nginx (host, TLS) ──► frontend container (React/Vite, prerendered) ──► backend container (Spring Boot :8080) ──► PostgreSQL
                                                                         ├─► Razorpay, Shiprocket, Cloudinary
                                                                         ├─► SendGrid / SMTP, ChatMitra (WhatsApp)
                                                                         └─► Google (OAuth2 / ID token)
```

- **Controller** → thin, validates input, returns `ApiResponse<T>` or raw XML/text for SEO endpoints.
- **Service (interface + `impl`)** → business logic and transactions.
- **Repository** → Spring Data JPA.
- **Mapper** → hand-written entity ↔ DTO mappers.
- **Events** → `OrderEventPublisher` emits `OrderEvent`; `OrderEventListener` (after commit → emails) and
  `ShiprocketEventListener` (async, after commit → create shipment).
- **Async executors** → `emailTaskExecutor`, `invoiceTaskExecutor` (`AsyncConfig`).
- **Schedulers** → blog scheduled-publish job (every 5 min); Shiprocket retry job (`app.shiprocket.retry-interval-ms`, default 5 min).

## 7. Module and Package Structure

Base package `com.kamyaabi`:

| Package | Contents |
|---|---|
| `config` | AppProperties, Async, Cache, CORS, Cloudinary, CorrelationIdFilter, DataInitializer, EmailProperties, HTTP caching, Invoice/Shiprocket/ProductImage properties, Jackson, Multipart, RestTemplate, Swagger, CategorySlugBackfill |
| `controller` | 33 REST controllers (see §8) |
| `dto/request`, `dto/response` | Java records for API contracts |
| `email` | EmailService (SendGrid/SMTP via factory), templates, order emails, error alerts, admin recipient resolver |
| `entity` | 26 JPA entities (see §10) |
| `event` | Order events + listeners |
| `exception` | Custom exceptions + `GlobalExceptionHandler` |
| `invoice` | Invoice document, HTML template, PDF renderer, storage |
| `mapper` | Entity ↔ DTO mappers |
| `repository` | Spring Data repositories |
| `security` | SecurityConfig, JWT filter/provider, OAuth2 user service, CurrentUser |
| `service`, `service/impl` | Business services |
| `service/shiprocket` | Shiprocket API/auth clients, endpoints, parser, status mapper |
| `service/whatsapp`, `service/impl/whatsapp` | ChatMitra WhatsApp OTP |
| `util` | CacheNames, JsonFieldConverter, Slugifier |
| `validation` | IndianAddressValidator |

## 8. REST API Endpoints

Legend: **P** = public, **A** = authenticated user, **ADM** = `ROLE_ADMIN`.

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/google` (ID token login) | P |
| GET | `/api/auth/success`, `/api/auth/failure` (OAuth2 redirect) | P |
| GET | `/api/auth/me` | P (route) / returns current user if token present |
| GET | `/api/auth/whatsapp/status` | P |
| POST | `/api/auth/whatsapp/send-otp`, `/api/auth/whatsapp/verify-otp` | P |

### Catalog (public reads)
| Method | Path | Access |
|---|---|---|
| GET | `/api/products`, `/api/products/{id}`, `/api/products/slug/{slug}`, `/api/products/{id}/redirect`, `/api/products/category/{categoryId}`, `/api/products/tag/{tagSlug}`, `/api/products/search`, `/api/products/featured` | P |
| GET | `/api/products/{productId}/faqs` | P |
| GET | `/api/products/{productId}/reviews`, `/reviews/summary` | P |
| POST/PUT | `/api/products/{productId}/reviews[/{reviewId}]` (multipart) | A |
| GET | `/api/categories`, `/api/categories/{id}` | P |
| GET | `/api/product-tags` | P |
| GET | `/api/hero-banners`, `/api/gallery`, `/api/settings/public` | P |

### Blog (public)
`GET /api/blog/posts`, `/posts/{slug}`, `/posts/{id}/related`, `/categories`, `/categories/{slug}`, `/tags`, `/tags/{slug}`, `/sitemap.xml`, `/rss` — P
`POST /api/blog/posts/{id}/view` — P

### Customer
| Method | Path | Access |
|---|---|---|
| GET/POST, PUT/DELETE `{id}`, PUT `{id}/default` | `/api/addresses` | A |
| GET | `/api/addresses/states`, `/states/{state}/cities` | A |
| GET, POST/PUT/DELETE `/items[/{itemId}]` | `/api/cart` | A |
| GET, POST/DELETE `/items/{productId}`, GET `/check/{productId}`, `/product-ids` | `/api/wishlist` | A |
| GET, PUT | `/api/profile` | A |
| GET `/available`, POST `/validate`, POST `/apply` | `/api/coupons` | A |
| POST, GET, GET `/{id}`, GET `/{id}/invoice`, POST `/{id}/refresh-status` | `/api/orders` | A |
| POST | `/api/payments/create-order`, `/api/payments/verify` | A |
| GET | `/api/delivery/estimate` (P), `/api/delivery/cached-estimate` (A) | mixed |
| GET | `/api/shipping/track/**`, `/api/shipping/serviceability` | P |
| POST | `/api/errors/report` (frontend error reporting) | P |

### Webhooks
`POST /api/webhooks/shiprocket` — P (see §12 open issue).

### Admin (`/api/admin/**`, all ADM)
- `AdminController`: `dashboard/stats`, `analytics`, products CRUD + `restore` + `status` + image delete, categories CRUD, orders list / status / invoice, users list / role / status, settings get / metadata / put.
- `products/export/csv`, `products/import/csv`, `orders/export/csv`, `orders/import/csv`.
- `blog/posts` CRUD + `publish` / `unpublish`, `blog/media/upload`, `blog/categories` CRUD, `blog/tags` CRUD.
- `coupons` CRUD (PATCH update).
- `hero-banners` CRUD (multipart create), `status`, `reorder`.
- `package-dimension-settings` CRUD + `status`.
- `product-tags` CRUD + `{sourceId}/merge/{targetId}`.
- `reviews` list / delete.
- `shiprocket/stats`, `orders`, `sync/{orderId}`, `refresh-all`, `track/{orderId}`.
- `gallery/upload`, `gallery/{id}` delete.

### SEO (root, public)
`GET /sitemap-index.xml`, `/sitemap.xml`, `/products-sitemap.xml`, `/blogs-sitemap.xml`, `/categories-sitemap.xml`, `/images-sitemap.xml`, `/robots.txt`

### Ops
- `/actuator/health`, `/actuator/health/**`, `/actuator/info` — P
- `/actuator/metrics`, `/loggers`, `/env` — ADM
- `/swagger-ui/**`, `/api-docs/**` — P

## 9. Request and Response Structures

**Success wrapper** (`ApiResponse<T>`, nulls omitted):
```json
{ "success": true, "message": "optional", "data": { } }
```

**Error body** (`ApiErrorResponse`):
```json
{
  "timestamp": "2026-11-11T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Cart is empty",
  "path": "/api/orders",
  "traceId": "<correlation id>",
  "fieldErrors": { "pincode": "must be 6 digits" }
}
```

- Requests are Java records in `dto/request` with Bean Validation annotations.
- Responses are records in `dto/response`; entities are never returned directly.
- SEO endpoints return `application/xml` / `text/plain` without the wrapper.
- Jackson: `default-property-inclusion: non_null`.

## 10. Database Schema and Relationships

PostgreSQL in prod, managed by Flyway (`V0__initial_schema.sql` … `V29__create_package_dimension_settings.sql`).

| Table | Key relationships / constraints |
|---|---|
| `users` | unique email, unique phone; `role` ∈ {USER, ADMIN}; `status` ∈ {ACTIVE, BLOCKED, REMOVED} |
| `addresses` | N:1 users |
| `carts` | 1:1 users (unique `user_id`) |
| `cart_items` | N:1 carts, N:1 products |
| `wishlists` | 1:1 users (unique `user_id`) |
| `wishlist_items` | N:1 wishlists, N:1 products |
| `categories` | unique name, unique slug; self-parent |
| `products` | N:1 categories; unique slug; SEO fields (V10) |
| `product_images` | N:1 products |
| `product_tags` | unique name, unique slug; M:N with products (V9) |
| `reviews` | N:1 products, N:1 users |
| `faqs` | N:1 products |
| `orders` | N:1 users, N:1 addresses (shipping), 1:1 payments, N:1 coupons; Shiprocket fields; invoice fields; `status` ∈ {PENDING, PAID, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, PAYMENT_FAILED}; `payment_method` ∈ {PREPAID, COD} |
| `order_items` | N:1 orders, N:1 products; weight snapshot (V18) |
| `payments` | 1:1 orders (unique `order_id`); `status` ∈ {PENDING, COMPLETED, FAILED, REFUNDED} |
| `coupons` | unique code; `discount_type` ∈ {PERCENTAGE, FLAT}; `is_active`, `expires_at` |
| `coupon_usages` | N:1 coupons, users, orders |
| `blog_posts` | unique slug; N:1 users (author); `status` ∈ {DRAFT, PUBLISHED, SCHEDULED} |
| `blog_categories` | unique name/slug; self-parent |
| `blog_tags` | unique name/slug |
| `hero_banners`, `gallery_images` | standalone, ordered |
| `settings` | key/value site settings (typed via `SettingsCatalog`) |
| `package_dimension_settings` | unique `package_weight_gram` |
| `user_delivery_estimates` | 1:1 users |
| `whatsapp_otp_verifications` | `purpose` ∈ {LOGIN, SIGNUP}; expiry, attempt counters |

## 11. Authentication and Authorization

- **Google OAuth2** (redirect flow, `CustomOAuth2UserService`) and **Google ID-token** login (`POST /api/auth/google`).
- **WhatsApp OTP** via ChatMitra (toggleable by setting `WHATSAPP_OTP_AUTH_ENABLED`).
- On success the backend issues a **JWT (HS256)**, expiry **2 h**, secret from `JWT_SECRET`.
- `JwtAuthenticationFilter` reads `Authorization: Bearer <token>`.
- Roles: `USER`, `ADMIN`. `/api/admin/**` and sensitive actuator endpoints require `ROLE_ADMIN`; `@EnableMethodSecurity` is on.
- Blocked/removed users must not obtain or use tokens.
- No refresh token; users re-login after expiry.

## 12. Security Requirements

Current controls:
- CSRF disabled (stateless Bearer API); CORS restricted to `CORS_ALLOWED_ORIGINS`.
- Razorpay payment signature verification; duplicate verification is idempotent.
- OTP: 6 digits, 5-minute expiry, max 3 attempts, max 3 requests per phone per window, max 10 per IP per hour.
- Global exception handler never returns stack traces.
- All secrets come from environment variables (prod profile).
- Uploads: content-type validated in service layer.

**Open security items (found during baseline review — need a decision, not yet changed):**
0. **CRITICAL — login without proof.** `POST /api/auth/google` without an `idToken` falls back to `processGoogleUser(request)` (`AuthServiceImpl.googleLoginFromRequest`). That path trusts the caller-supplied `email` and issues a JWT for that account, **including ADMIN accounts**, in every profile, production included. The real frontend login always sends `idToken`; only the localhost "dev login" uses this path. Fix: remove the legacy branch, or allow it only in the `dev` profile.
1. `ShiprocketWebhookController` is public and `app.shiprocket.webhook-secret` is configured but **never checked** in code.
2. `/h2-console/**` is `permitAll` in all profiles (harmless in prod only because H2 is not used there).
3. `docker-compose.prod.yml` supplies a **default `JWT_SECRET`** if none is set — prod should fail fast instead.
4. Upload size limits are fully disabled (`-1`); only Nginx limits the body size.
5. Session policy is `IF_REQUIRED` (needed for the OAuth2 redirect flow); the rest of the API is stateless.

## 13. Business Rules

- **Stock**: order creation fails with `Insufficient stock` if any item exceeds stock. Stock is deducted when an order becomes `CONFIRMED` (COD orders are created `CONFIRMED`; prepaid orders are created `PENDING` and move to `PAID` after Razorpay verification, then admin confirms).
- **Cart**: cannot place an order from an empty cart; the shipping address must belong to the user.
- **Coupons**: codes are unique (normalized); `PERCENTAGE` ≤ 100 %; must be active and not expired; usage is recorded per user/order.
- **Order status change** publishes an `OrderEvent` → customer/admin email; cancelling an order with a Shiprocket ID cancels the shipment.
- **Shiprocket**: shipment created asynchronously after commit; failed syncs are retried by a scheduler; tracking status is mapped to order status.
- **Invoices**: PDF generated asynchronously, stored on disk (`INVOICE_STORAGE_DIRECTORY`), downloadable by the owner or an admin.
- **Reviews**: limited number of images per review (`MAX_REVIEW_IMAGES`).
- **Blog**: `SCHEDULED` posts are auto-published by a 5-minute job; only `PUBLISHED` posts are public.
- **Products**: soft delete + restore; only active products are public; slug changes support redirects (`/{id}/redirect`).
- **Package dimensions**: shipping weight/dimensions are resolved from `package_dimension_settings` by weight in grams, falling back to Shiprocket defaults.
- **Admin email recipients** = active users with role `ADMIN`.

## 14. External Integrations

| Service | Purpose | Config |
|---|---|---|
| Google | OAuth2 login / ID-token verification | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Razorpay | Prepaid payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Shiprocket | Shipments, tracking, serviceability, webhook | `SHIPROCKET_*` |
| Cloudinary | Product/banner/gallery/blog/review images | `CLOUDINARY_*` |
| SendGrid / SMTP | Transactional email | `SENDGRID_API_KEY`, `SMTP_*`, `EMAIL_*` |
| ChatMitra | WhatsApp OTP | `CHATMITRA_*` |

## 15. Exception-Handling Strategy

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps:

| Exception | HTTP |
|---|---|
| `ResourceNotFoundException` | 404 |
| `BadRequestException`, `HttpMessageNotReadableException`, `MethodArgumentNotValidException` (with `fieldErrors`) | 400 |
| `UnauthorizedException` | 401 |
| `AccessDeniedException` | 403 |
| `DuplicateResourceException`, `DataIntegrityViolationException` | 409 |
| `BusinessException` | 422 |
| `PaymentException` | 400 |
| `MaxUploadSizeExceededException` | 413 |
| `ClientAbortException` | ignored (client disconnected) |
| `Exception` | 500 + async error-alert email to developers |

## 16. Logging and Monitoring

- Logback with profile-aware rolling files (`LOG_HOME`, daily rotation, 10-day retention); logs bind-mounted to `./logs` in prod.
- `CorrelationIdFilter` puts a correlation ID into MDC and returns it as `traceId` in errors.
- Log levels can be changed at runtime via `/actuator/loggers` (admin only).
- Actuator: health (with probes and email provider health), info (build/git), metrics, loggers, env.
- Unhandled errors and frontend-reported errors trigger developer alert emails.
- Never log tokens, OTPs, passwords, or API keys.

## 17. Performance Requirements

- Caffeine cache for categories, products, product by id/slug, products by category, featured products, settings (10 min TTL, evicted on admin writes).
- HTTP compression for JSON/XML/text > 1 KB; HTTP caching headers (`HttpCachingConfig`).
- `open-in-view: false`; pagination for product/order/admin lists.
- Slow external calls (email, invoice, Shiprocket, delivery estimates) run asynchronously.
- Target: catalog read APIs p95 < 300 ms on a warm cache.

## 18. SEO Requirements

- Backend: sitemap index + split sitemaps (products, blogs, categories, images), `robots.txt` referencing the sitemap, unique slugs for products/categories/blog/tags, product SEO fields (title, description, keywords), blog RSS, `/api/products/{id}/redirect` for old id-based URLs, real 404s for missing resources.
- Only active products, published blog posts and public categories appear in sitemaps.
- Frontend (separate app): React + `react-helmet-async` for meta/canonical/OG/JSON-LD, build-time prerendering (`scripts/prerender.mjs`) so crawlers receive HTML.
- No ranking guarantees.

## 19. Testing Strategy

- 78 test classes under `src/test/java` covering controllers (MockMvc), services, mappers, security, email, events, invoice, Shiprocket, WhatsApp, validation, utils.
- `KamyaabiApplicationTests` is the `@SpringBootTest` context/integration test, using H2 (`application-test.yml`).
- `@MockitoBean` for external clients (Razorpay, Shiprocket, Cloudinary, ChatMitra, email).
- JaCoCo gate: **≥ 80 % line coverage** on `mvn verify` (entities, DTOs and a few configs excluded).
- CI (`.github/workflows/ci.yml`): `mvn clean verify -B` on JDK 21 for every push/PR to `master`.
- Gap: no Testcontainers/PostgreSQL test, so Flyway migrations are not exercised in CI.

## 20. Deployment Approach

- Multi-stage `Dockerfile` (Maven 3.9 / Temurin 21 → Temurin 21 JRE Alpine), port 8080.
- CI builds and pushes `omprakashornold/kamyaabi-backend` and `-frontend` images.
- `docker-compose.prod.yml` on a Linux VM: backend bound to `127.0.0.1:8080`, frontend to `127.0.0.1:3000`; host Nginx terminates TLS (`nginx/vm`), `forward-headers-strategy: framework`.
- Profile `prod`, secrets via `.env` (template: root `.env.example`). PostgreSQL is external (`DATABASE_URL`).
- Deploy scripts: `deploy.sh`, `setup-vm-ssl.sh`; docs in `docs/DEPLOYMENT.md`.
- Profiles: `dev` (H2, default), `local`, `docker`, `prod`, `test`.

Deployment gaps vs CLAUDE.md (not yet changed): container runs as root, no Docker `HEALTHCHECK`, prod uses `ddl-auto: update` alongside Flyway (CLAUDE.md requires `validate`).

## 21. Acceptance Criteria (baseline)

- `mvn clean verify` passes with ≥ 80 % line coverage.
- Application starts with `dev` profile; `/actuator/health` returns `UP`.
- Public endpoints in §8 are reachable without a token; `/api/admin/**` returns 401/403 without an admin JWT.
- All sitemaps return valid XML; `robots.txt` references the sitemap index.
- Prod starts against PostgreSQL with all Flyway migrations V0–V29 applied.
- No secrets in source or images.

## 22. Change Log / Pending Changes

| Date | Change | Status |
|---|---|---|
| 2026-11-11 | Baseline spec created from existing code | Awaiting approval |

Recommended follow-ups (each needs separate approval):
0. **CRITICAL:** Reject `POST /api/auth/google` requests without a verified `idToken` outside the `dev` profile (§12 item 0).
1. Verify Shiprocket webhook secret/token on `POST /api/webhooks/shiprocket`.
2. Switch prod `ddl-auto` from `update` to `validate`.
3. Remove default `JWT_SECRET` fallback in `docker-compose.prod.yml`.
4. Restrict `/h2-console/**` to the `dev` profile.
5. Run Docker container as non-root and add a `HEALTHCHECK`.
6. Add a PostgreSQL Testcontainers test that runs all Flyway migrations.
