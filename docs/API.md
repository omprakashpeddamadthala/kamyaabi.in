# API Reference

Base URL: `https://kamyaabi.shop/api` (prod) or `http://localhost:8080/api` (dev).

All endpoints are documented live via Swagger at `/swagger-ui.html` — this
document summarises the stable contract.

## Conventions

### Success response envelope

All success responses are wrapped in:

```json
{
  "success": true,
  "message": "optional human message",
  "data": <endpoint-specific payload>
}
```

### Error response envelope

All error responses use the `ApiErrorResponse` shape (see
[`docs/LOGGING.md`](./LOGGING.md) for how to use the trace id):

```json
{
  "timestamp": "2026-04-25T10:23:45.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable message",
  "path": "/api/orders",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldErrors": { "addressLine1": "must not be blank" }
}
```

`fieldErrors` is only present on 400 validation failures.

### Authentication

Protected endpoints require a JWT in `Authorization: Bearer <token>`. The
token is issued by `POST /api/auth/google` in exchange for a verified
Google ID token. Lifetime defaults to 2 hours (dev) / configurable via
`app.jwt.expiration-ms`.

### Pagination

Endpoints that return lists accept `page` (0-indexed) and `size` query
parameters and return a Spring `Page` payload unwrapped into `data`:

```json
{
  "data": {
    "content": [ ... ],
    "pageable": { "pageNumber": 0, "pageSize": 20 },
    "totalElements": 42,
    "totalPages": 3,
    "last": false
  }
}
```

### Standard error codes

| Status | Error                     | When                                                   |
|--------|---------------------------|--------------------------------------------------------|
| 400    | Bad Request               | Validation failed or malformed body                    |
| 401    | Unauthorized              | Missing/invalid JWT, Google token verification failed  |
| 403    | Forbidden                 | JWT valid but lacks the required role                  |
| 404    | Not Found                 | `ResourceNotFoundException`                            |
| 409    | Conflict                  | `DuplicateResourceException`                           |
| 422    | Unprocessable Entity      | `BusinessException` (domain rule violated)             |
| 500    | Internal Server Error     | Unexpected — correlate via `traceId` in server logs    |

---

## Endpoints

> The list below is a summary of the primary public surface. For the canonical
> live list, open `/swagger-ui.html` against a running instance.

### Auth — `/api/auth`

| Method | Path       | Auth   | Request                          | Response              |
|--------|------------|--------|----------------------------------|-----------------------|
| POST   | /google    | public | `{ "idToken": "<google-jwt>" }`  | `AuthResponse` (JWT + user) |
| GET    | /success   | public | OAuth2 redirect                  | plain text            |
| GET    | /failure   | public | OAuth2 redirect                  | plain text            |
| GET    | /me        | JWT    | —                                | `UserResponse`        |

### Products — `/api/products`

| Method | Path           | Auth  | Notes                      |
|--------|----------------|-------|----------------------------|
| GET    | /              | public| list + pagination          |
| GET    | /{id}          | public| product detail             |
| POST   | /              | ADMIN | create product             |
| PUT    | /{id}          | ADMIN | update product             |
| DELETE | /{id}          | ADMIN | delete product             |

### Categories — `/api/categories`

| Method | Path       | Auth  |
|--------|------------|-------|
| GET    | /          | public|
| GET    | /{id}      | public|
| POST   | /          | ADMIN |
| PUT    | /{id}      | ADMIN |
| DELETE | /{id}      | ADMIN |

### Cart — `/api/cart`

| Method | Path             | Auth |
|--------|------------------|------|
| GET    | /                | JWT  |
| POST   | /items           | JWT  |
| PUT    | /items/{itemId}  | JWT  |
| DELETE | /items/{itemId}  | JWT  |
| DELETE | /                | JWT  |

### Addresses — `/api/addresses`

| Method | Path        | Auth |
|--------|-------------|------|
| GET    | /           | JWT  |
| POST   | /           | JWT  |
| PUT    | /{id}       | JWT  |
| DELETE | /{id}       | JWT  |
| POST   | /{id}/default | JWT |

### Orders — `/api/orders`

| Method | Path           | Auth  |
|--------|----------------|-------|
| GET    | /              | JWT   |
| GET    | /{id}          | JWT   |
| POST   | /              | JWT   |
| PATCH  | /{id}/status   | ADMIN |

### Payments — `/api/payments`

| Method | Path    | Auth |
|--------|---------|------|
| POST   | /create | JWT  |
| POST   | /verify | JWT  |

### Profile — `/api/profile`

| Method | Path | Auth |
|--------|------|------|
| GET    | /    | JWT  |
| PUT    | /    | JWT  |

### Admin — `/api/admin/**`

All `/api/admin/**` routes require `ROLE_ADMIN`. Exact endpoint list
surfaced via Swagger.

### Actuator — `/actuator`

| Path                   | Auth  | Notes                                        |
|------------------------|-------|----------------------------------------------|
| /actuator/health       | public| liveness + readiness summary                 |
| /actuator/info         | public| app name/version/description + build/git     |
| /actuator/metrics/**   | ADMIN | JVM, HTTP, cache, DB metrics                 |
| /actuator/loggers/**   | ADMIN | runtime log-level toggle — see LOGGING.md    |
| /actuator/env/**       | ADMIN | resolved config properties                   |

---

## Authentication flow (Google OAuth2)

```
1. Frontend renders GoogleLogin button (@react-oauth/google).
2. User clicks → Google returns an ID token (JWT signed by Google).
3. Frontend POSTs { idToken } to /api/auth/google.
4. Backend verifies the ID token against Google's public certs, upserts the
   user row, issues a Kamyaabi JWT (HS256) embedding userId/email/role.
5. Frontend stores the JWT in localStorage and attaches it as
   'Authorization: Bearer ...' to every subsequent request.
6. Session is considered expired after 2 hours of client-side inactivity;
   /login redirects clear both localStorage and server-side session cookies.
```
