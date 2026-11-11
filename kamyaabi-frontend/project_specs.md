# Kamyaabi Frontend — Project Specification

Status: **Baseline (documents the system as it exists on `master`, commit `fa2c5d4`).**
New features must add an entry to §23 "Change Log / Pending Changes" and be approved before implementation.
Backend contract: see `../kamyaabi-backend/project_specs.md`.

---

## 1. Application Purpose

The customer storefront and admin panel for Kamyaabi, a D2C premium dry-fruits brand in India (kamyaabi.in).

- **Storefront:** browse and search products, product detail with reviews/FAQs/delivery estimate, cart, wishlist, checkout (Razorpay or COD), order history and invoices, order tracking, blog, static pages.
- **Admin panel:** dashboard/analytics, products (incl. CSV, images, tags), categories, orders, Shiprocket, coupons, reviews, users, hero banners, gallery, blog CMS, settings, package dimensions.
- **SEO server:** a Node server that returns server-rendered HTML with metadata and JSON-LD for public pages.

## 2. Target Users

| User | Needs |
|---|---|
| Shoppers (mostly mobile, India) | Fast pages, simple checkout, ₹ pricing, pincode delivery check, WhatsApp/Google login |
| Logged-in customers | Cart, wishlist, addresses, orders, invoices, reviews, profile |
| Admins | Manage catalog, orders, shipping, marketing content |
| Search engines / social crawlers | Crawlable HTML, metadata, structured data, correct status codes |

## 3. Node.js Version

Node **20** (build and runtime images `node:20-alpine`; CI uses Node 20).

## 4. React / TypeScript / Build Versions

React **18.3**, TypeScript **~5.5** (strict), Vite **5.4**, React Router **6.26**.

## 5. Technology Stack

| Area | Technology |
|---|---|
| UI | React 18, MUI 5 (+ icons), Emotion, custom `components/ui` primitives |
| Styling | MUI theme (`src/theme/theme.ts`), CSS tokens (`src/styles/tokens.css`, `responsive.css`) |
| Routing | React Router 6 with `lazy()` pages |
| State | Redux Toolkit + react-redux (`auth`, `cart`, `products`, `orders`, `wishlist`) |
| Data fetching | Axios (`src/api/*`); `@tanstack/react-query` provider configured but **no `useQuery` usage yet** |
| Head / SEO | react-helmet-async (`Seo`, `SiteHead`) + Node SSR server (`server/render.mjs`) |
| Auth | `@react-oauth/google` (ID token), WhatsApp OTP via backend |
| Payments | Razorpay Checkout script (`utils/loadRazorpay.ts`) |
| Rich text | Tiptap 3 (admin blog editor), lowlight |
| Charts | Recharts 3 (admin analytics) |
| Media | Cloudinary URLs (`utils/cloudinary.ts`), yet-another-react-lightbox |
| PWA | vite-plugin-pwa (autoUpdate; caches CSS, Cloudinary images, Google Fonts) |
| Analytics | Google Analytics 4 (gtag) via `SiteHead` |
| Lint | ESLint 9, typescript-eslint, react-hooks, react-refresh |
| Tests | Node built-in test runner (`server/index.test.mjs`) |
| Legacy | Puppeteer + serve-handler for `scripts/prerender.mjs` (not used by Docker build) |

## 6. Application Architecture

```
Browser ──► Host Nginx (TLS) ──► frontend container: Node server (server/index.mjs, :80)
                                    ├─ /assets/*, static files from dist/ (long cache)
                                    ├─ /sitemap.xml, /robots.txt → proxied to backend
                                    ├─ /healthz
                                    ├─ public routes → SSR HTML (render.mjs) + bootstrap data, 60 s in-memory cache
                                    ├─ private routes → noindex SPA shell, no-store
                                    └─ unknown → 404 HTML (noindex)
                                 ─► /api/* → backend container (:8080) (via Nginx; Vite proxy in dev)
```

- The SSR server fetches data from the backend (`BACKEND_INTERNAL_URL`, 5 s timeout) and injects HTML, `<head>` tags, JSON-LD, and bootstrap data into `dist/index.html`. The React SPA then takes over in the browser.
- Canonical product URL is `/products/{categorySlug}/{productSlug}`; legacy `/products/{slug}` and mismatched paths 301-redirect to it.
- The SPA uses lazy-loaded pages inside `Layout` (storefront) or the admin shell.

## 7. Folder and Module Structure

