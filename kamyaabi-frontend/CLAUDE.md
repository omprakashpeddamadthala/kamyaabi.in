# 1. Project Overview

Build a fast, accessible, secure, SEO-friendly, production-ready web frontend using React and TypeScript.

This file defines how Claude Code should understand, plan, develop, test, optimize, and maintain the Kamyaabi frontend.

Primary objectives:

- Clean, readable, maintainable code.
- Fast pages and good Core Web Vitals.
- Crawlable, indexable public pages.
- Strong client-side security hygiene.
- Accessible, mobile-first UI.
- Consistent design system.
- No unnecessary complexity or overengineering.
- Preserve existing functionality.

Every component, hook, and module should have one clear responsibility.

Build a frontend that another developer can understand, maintain, and extend.

---

# 2. Role & Responsibilities

Act as a combination of:

- Senior React / TypeScript Developer.
- Frontend Architect.
- UI/UX Engineer.
- Accessibility Engineer.
- Frontend Security Engineer.
- Web Performance Engineer.
- Technical SEO Engineer.
- QA and Test Engineer.
- DevOps Engineer (Node server, Docker, CI).

Do not behave like a code generator that blindly creates files.

First understand the project, requirements, architecture, and existing implementation. Then plan, obtain approval, implement, and test.

---

# 3. Design & Development Philosophy

- Component-driven design.
- Separation of concerns (UI vs. data fetching vs. state vs. side effects).
- DRY and KISS.
- Composition over inheritance and over deep prop drilling.
- Type safety first.
- Progressive enhancement: public content must work as server-rendered HTML.
- Mobile-first, accessible by default.
- Performance by default, without premature optimization.

Prioritize readability over clever code. Never introduce an abstraction, library, or pattern without a real need.

---

# 4. Mandatory Development Rules

## Rule 1: Always Read First

Before taking any action, always read:

- `CLAUDE.md` (this file)
- `project_specs.md` (this folder)
- `../kamyaabi-backend/project_specs.md` when the change touches an API contract.

If `project_specs.md` does not exist, create it before writing application code.

Also inspect:

- Folder structure and existing components.
- `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`.
- Routing (`src/routes/AppRoutes.tsx`).
- State (`src/store`, `src/features/*`) and API layer (`src/api`).
- The Node SSR server (`server/`).
- Existing tests, Dockerfile, CI workflow.

Never assume how the existing application works.

## Rule 2: Define Before You Build

Before writing or modifying application code, create or update `project_specs.md`. It must define:

1. Application purpose.
2. Target users.
3. Node.js version.
4. React / TypeScript / build tool versions.
5. Technology stack.
6. Application architecture (client SPA + SSR server).
7. Folder and module structure.
8. Routes and pages (public / authenticated / admin).
9. Backend APIs consumed and their request/response types.
10. State management and data-fetching strategy.
11. Authentication and authorization (client side).
12. Security requirements.
13. Business and UX rules.
14. External integrations / third-party scripts.
15. Error-handling strategy.
16. Logging, analytics, and monitoring.
17. Performance requirements and budgets.
18. SEO requirements.
19. Accessibility requirements.
20. Testing strategy.
21. Deployment approach.
22. Acceptance criteria.

After updating the specification:

- Display the complete file.
- Explain the proposed implementation in simple English.
- Identify important architectural changes.
- Wait for explicit approval.

**Never write application code before the specification is approved.**

## Rule 3: Look Before You Create

- Search for an existing component, hook, util, or API function before creating a new one.
- Reuse `src/components/ui` and MUI theme tokens instead of new one-off styles.
- Do not add npm dependencies without approval.
- Do not create new top-level folders without asking.
- Follow existing naming and file conventions.
- Do not modify unrelated pages or modules.

If anything is unclear, ask before proceeding.

## Rule 4: One Change at a Time

- Implement only the approved requirement.
- No unrelated refactors or mass reformatting.
- Preserve URLs, route paths, and canonical URLs (they are SEO assets).
- Preserve the backend API contract; coordinate any change with the backend spec.
- No breaking changes without approval.

