# Kamyaabi - Premium Dry Fruits eCommerce

A full-stack eCommerce web application for premium dry fruits, built with Spring Boot and React.

## Tech Stack

### Backend
- Java 17, Spring Boot 3.2.5
- Spring Security + OAuth2 (Google Login)
- JWT Authentication
- JPA/Hibernate with H2 (dev) / PostgreSQL (prod)
- Razorpay Payment Integration
- Caffeine Caching
- Swagger/OpenAPI Documentation
- Lombok, SLF4J Logging

### Frontend
- React 18 + TypeScript
- Material UI (MUI v5)
- Redux Toolkit (State Management)
- React Router v6
- Axios (HTTP Client)
- Vite (Build Tool)

## Project Structure

```
kamyaabi/
├── kamyaabi-backend/          # Spring Boot backend
│   └── src/main/java/com/kamyaabi/
│       ├── config/            # App configs (CORS, Cache, Swagger, Security)
│       ├── controller/        # REST Controllers
│       ├── dto/               # Request/Response DTOs
│       ├── entity/            # JPA Entities
│       ├── exception/         # Exception handling
│       ├── mapper/            # Entity-DTO mappers
│       ├── repository/        # Spring Data repositories
│       ├── security/          # JWT, filters, security config
│       └── service/           # Business logic
├── kamyaabi-frontend/         # React frontend
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
└── README.md
```

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd kamyaabi-backend
mvn clean compile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend will start at `http://localhost:8080`.

- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console (dev): http://localhost:8080/h2-console

### Frontend Setup

```bash
cd kamyaabi-frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`.

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
