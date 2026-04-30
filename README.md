# Kamyaabi - Premium Dry Fruits eCommerce

A full-stack eCommerce web application for premium dry fruits, built with Spring Boot and React.

## Tech Stack

### Backend
- Java 17, Spring Boot 3.2.5
- Spring Security + OAuth2 (Google Login)
- JWT Authentication
- JPA/Hibernate with H2 (dev) / PostgreSQL (prod, external)
- Razorpay Payment Integration
- Caffeine Caching
- Swagger/OpenAPI Documentation
- Lombok, SLF4J Logging
- JUnit 5 + Mockito (Testing)
- JaCoCo (Code Coverage)

### Frontend
- React 18 + TypeScript
- Material UI (MUI v5)
- Redux Toolkit (State Management)
- React Router v6
- Axios (HTTP Client)
- Vite (Build Tool)

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- PostgreSQL (external, production)
- Nginx (Frontend serving)

## Project Structure

```
kamyaabi/
├── kamyaabi-backend/          # Spring Boot backend
│   ├── Dockerfile             # Multi-stage Docker build
│   └── src/
│       ├── main/java/com/kamyaabi/
│       │   ├── config/        # App configs (CORS, Cache, Swagger, Security)
│       │   ├── controller/    # REST Controllers
│       │   ├── dto/           # Request/Response DTOs
│       │   ├── entity/        # JPA Entities
│       │   ├── exception/     # Exception handling
│       │   ├── mapper/        # Entity-DTO mappers
│       │   ├── repository/    # Spring Data repositories
│       │   ├── security/      # JWT, filters, security config
│       │   └── service/       # Business logic
│       └── test/java/com/kamyaabi/
│           ├── controller/    # Controller unit tests
│           ├── exception/     # Exception handler tests
│           ├── mapper/        # Mapper unit tests
│           ├── security/      # Security unit tests
│           └── service/impl/  # Service unit tests
├── kamyaabi-frontend/         # React frontend
│   ├── Dockerfile             # Multi-stage Docker build
│   ├── nginx.conf             # Nginx config for SPA routing
│   └── src/
│       ├── api/               # API client modules
│       ├── components/        # Reusable UI components
│       ├── features/          # Redux slices
│       ├── hooks/             # Custom hooks
│       ├── pages/             # Page components
│       ├── routes/            # App routing
│       ├── store/             # Redux store
│       ├── theme/             # MUI theme
│       └── types/             # TypeScript types
├── .github/workflows/ci.yml  # GitHub Actions CI/CD
├── docker-compose.yml         # Docker Compose orchestration
└── README.md
```

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+
- npm 9+

### Backend Setup (Local Development)

```bash
cd kamyaabi-backend
mvn clean compile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend will start at `http://localhost:8080`.

- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console (dev): http://localhost:8080/h2-console

### Frontend Setup (Local Development)

```bash
cd kamyaabi-frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`.

## Docker Setup

### Prerequisites
- Docker 20+
- Docker Compose v2+

### Running with Docker Compose

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up --build -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

This starts two services (database is external):
- **Backend** — `localhost:8080` (Spring Boot API)
- **Frontend** — `localhost:3000` (React app via Nginx)

### Docker Environment Variables

Create a `.env` file in the project root (required for database configuration):

```env
# External Database (PostgreSQL)
DATABASE_URL=jdbc:postgresql://your-db-host:5432/kamyaabi
DATABASE_USERNAME=your-db-username
DATABASE_PASSWORD=your-secure-db-password

# Backend
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Building Individual Images

```bash
# Build backend image
docker build -t kamyaabi-backend ./kamyaabi-backend

# Build frontend image
docker build -t kamyaabi-frontend ./kamyaabi-frontend
```

## Testing

### Running Backend Tests

```bash
cd kamyaabi-backend

# Run all tests
mvn clean test

# Run tests with coverage report
mvn clean verify