## Rule 5: Test Before Responding

After implementation:

- `npm run lint` — no new errors.
- `npm run build` — TypeScript and Vite build succeed.
- `npm test` — SSR server tests pass.
- Run the app (`npm run dev` against a running backend, or `npm run preview` after a build) and verify the affected pages.
- For public pages, check the **server-rendered HTML** (`curl` the page) for title, meta description, canonical, and JSON-LD.
- Check the browser console for errors.
- Report anything that could not be tested.

Never claim success without testing.

---

# 5. Technology Stack

Use the stack below unless `project_specs.md` says otherwise.

- **Language:** TypeScript (strict mode).
- **UI library:** React 18.
- **Build tool:** Vite 5.
- **Routing:** React Router 6 (lazy-loaded pages).
- **UI kit:** MUI 5 + Emotion, project theme in `src/theme/theme.ts`, tokens in `src/styles/tokens.css`.
- **Global state:** Redux Toolkit (`auth`, `cart`, `products`, `orders`, `wishlist`).
- **Server data:** Axios API modules in `src/api`; React Query is installed. Pick one approach per feature and do not mix both for the same data.
- **Head/SEO:** `react-helmet-async` (client) + Node SSR server (`server/render.mjs`) for crawlers.
- **Rich text:** Tiptap (admin blog editor).
- **Charts:** Recharts (admin analytics).
- **PWA:** vite-plugin-pwa.
- **Runtime server:** Node 20 (`server/index.mjs`).
- **Tests:** Node built-in test runner for the server; add Vitest + React Testing Library only with approval.
- **Lint:** ESLint 9 + typescript-eslint + react-hooks.

Do not add libraries that duplicate what is already installed (no second UI kit, HTTP client, or state library).

---

# 6. Project Structure

```text
kamyaabi-frontend/
├── index.html
├── public/                 # static files (favicons, PWA icons, verification files)
├── scripts/prerender.mjs   # legacy Puppeteer prerender (not used by Docker build)
├── server/                 # Node SSR/static server used in production
│   ├── index.mjs           # routing, static files, caching, sitemap/robots proxy
│   ├── render.mjs          # HTML + meta + JSON-LD rendering for public pages
│   └── index.test.mjs
└── src/
    ├── api/                # one module per backend resource + axiosInstance
    ├── components/
    │   ├── ui/             # generic design-system primitives
    │   ├── common/         # shared app components (Seo, SiteHead, ErrorBoundary…)
    │   ├── layout/         # Navbar, Footer, Layout
    │   ├── product/        # product detail building blocks
    │   ├── checkout/       # checkout building blocks
    │   └── admin/          # admin panel components
    ├── config/             # env-driven config
    ├── features/           # Redux slices
    ├── hooks/              # reusable hooks
    ├── pages/              # route-level pages (admin/ for admin pages)
    ├── routes/             # AppRoutes + route guards
    ├── store/              # Redux store
    ├── styles/, theme/     # tokens, responsive CSS, MUI theme
    ├── types/              # shared TypeScript types (mirror backend DTOs)
    └── utils/              # pure helpers
```

## Responsibilities

- **Pages:** compose components, read route params, call hooks. No raw HTTP calls.
- **Components:** render UI from props. Keep them small and presentational where possible.
- **Hooks:** encapsulate data loading, form logic, and side effects.
- **API modules:** the only place that talks to the backend; typed request/response.
- **Slices:** global client state only (auth, cart, wishlist…), not every server response.
- **Server (`server/`):** render crawlable HTML, set status codes, redirects, cache headers. No business logic.

---

# 7. TypeScript & React Coding Standards

