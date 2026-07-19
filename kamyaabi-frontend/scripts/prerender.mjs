#!/usr/bin/env node
/**
 * prerender.mjs — Kamyaabi SEO Pre-render Script
 *
 * This script runs AFTER `vite build` to generate static HTML snapshots
 * of every public route in the `dist/` directory. Googlebot will receive
 * real HTML content with meta tags and JSON-LD structured data instead
 * of an empty SPA shell.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Spins up a lightweight local HTTP server on the `dist/` directory.
 * 2. Launches headless Chromium via Puppeteer.
 * 3. Visits each route, waits for React to hydrate, then saves the
 *    rendered HTML as dist/<route>/index.html.
 * 4. The nginx SPA location block serves these pre-built HTML files
 *    directly to Googlebot (user-agent sniffing is NOT required —
 *    every visitor gets the same pre-rendered HTML which also loads
 *    the React bundle for full interactivity).
 *
 * IMPORTANT — Dynamic routes (product/blog slugs):
 * The script fetches slug lists from the live API at build time.
 * Set the VITE_API_BASE_URL env var to your API endpoint so slugs
 * are populated correctly.
 *
 * USAGE
 *   node scripts/prerender.mjs
 *   (or: npm run prerender — see package.json)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import handler from 'serve-handler';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PORT = 3099; // internal port — not exposed in production
const API_BASE = process.env.VITE_API_BASE_URL || 'https://kamyaabi.in';
const TIMEOUT = 8000; // ms to wait for React to finish rendering each page

// ---------------------------------------------------------------------------
// Static routes (always pre-rendered)
// ---------------------------------------------------------------------------
const STATIC_ROUTES = [
  '/',
  '/products',
  '/blog',
  '/about',
  '/contact',
  '/track-order',
  '/refund-policy',
];

// ---------------------------------------------------------------------------
// Fetch dynamic slugs from API
// ---------------------------------------------------------------------------
async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? (await import('https')).default : http;
    mod.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getProductRoutes() {
  try {
    const res = await fetchJson(`${API_BASE}/api/products?page=0&size=200&sort=newest`);
    const items = res?.data?.content || [];
    return items.map((p) =>
      p.categorySlug
        ? `/products/${p.categorySlug}/${p.slug}`
        : `/products/${p.slug}`,
    );
  } catch (e) {
    console.warn('[prerender] Could not fetch product routes:', e.message);
    return [];
  }
}

async function getBlogRoutes() {
  try {
    const res = await fetchJson(`${API_BASE}/api/blog/posts?page=0&size=200`);
    const items = res?.data?.content || [];
    return items.map((p) => `/blog/${p.slug}`);
  } catch (e) {
    console.warn('[prerender] Could not fetch blog routes:', e.message);
    return [];
  }
}

async function getCategoryRoutes() {
  try {
    const res = await fetchJson(`${API_BASE}/api/categories`);
    const items = res?.data || [];
    return items
      .filter((c) => c.slug)
      .map((c) => `/products/category/${c.slug}`);
  } catch (e) {
    console.warn('[prerender] Could not fetch category routes:', e.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Start local static server
// ---------------------------------------------------------------------------
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      handler(req, res, {
        public: DIST,
        rewrites: [{ source: '**', destination: '/index.html' }],
      });
    });
    server.listen(PORT, () => {
      console.log(`[prerender] Serving dist/ on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// ---------------------------------------------------------------------------
// Render a single route with Puppeteer
// ---------------------------------------------------------------------------
async function renderRoute(browser, route) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Intercept API requests and redirect them to the real backend
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.port === String(PORT) && url.pathname.startsWith('/api/')) {
      req.continue({ url: `${API_BASE}${url.pathname}${url.search}` });
    } else {
      req.continue();
    }
  });

  // Suppress non-critical console noise from the SPA
  page.on('console', () => {});
  try {
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT,
    });
    // Extra wait for lazy data fetches (product/blog API calls)
    await new Promise((r) => setTimeout(r, 1500));
    const html = await page.content();
    return html;
  } catch (e) {
    console.error(`[prerender] ✗ ${route}:`, e.message);
    return null;
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Write rendered HTML to dist directory
// ---------------------------------------------------------------------------
function writeHtml(route, html) {
  const dir = route === '/'
    ? DIST
    : join(DIST, ...route.replace(/^\//, '').split('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'index.html');
  writeFileSync(outPath, html, 'utf-8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!existsSync(DIST)) {
    console.error('[prerender] dist/ not found — run `npm run build` first.');
    process.exit(1);
  }

  console.log('[prerender] Fetching dynamic routes from API...');
  const [productRoutes, blogRoutes, categoryRoutes] = await Promise.all([
    getProductRoutes(),
    getBlogRoutes(),
    getCategoryRoutes(),
  ]);

  const allRoutes = [
    ...STATIC_ROUTES,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
  ];

  // De-dupe
  const routes = [...new Set(allRoutes)];
  console.log(`[prerender] Rendering ${routes.length} routes...`);

  const server = await startServer();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let success = 0;
  let failed = 0;

  // Render in batches of 4 to avoid overwhelming the server
  const BATCH = 4;
  for (let i = 0; i < routes.length; i += BATCH) {
    const batch = routes.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (route) => {
        const html = await renderRoute(browser, route);
        if (html) {
          writeHtml(route, html);
          console.log(`[prerender] ✓ ${route}`);
          success++;
        } else {
          failed++;
        }
      }),
    );
  }

  await browser.close();
  server.close();

  console.log(`\n[prerender] Done — ${success} succeeded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