| Path | Contents |
|---|---|
| `src/api` | 21 modules: address, admin, auth, blog, cart, category, coupon, error, gallery, heroBanner, order, payment, product, productTag, profile, review, settings, shipping, tracking, wishlist + `axiosInstance` |
| `src/components/ui` | Avatar, Badge, Breadcrumb, Button, Card, Drawer, Input, Modal, Pagination, Select, Skeleton, Tabs, Textarea, Toast, Tooltip |
| `src/components/common` | Seo, SiteHead, ErrorBoundary, ApiErrorNotifier, SessionManager, GlobalLoadingBar, ProductCard(+Skeleton), dialogs, toasts, tracking widget, fly-to-cart |
| `src/components/layout` | Navbar, Footer, Layout |
| `src/components/product` | Gallery, lightboxes, reviews/FAQ tabs, delivery section, related products, sticky add-to-cart, wishlist toggle |
| `src/components/checkout` | Progress, address, coupon, items, summary, payment method cards |
| `src/components/admin` | Tabs/panels, `layout/` (admin shell), `product-form/` |
| `src/config` | `index.ts` (env config), `images.ts` |
| `src/features` | Redux slices: auth, cart, order, product, wishlist |
| `src/hooks` | checkout addresses/coupons, pincode check, place order, product data/form/reviews, public settings, reveal-on-scroll |
| `src/pages`, `src/pages/admin` | Route pages (24 storefront/blog-admin + 20 admin) |
| `src/routes` | `AppRoutes.tsx` with `ProtectedRoute` and admin role guard |
| `src/types` | Shared TS types for backend DTOs |
| `src/utils` | apiError, bootstrapData, cloudinary, download, globalErrorReporter, loadRazorpay, logger, orderStatusUtils, productDetail, productUrl |
| `server` | SSR server, renderers, tests |

## 8. Routes and Pages

### Public (SSR-rendered for crawlers)
| Route | Page | SSR |
|---|---|---|
| `/` | HomePage | ✅ categories, featured products, latest 3 posts |
| `/products` | ProductsPage | ✅ |
| `/products/category/:categorySlug` | ProductsPage | ✅ |
| `/products/:categorySlug/:productSlug` | ProductDetailPage (canonical) | ✅ Product + rating JSON-LD |
| `/products/:slug` | ProductDetailPage (legacy) | ✅ / 301 to canonical |
| `/blog`, `/blogs` | BlogListPage | ✅ |
| `/blog/category/:slug`, `/blog/tag/:slug` | BlogCategoryPage / BlogTagPage | ✅ |
| `/blog/:slug` | BlogPostPage | ✅ |
| `/about`, `/contact`, `/refund-policy`, `/track-order`, `/login` | static pages | ✅ static SEO content |
| `*` | NotFoundPage | ✅ HTTP 404, noindex |

### Authenticated (`ProtectedRoute`; SSR returns noindex shell)
`/cart`, `/checkout`, `/wishlist`, `/orders`, `/orders/:id`, `/profile`

### Admin (role `ADMIN` guard; noindex shell)
`/admin` (dashboard), `/admin/products` (+ `new`, `edit/:id`, `tags`, `tags/new`, `tags/edit/:id`), `/admin/categories` (+ new/edit), `/admin/orders`, `/admin/shiprocket`, `/admin/coupons` (+ new/edit), `/admin/reviews`, `/admin/users`, `/admin/analytics`, `/admin/settings`, `/admin/settings/package-dimensions`, `/admin/hero-banners` (+ new/edit), `/admin/gallery`, `/admin/blog` (+ new, edit/:id, categories, tags with new/edit).

## 9. Backend APIs Consumed

All endpoints listed in backend spec §8, via `src/api/*`. Conventions:

- Base URL `config.apiBaseUrl` (empty → same origin `/api`).
- Success body `ApiResponse<T>` = `{ success, message?, data }`; API modules return `data`.
- Error body `ApiErrorResponse` = `{ timestamp, status, error, message, path, traceId, fieldErrors? }`; parsed by `utils/apiError.ts`; `traceId` also read from `x-correlation-id`.
- Auth header `Authorization: Bearer <JWT>`.
- SSR server uses: `/api/categories`, `/api/products?page=0&size=100`, `/api/products/featured`, product by slug + review summary, `/api/blog/posts`, `/api/blog/categories`, `/api/blog/tags`, `/sitemap.xml`, `/robots.txt`.

## 10. State Management and Data Fetching

- **Redux slices:** `auth` (user, token from localStorage, `googleLogin`, `fetchCurrentUser`), `cart`, `wishlist`, `products`, `orders`.
- **Local hooks** for page data (product detail, reviews, checkout, settings).
- **Bootstrap data:** SSR-injected JSON read by `utils/bootstrapData.ts` to avoid a double fetch on first load.
- **React Query** client configured (`staleTime` 5 min, `gcTime` 30 min, `retry` 1) but currently unused; a decision is needed to adopt or remove it (§23).