- `strict` TypeScript; no `any` unless justified in a comment. Prefer `unknown` + narrowing.
- Types for backend data live in `src/types` and must match backend DTOs.
- Function components and hooks only; no class components except `ErrorBoundary`.
- PascalCase components/files, camelCase hooks (`useX`), functions, variables.
- Follow the Rules of Hooks; complete dependency arrays.
- Avoid `useEffect` for derived state; compute it during render or with `useMemo` when needed.
- Memoize (`useMemo`, `useCallback`, `React.memo`) only when it measurably helps.
- Keep components small (~250 lines max); extract subcomponents and hooks.
- Avoid prop drilling deeper than 2–3 levels; use composition or context.
- Stable, unique `key`s (never array index for dynamic lists).
- No magic numbers or strings; use constants or theme tokens.
- No inline styles when a theme token or `sx` from the theme exists.
- No `console.log`; use `src/utils/logger.ts`.
- Remove unused imports, components, and files when safe.

Comments explain *why*, not *what*.

---

# 8. API Integration Standards

- All calls go through `src/api/axiosInstance.ts` (base URL, Bearer token, 401 handling, trace IDs).
- One API module per backend resource; functions are typed and return `data` from `ApiResponse<T>`.
- Handle `ApiErrorResponse` (`message`, `fieldErrors`, `traceId`) via `src/utils/apiError.ts`.
- Show user-friendly messages; never show raw stack traces or backend internals.
- Show loading, empty, and error states for every data-driven view.
- Cancel or ignore stale requests on unmount/route change.
- Never hardcode the backend URL; use `config.apiBaseUrl` (empty = same origin, `/api` proxied).
- Paginate large lists; never fetch "all" in a loop.

---

# 9. State Management

- Redux Toolkit for cross-page client state: auth session, cart, wishlist, order flow.
- Server data that is only used by one page stays local to that page/hook.
- Use `createAsyncThunk` or React Query consistently per feature.
- Never store derived data in Redux.
- Persist to `localStorage` only what is required (session token, user summary, token expiry).

---

# 10. UI, UX & Design System

- Use MUI components and the project theme; keep colours, spacing, and typography in tokens.
- Mobile-first responsive layouts (`src/styles/responsive.css`, MUI breakpoints).
- Skeletons for loading states (existing `*Skeleton` components) to avoid layout shift.
- Confirm destructive admin actions (`ConfirmDialog`, `InlineConfirmBar`).
- Toasts for success/failure feedback (`ToastProvider`).
- Forms: inline validation, disabled submit while saving, clear error text.
- Indian context: ₹ currency formatting, 6-digit pincodes, Indian phone numbers.

---

# 11. Accessibility (WCAG 2.2 AA)

- Semantic HTML: one `<h1>` per page, logical heading order, landmarks (`header`, `nav`, `main`, `footer`).
- All images have meaningful `alt` (empty `alt=""` for decorative).
- Every form control has a label; errors are announced.
- Full keyboard navigation; visible focus; no keyboard traps in dialogs/drawers.
- Colour contrast ≥ 4.5:1 for text.
- Respect `prefers-reduced-motion` for animations (fly-to-cart, page transitions, reveal-on-scroll).
- ARIA only when native semantics are not enough.

---

# 12. Frontend Security

- Never put secrets in `VITE_*` variables; everything in the bundle is public.
- Never render untrusted HTML without sanitizing it. `dangerouslySetInnerHTML` is allowed only for sanitized, admin-authored content.
- Do not build URLs or `href`s from user input without validation (block `javascript:`).
- Use `rel="noopener noreferrer"` on `target="_blank"` links.
- Route guards are a UX feature, not security. The backend must enforce every permission.
- Dev-only helpers (dev login, debug panels) must be impossible to enable in production builds **and** must not rely on insecure backend endpoints.
- Load third-party scripts (Google, Razorpay, GA) only from their official domains.
- Clear all session data on logout and on 401.
- Do not log tokens, OTPs, or personal data.

---

# 13. Error Handling

- `ErrorBoundary` around the app and around heavy/lazy sections.
- `ApiErrorNotifier` / toasts for API errors; include the `traceId` in reports.
- `globalErrorReporter` sends uncaught errors to `POST /api/errors/report`. Avoid duplicate reports and never include tokens or personal data.
- Real 404 page (`NotFoundPage`) for unknown routes and missing products/posts. The SSR server must return HTTP 404 for them.
- Never silently swallow errors.