# View coverage report
open target/site/jacoco/index.html
```

### Test Coverage

The project uses **JaCoCo** for code coverage with an **80% minimum line coverage** requirement.

Coverage includes:
- **Service Layer** — 7 service implementations fully tested
- **Controller Layer** — 8 controllers fully tested
- **Security** — JwtTokenProvider, JwtAuthenticationFilter, CurrentUser
- **Mappers** — All 7 entity-DTO mappers tested
- **Exception Handler** — GlobalExceptionHandler fully tested

Excluded from coverage:
- `KamyaabiApplication` (main class)
- Entity classes (`entity/**`)
- DTO classes (`dto/**`)
- `DataInitializer`
- `SwaggerConfig`

### Test Summary

| Category | Test Files | Tests |
|----------|-----------|-------|
| Services | 7 | ~75 |
| Controllers | 8 | ~25 |
| Security | 3 | ~20 |
| Mappers | 7 | ~25 |
| Exception Handler | 1 | 7 |
| **Total** | **26** | **159** |

## CI/CD

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request to `master`.

**Pipeline Jobs:**

1. **Backend Test** — Runs `mvn clean verify` with JaCoCo coverage check
   - Uploads JaCoCo coverage report as an artifact
2. **Frontend Build** — Runs `npm ci` and `npm run build`
3. **Docker Build** — Builds Docker images for backend and frontend (runs after tests pass)

### Environment Variables

#### Backend (`application.properties`)
```properties
app.jwt.secret=your-jwt-secret
app.jwt.expirationMs=86400000
app.razorpay.keyId=your-razorpay-key
app.razorpay.keySecret=your-razorpay-secret
spring.security.oauth2.client.registration.google.client-id=your-google-client-id
spring.security.oauth2.client.registration.google.client-secret=your-google-client-secret
```

#### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/google | Google OAuth login | Public |
| GET | /api/auth/me | Get current user | User |
| GET | /api/products | List products (paginated) | Public |
| GET | /api/products/{id} | Get product detail | Public |
| GET | /api/products/featured | Featured products | Public |
| GET | /api/products/search | Search products | Public |
| GET | /api/categories | List categories | Public |
| GET | /api/cart | Get user cart | User |
| POST | /api/cart/items | Add to cart | User |
| PUT | /api/cart/items/{id} | Update cart item | User |
| DELETE | /api/cart/items/{id} | Remove from cart | User |
| POST | /api/orders | Create order | User |
| GET | /api/orders | List user orders | User |
| GET | /api/orders/{id} | Get order detail | User |
| POST | /api/payments/create-order | Create Razorpay order | User |
| POST | /api/payments/verify | Verify payment | User |
| GET | /api/addresses | List addresses | User |
| POST | /api/addresses | Create address | User |
| POST | /api/admin/products | Create product | Admin |
| PUT | /api/admin/products/{id} | Update product | Admin |
| DELETE | /api/admin/products/{id} | Delete product | Admin |
| POST | /api/admin/categories | Create category | Admin |
| GET | /api/admin/orders | List all orders | Admin |
| PUT | /api/admin/orders/{id}/status | Update order status | Admin |

## Features

- **Google OAuth Login** — Secure authentication with JWT tokens
- **Product Catalog** — Browse, search, filter by category with pagination
- **Shopping Cart** — Add, update, remove items with stock validation
- **Checkout & Payments** — Razorpay integration for secure payments
- **Order Tracking** — Real-time order status with step-by-step progress
- **Admin Dashboard** — Manage products, categories, and orders
- **Caching** — Caffeine cache for improved performance
- **Responsive Design** — Mobile-first UI with Material Design
- **Docker Support** — Full containerization with Docker Compose
- **CI/CD** — Automated testing and builds with GitHub Actions
- **80%+ Code Coverage** — Comprehensive JUnit/Mockito test suite with JaCoCo
- **Production-grade observability** — correlation id on every request, structured logs
  with 10-day rolling retention, Actuator health/metrics/loggers

## Environment variables

All secrets come from environment variables. Nothing secret is checked in.

### Backend

| Variable                   | Required | Default                     | Description                                              |
|----------------------------|----------|-----------------------------|----------------------------------------------------------|
| `DATABASE_URL`             | prod     | `jdbc:h2:mem:kamyaabidb`    | JDBC URL for the app database                            |
| `DATABASE_USERNAME`        | prod     | `sa`                        | Database username                                        |
| `DATABASE_PASSWORD`        | prod     | _(empty in dev)_            | Database password                                        |
| `JWT_SECRET`               | yes      | _(none — fails startup)_    | HS256 signing secret (≥32 bytes)                         |
| `JWT_EXPIRATION_MS`        | no       | `7200000` (2 h)             | JWT lifetime in ms                                       |
| `GOOGLE_CLIENT_ID`         | yes      | _(none)_                    | Google OAuth web client id                               |
| `GOOGLE_CLIENT_SECRET`     | yes      | _(none)_                    | Google OAuth client secret                               |
| `CORS_ALLOWED_ORIGINS`     | yes      | _(none)_                    | Comma-separated frontend origins                         |
| `RAZORPAY_KEY_ID`          | yes      | _(none)_                    | Razorpay public key id                                   |
| `RAZORPAY_KEY_SECRET`      | yes      | _(none)_                    | Razorpay secret key                                      |
| `SENDGRID_API_KEY`         | no       | _(empty → falls back to SMTP)_ | SendGrid API key                                      |
| `SMTP_HOST/PORT/USER/PASS` | no       | _(empty → no-op email)_     | SMTP fallback for transactional email                    |

### Frontend

| Variable                 | Required | Description                                             |
|--------------------------|----------|---------------------------------------------------------|
| `VITE_API_BASE_URL`      | no       | Backend base URL. Blank = same-origin (behind Nginx).   |
| `VITE_GOOGLE_CLIENT_ID`  | yes (prod) | Google OAuth web client id (same as backend)          |
| `VITE_BRAND_DOMAIN`      | no       | Public brand domain; default `kamyaabi.in`            |
| `VITE_SUPPORT_EMAIL`     | no       | Support email rendered in UI                            |

Frontend env vars are consumed via `src/config/index.ts`, which throws in
production builds if a required var is missing — preventing broken deploys.

## Scripts cheat-sheet

| Scope    | Command                                   | What it does                         |
|----------|-------------------------------------------|--------------------------------------|
| Backend  | `mvn -pl kamyaabi-backend spring-boot:run`| Run locally with dev profile         |
| Backend  | `mvn -pl kamyaabi-backend test`           | Run all unit tests                   |
| Backend  | `mvn -pl kamyaabi-backend verify`         | Tests + JaCoCo coverage gate         |
| Frontend | `npm -C kamyaabi-frontend run dev`        | Vite dev server on :3000             |
| Frontend | `npm -C kamyaabi-frontend run build`      | Type-check (tsc -b) + Vite prod build|
| Frontend | `npm -C kamyaabi-frontend run lint`       | ESLint                               |
| Stack    | `docker compose up --build`               | Build + run frontend + backend       |