## 11. Authentication and Authorization (client)

- **Google:** `@react-oauth/google` returns an ID token, sent as `{ idToken }` to `POST /api/auth/google`.
- **WhatsApp OTP:** `/api/auth/whatsapp/send-otp` → `/verify-otp` (shown only if the backend status endpoint says it is enabled).
- JWT, user, and `tokenExpiry` (2 h) are stored in `localStorage`. The request interceptor logs out on expiry, and the response interceptor logs out on 401 and redirects to `/login` with a "session expired" flag.
- `SessionManager` handles session lifecycle in the UI.
- `ProtectedRoute` requires a logged-in user; the admin guard requires `user.role === 'ADMIN'`. **These are UX only; the backend enforces access.**
- **Dev login** (localhost and non-production builds only) logs in as a configured email without Google.

## 12. Security Requirements

Current:
- No secrets in `VITE_*` (only public IDs: Google client ID, GA ID, contact info).
- Production build fails if `VITE_GOOGLE_CLIENT_ID` is missing.
- Private routes are served with `noindex` and `Cache-Control: no-store`; the SSR cache skips them.
- SSR output escapes HTML (`escapeHtml`) and JSON-LD (`safeJson`).
- The static file server blocks path traversal.

**Open security items (found during baseline review — need approval to fix):**
1. **CRITICAL (backend + frontend): login without proof.** `POST /api/auth/google` without `idToken` falls back to a legacy path (`AuthServiceImpl.googleLoginFromRequest`) that issues a JWT for **any email the caller sends**, including admin accounts, in every environment. The frontend's dev login depends on this path. Fix: remove the legacy branch in the backend (or allow it only in the `dev` profile), and point dev login at a dev-only backend mechanism.
2. `BlogPostPage` renders `post.content` with `dangerouslySetInnerHTML` **without sanitizing it**. Admin-only content today, but a stolen admin account (see #1) becomes stored XSS for all visitors. Fix: sanitize on save (backend) and/or render (frontend, e.g. DOMPurify; new dependency needs approval).
3. JWT is kept in `localStorage`, so any XSS can steal it. Acceptable for now if #2 is fixed; consider HttpOnly cookies later.
4. The default dev admin email in `src/config/index.ts` and `.env.example` is a real personal address. Use a placeholder.

## 13. Business and UX Rules

- Prices in ₹; show discounted price when present; out-of-stock products cannot be added to the cart.
- Pincode check (`usePincodeCheck`) shows serviceability and delivery estimate before checkout.
- Checkout: select or add an address (Indian address validation), apply a coupon, choose Prepaid (Razorpay) or COD, place order. Prepaid opens Razorpay, then `/api/payments/verify`.
- Order status labels and colours come from `utils/orderStatusUtils.ts`; invoices download from `/api/orders/{id}/invoice`.
- Wishlist toggle on cards and detail pages (login required).
- Reviews: logged-in users can post or edit with images.
- Admin destructive actions require confirmation.
- Public settings (e.g. Amazon store link, WhatsApp OTP toggle) come from `/api/settings/public`.

## 14. External Integrations / Third-Party Scripts

| Integration | Use |
|---|---|
| Google Identity Services | Login (ID token) |
| Razorpay Checkout | Prepaid payments |
| Google Analytics 4 | Page analytics (`VITE_GA_ID`) |
| Cloudinary | Image delivery and transforms |
| Google Fonts | Typography (PWA-cached) |
| Facebook / Instagram / WhatsApp | Footer and contact links |

## 15. Error-Handling Strategy

- `ErrorBoundary` catches render errors.
- `ApiErrorNotifier` and toasts show API errors with friendly messages.
- `globalErrorReporter` posts uncaught errors to `POST /api/errors/report` (backend emails developers).
- `utils/logger.ts` is used instead of `console`.
- SSR server: backend 404 returns a 404 page; backend down or timeout returns a 503 "temporarily unavailable" page (`no-store`). Unknown routes return a real 404 with `noindex`.

## 16. Logging, Analytics, Monitoring

- GA4 page views via `SiteHead`.
- Client errors are reported to the backend with `traceId`.
- The SSR server logs 5xx errors to stdout (Docker logs).
- Health check: `GET /healthz` returns `ok`.

## 17. Performance Requirements

- Core Web Vitals targets (mobile p75): LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- Route-level code splitting; vendor chunks split (`mui`, `mui-icons`, `router`, `redux`, `charts`, `axios`, `vendor`).
- SSR responses are compressed with ETags. `/assets/*` uses long-lived cache; public HTML is cached in memory for 60 s.
- Critical CSS is inlined by the SSR renderer; Cloudinary images use width-optimized URLs.
- The PWA caches Cloudinary images (30 days, 100 entries) and Google Fonts.

## 18. SEO Requirements

- Every public page returns full HTML in the first response: unique title, meta description, absolute canonical, OG/Twitter tags, and JSON-LD (Organization/WebSite, Product with Offer and AggregateRating when reviews exist, BreadcrumbList, BlogPosting).
- Canonical product URLs use the category hierarchy; legacy URLs return 301.
- Real 404s for missing products, posts, and routes; never redirect to home.
- Private and admin pages are `noindex,nofollow` and `no-store`.
- `/sitemap.xml` and `/robots.txt` come from the backend through the SSR proxy.
- `/index.html` returns 301 to `/`.
- Client `Seo` component metadata must match the SSR head.

Known SEO gaps (need decision):
- `/blog` and `/blogs` both return 200. Confirm they share one canonical, or 301 one to the other.
- `public/sitemap.xml` and `public/robots.txt` are stale copies shadowed by the proxy. Remove them.
- `scripts/prerender.mjs` (Puppeteer) is superseded by the SSR server. Remove it and the Puppeteer/serve-handler dependencies, or document why they stay.
- `frontend/nginx.conf` is not used by the current Dockerfile. Confirm and remove.

## 19. Accessibility Requirements

WCAG 2.2 AA: semantic landmarks, one `h1` per page, labelled form controls, keyboard-accessible dialogs, drawers and menus, alt text on product images, 4.5:1 contrast, and `prefers-reduced-motion` respected by animations. No automated a11y checks yet.

## 20. Testing Strategy

- **Existing:** `npm test` runs 7 SSR server tests (product SSR + JSON-LD, 404 handling, legacy URL redirects, login static page, blog list and pages, sitemap/robots proxy).
- **Gaps:** no component, hook, or slice tests; no E2E tests; CI runs only `npm ci && npm run build` (no `lint`, no `npm test`).
- **Proposed (needs approval):** add `npm run lint` and `npm test` to CI; add Vitest + React Testing Library for hooks and slices on critical flows (auth, cart, checkout).
- **Manual verification** for UI changes: dev server + backend, check the browser console, `curl` SSR HTML for public pages, Lighthouse for performance and SEO.

## 21. Deployment Approach

- Dockerfile: `node:20-alpine` build stage (`npm ci`, `npm run build` with `VITE_*` build args), then a runtime stage running `node server/index.mjs` on port 80 with `BACKEND_INTERNAL_URL` and `PUBLIC_SITE_URL`.
- CI (`.github/workflows/ci.yml`) builds and pushes `omprakashornold/kamyaabi-frontend` with a date-based tag on `master`.
- `docker-compose.prod.yml`: `127.0.0.1:3000 → 80`, depends on backend; host Nginx terminates TLS.
- Gaps: container runs as root; no Docker `HEALTHCHECK` even though `/healthz` exists.

## 22. Acceptance Criteria (baseline)

- `npm run build` succeeds with no TypeScript errors; `npm run lint` passes.
- `npm test` passes.
- `curl https://kamyaabi.in/products/<cat>/<slug>` returns 200 with a product title, description, canonical, and Product JSON-LD.
- Unknown URLs return 404; legacy product URLs return 301 to the canonical URL.
- `/cart`, `/checkout`, `/admin/*` return `noindex` and `no-store`.
- Login (Google, WhatsApp OTP), cart, checkout (Razorpay test + COD), orders, and admin CRUD work against the backend.

## 23. Change Log / Pending Changes

| Date | Change | Status |
|---|---|---|
| 2026-11-11 | Baseline frontend spec and CLAUDE.md created from existing code | Awaiting approval |

Recommended follow-ups (each needs separate approval, highest priority first):
1. **CRITICAL:** close the unverified Google-login path (backend) and rework dev login (§12 #1).
2. Sanitize blog HTML (§12 #2).
3. Add `lint` and `npm test` to CI.
4. Decide on React Query: adopt it for server data or remove the unused dependency.
5. Remove stale `public/sitemap.xml`, `public/robots.txt`, `scripts/prerender.mjs`, the Puppeteer deps, and the unused `nginx.conf`.
6. Resolve the `/blog` vs `/blogs` duplicate.
7. Run the container as non-root and add a `HEALTHCHECK` on `/healthz`.
8. Replace the personal email used as the dev-login default.