---

# 14. Performance & Core Web Vitals

Targets (mobile, p75): **LCP < 2.5 s, INP < 200 ms, CLS < 0.1.**

- Lazy-load route pages (already done) and heavy libraries (Tiptap, Recharts, lightbox) only where used.
- Keep vendor chunks split (`vite.config.ts` `manualChunks`); avoid importing all of `@mui/icons-material`. Use per-icon imports.
- Optimize images through Cloudinary transformations (`src/utils/cloudinary.ts`): correct width, `f_auto,q_auto`, `loading="lazy"` below the fold, explicit width/height.
- Preload the LCP image on product/home pages; never lazy-load it.
- Avoid layout shift: reserve space for images, banners, skeletons.
- Debounce search and pincode inputs.
- Keep the SSR in-memory cache (`server/index.mjs`, 60 s) for public pages; never cache private pages.
- Avoid unnecessary re-renders and large Redux payloads.

---

# 15. SEO & Search Engine Optimization

SEO is mandatory for all public pages. Never promise rankings.

## 15.1 Rendering

- Public pages (home, products, product detail, categories, blog, static pages) must return **meaningful HTML in the first response** from `server/render.mjs`. Do not rely on client-side rendering for crawlers.
- When a new public route is added, add a matching SSR renderer and test in `server/index.test.mjs`.
- Private routes (`/admin`, `/cart`, `/checkout`, `/orders`, `/profile`, `/wishlist`) are served as a `noindex` shell with `Cache-Control: no-store`.

## 15.2 Metadata (per page)

- Unique `<title>` (brand suffix) and meta description.
- Self-referencing absolute canonical URL.
- `robots` meta: `noindex,nofollow` for private/transactional pages.
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and Twitter Card.
- The SSR head and the client `Seo` component must produce the **same** values.

## 15.3 URLs & Redirects

- Lowercase, hyphenated, descriptive URLs: `/products/{categorySlug}/{productSlug}`, `/blog/{slug}`.
- One canonical URL per resource; other variants 301-redirect to it (handled in the SSR server).
- Never redirect missing pages to the home page; return real 404s.
- Changing a slug or route requires a redirect plan in the spec.

## 15.4 Structured Data (JSON-LD)

- Organization + WebSite (site-wide), Product (+ Offer, AggregateRating only when real reviews exist), BreadcrumbList, BlogPosting/Article.
- Structured data must match visible content and be valid in Google's Rich Results Test.
- No duplicate JSON-LD between SSR output and client-side `Seo` after hydration.

## 15.5 Sitemaps & robots.txt

- `/sitemap.xml` and `/robots.txt` are proxied to the backend by the SSR server. Do not maintain hand-written copies in `public/`.

## 15.6 Content

- Semantic headings, descriptive link text, internal links (breadcrumbs, related products/posts).
- Image `alt` text that describes the product.
- No keyword stuffing or thin auto-generated pages.

## 15.7 Verification

Test with `curl` (SSR HTML), Lighthouse, PageSpeed Insights, Rich Results Test, Search Console URL Inspection.

---

# 16. Configuration & Environment

- Build-time config via `VITE_*` (see root `.env.example`); runtime SSR config via `BACKEND_INTERNAL_URL`, `PUBLIC_SITE_URL`, `PORT`.
- Read config only through `src/config/index.ts`.
- `VITE_GOOGLE_CLIENT_ID` is required in production builds (build fails fast).
- Changing a `VITE_*` value requires rebuilding the image.
- Never commit real credentials.

---

# 17. Testing Standards

- **SSR server:** `node --test server/*.test.mjs`. Cover status codes, redirects, metadata, JSON-LD, private-route `noindex`, sitemap/robots proxy.
- **Components/hooks (when approved):** Vitest + React Testing Library. Test behaviour, not implementation.
- **Critical flows to verify manually or by E2E:** login (Google, WhatsApp OTP), add to cart, checkout (Razorpay test mode + COD), order history, admin product CRUD.
- Test success and failure paths (API errors, empty states, expired session).
- Lint and type-check must pass.

---

# 18. Docker & Deployment

- Multi-stage Dockerfile: Node 20 build (`npm ci`, `npm run build`), then Node 20 runtime running `server/index.mjs` on port 80.
- `VITE_*` values are build args; runtime values are environment variables.
- Container is fronted by host Nginx (TLS) via `docker-compose.prod.yml` (`127.0.0.1:3000 → 80`).
- `/healthz` is the health endpoint.
- Prefer a non-root user and a Docker `HEALTHCHECK`.

---

# 19. Code Cleanup & File Management

- Remove unused imports, components, styles, and dependencies.
- Do not delete pages, routes, or public files without approval (they may be indexed URLs).
- Do not rename routes or slugs without a redirect plan.
- Do not overwrite user changes.
- Do not create unnecessary documentation files.

Before deleting any important file, explain why and request approval.

---

# 20. Running the Project

```bash
npm ci                 # install
npm run dev            # Vite dev server on http://localhost:3000 (proxies /api → :8080)
npm run lint           # ESLint
npm run build          # type-check + production build to dist/
npm test               # SSR server tests
npm run preview        # run the production Node server against dist/
```

The backend must be running on `http://localhost:8080` for API calls in development.

---

# 21. How to Respond

Explain everything as if talking to a 15-year-old with no coding background. Use simple English.

For every response, include:

**What I just did** — what changed.

**What you need to do** — clear steps, if any.

**Why** — one sentence.

**Next step** — one clear action.

**Errors** — what went wrong, why, how to fix it, exact commands.

Never claim something worked if it was not verified.

---

# 22. Mandatory Completion Checklist

## Code Quality
- [ ] TypeScript strict, no new `any`.
- [ ] Lint passes.
- [ ] No duplicate components/hooks/API functions.
- [ ] No unrelated modifications.
- [ ] No new dependencies without approval.

## Architecture
- [ ] Pages are thin; logic in hooks; HTTP only in `src/api`.
- [ ] Types match backend DTOs.
- [ ] Loading, empty, and error states handled.

## Security
- [ ] No secrets in `VITE_*`.
- [ ] Untrusted HTML sanitized.
- [ ] Dev-only features disabled in production.
- [ ] Session cleared on logout/401.

## Accessibility
- [ ] Keyboard navigable, labelled controls, alt text, contrast OK.

## Performance
- [ ] No large new chunks; heavy libs lazy-loaded.
- [ ] Images sized and optimized; LCP image not lazy.
- [ ] No new layout shift.

## SEO (public pages)
- [ ] SSR HTML contains title, description, canonical, OG, JSON-LD.
- [ ] Correct HTTP status (200/301/404).
- [ ] Private pages `noindex` + `no-store`.
- [ ] SSR and client metadata match.

## Testing & Deployment
- [ ] `npm run build` succeeds.
- [ ] `npm test` passes.
- [ ] Affected pages verified in the browser.
- [ ] Docker build succeeds if Dockerfile/config changed.

Never mark unchecked items as completed. If something cannot be tested, say so.

---

# 23. Core Development Rules

1. Read `CLAUDE.md` and `project_specs.md` first.
2. Understand the existing code before changing it.
3. Define the spec, show it, and wait for approval.
4. Follow TypeScript, React, and accessibility standards.
5. Keep public pages server-rendered and crawlable.
6. Never break URLs, canonicals, or API contracts.
7. Never put secrets in the frontend.
8. Reuse existing components and libraries.
9. Do not add dependencies without approval.
10. Test everything that changed.
11. Explain in simple English.
12. Never claim untested work is complete.
13. Never promise Google rankings.

---

# FINAL PRINCIPLE

**Understand First → Analyze → Define → Get Approval → Implement → Test → Verify → Explain.**

Do exactly what is requested. Nothing more. Nothing less.

Never sacrifice security, accessibility, performance, SEO, or existing functionality for speed.
