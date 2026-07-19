import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { brotliCompress, gzip } from 'node:zlib';
import {
  productPath,
  renderBlogList,
  renderBlogPost,
  renderHome,
  renderNotFound,
  renderPrivateShell,
  renderProduct,
  renderProductList,
  renderStaticPage,
} from './render.mjs';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(serverDirectory, '..', 'dist');
const defaultTemplatePath = path.join(distDirectory, 'index.html');
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);
const PRIVATE_ROUTE_PATTERN = /^\/(?:admin(?:\/|$)|cart$|checkout$|orders(?:\/|$)|order(?:\/|$)|profile$|wishlist$|oauth2(?:\/|$))/;
const CACHE_TTL_MS = 60_000;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeSiteUrl(value) {
  const fallback = 'https://kamyaabi.in';
  try {
    const url = new URL(value || fallback);
    return `${url.protocol}//${url.host}`;
  } catch {
    return fallback;
  }
}

function safeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw new ApiError(404, 'Invalid URL');
  }
}

function canonicalRedirect(response, location) {
  response.writeHead(301, {
    Location: location,
    'Cache-Control': 'public, max-age=300',
    'Content-Length': '0',
  });
  response.end();
}

function responseEtag(content) {
  return `"${createHash('sha256').update(content).digest('base64url')}"`;
}

async function compressedBody(request, content, contentType) {
  if (content.length < 1024 || !/^(?:text\/|application\/(?:javascript|json|manifest\+json))/.test(contentType)) {
    return { body: content, encoding: null };
  }
  const accepted = request.headers['accept-encoding'] || '';
  if (accepted.includes('br')) return { body: await brotliAsync(content), encoding: 'br' };
  if (accepted.includes('gzip')) return { body: await gzipAsync(content), encoding: 'gzip' };
  return { body: content, encoding: null };
}

async function send(request, response, status, content, {
  contentType = 'text/html; charset=utf-8',
  cacheControl = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  etag,
} = {}) {
  const raw = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const entityTag = etag || responseEtag(raw);
  if (request.headers['if-none-match'] === entityTag) {
    response.writeHead(304, { ETag: entityTag, 'Cache-Control': cacheControl });
    response.end();
    return;
  }
  const { body, encoding } = await compressedBody(request, raw, contentType);
  const headers = {
    'Cache-Control': cacheControl,
    'Content-Type': contentType,
    'Content-Length': body.length,
    ETag: entityTag,
    Vary: 'Accept-Encoding',
    'X-Content-Type-Options': 'nosniff',
  };
  if (encoding) headers['Content-Encoding'] = encoding;
  response.writeHead(status, headers);
  if (request.method === 'HEAD') response.end();
  else response.end(body);
}

function pageContent(page) {
  return page?.data?.content || page?.content || [];
}

export async function createApp({
  backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080',
  siteUrl = normalizeSiteUrl(process.env.PUBLIC_SITE_URL),
  template,
  fetchImpl = fetch,
  staticDirectory = distDirectory,
} = {}) {
  const htmlTemplate = template || await readFile(defaultTemplatePath, 'utf8');
  const cache = new Map();

  async function backendRequest(endpoint, accept) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      return await fetchImpl(`${backendUrl}${endpoint}`, {
        headers: { Accept: accept, 'User-Agent': 'Kamyaabi-Prerender/1.0' },
        signal: controller.signal,
      });
    } catch (error) {
      throw new ApiError(503, 'Content is temporarily unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  async function api(endpoint) {
    const response = await backendRequest(endpoint, 'application/json');
    if (!response.ok) {
      const message = response.status === 404 ? 'Resource not found' : `Backend returned HTTP ${response.status}`;
      throw new ApiError(response.status, message);
    }
    const payload = await response.json();
    return payload.data;
  }

  async function proxySeoEndpoint(request, response, pathname) {
    const contentType = pathname === '/sitemap.xml'
      ? 'application/xml; charset=utf-8'
      : 'text/plain; charset=utf-8';
    const backendResponse = await backendRequest(pathname, contentType);
    if (!backendResponse.ok) {
      throw new ApiError(backendResponse.status, `Backend returned HTTP ${backendResponse.status}`);
    }
    const content = Buffer.from(await backendResponse.arrayBuffer());
    await send(request, response, backendResponse.status, content, {
      contentType,
      cacheControl: backendResponse.headers.get('cache-control') || undefined,
    });
  }

  async function renderPath(url) {
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    if (pathname === '/') {
      const [categories, products, posts] = await Promise.all([
        api('/api/categories'),
        api('/api/products/featured'),
        api('/api/blog/posts?page=0&size=3'),
      ]);
      return { status: 200, html: renderHome(htmlTemplate, siteUrl, {
        categories: categories || [],
        products: products || [],
        posts: pageContent(posts),
      }) };
    }

    if (pathname === '/products') {
      const categoryQuery = url.searchParams.get('category');
      if (categoryQuery) return { redirect: `/products/category/${encodeURIComponent(categoryQuery)}` };
      const [categories, products] = await Promise.all([
        api('/api/categories'),
        api('/api/products?page=0&size=100'),
      ]);
      return { status: 200, html: renderProductList(htmlTemplate, siteUrl, {
        categories: categories || [],
        products: pageContent(products),
      }) };
    }

    const categoryMatch = pathname.match(/^\/products\/category\/([^/]+)$/);
    if (categoryMatch) {
      const slug = safeSegment(categoryMatch[1]);
      const categories = await api('/api/categories');
      const category = categories.find((item) => item.slug === slug);
      if (!category) throw new ApiError(404, 'Product category not found');
      const products = await api(`/api/products/category/${category.id}?page=0&size=100`);
      return { status: 200, html: renderProductList(htmlTemplate, siteUrl, {
        categories,
        products: pageContent(products),
        category,
      }) };
    }

    const canonicalProductMatch = pathname.match(/^\/products\/([^/]+)\/([^/]+)$/);
    if (canonicalProductMatch) {
      const categorySlug = safeSegment(canonicalProductMatch[1]);
      const productSlug = safeSegment(canonicalProductMatch[2]);
      const product = await api(`/api/products/slug/${encodeURIComponent(productSlug)}`);
      const canonicalPath = productPath(product);
      if (canonicalPath !== pathname || product.categorySlug !== categorySlug) {
        return { redirect: canonicalPath };
      }
      let rating = null;
      try {
        rating = await api(`/api/products/${product.id}/reviews/summary`);
      } catch (error) {
        if (error.status !== 404) console.warn(`Rating pre-render failed for product ${product.id}: ${error.message}`);
      }
      return { status: 200, html: renderProduct(htmlTemplate, siteUrl, product, rating) };
    }

    const legacyProductMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (legacyProductMatch) {
      const identifier = safeSegment(legacyProductMatch[1]);
      const endpoint = /^\d+$/.test(identifier)
        ? `/api/products/${identifier}`
        : `/api/products/slug/${encodeURIComponent(identifier)}`;
      const product = await api(endpoint);
      return { redirect: productPath(product) };
    }

    if (pathname === '/blog') {
      const [posts, categories, tags] = await Promise.all([
        api('/api/blog/posts?page=0&size=50'),
        api('/api/blog/categories'),
        api('/api/blog/tags'),
      ]);
      return { status: 200, html: renderBlogList(htmlTemplate, siteUrl, {
        posts: pageContent(posts),
        categories: categories || [],
        tags: tags || [],
      }) };
    }

    const blogCategoryMatch = pathname.match(/^\/blog\/category\/([^/]+)$/);
    if (blogCategoryMatch) {
      const slug = safeSegment(blogCategoryMatch[1]);
      const [category, posts] = await Promise.all([
        api(`/api/blog/categories/${encodeURIComponent(slug)}`),
        api(`/api/blog/posts?page=0&size=50&category=${encodeURIComponent(slug)}`),
      ]);
      return { status: 200, html: renderBlogList(htmlTemplate, siteUrl, {
        posts: pageContent(posts),
        category,
      }) };
    }

    const blogTagMatch = pathname.match(/^\/blog\/tag\/([^/]+)$/);
    if (blogTagMatch) {
      const slug = safeSegment(blogTagMatch[1]);
      const [tag, posts] = await Promise.all([
        api(`/api/blog/tags/${encodeURIComponent(slug)}`),
        api(`/api/blog/posts?page=0&size=50&tag=${encodeURIComponent(slug)}`),
      ]);
      return { status: 200, html: renderBlogList(htmlTemplate, siteUrl, {
        posts: pageContent(posts),
        tag,
      }) };
    }

    const blogPostMatch = pathname.match(/^\/blog\/([^/]+)$/);
    if (blogPostMatch) {
      const slug = safeSegment(blogPostMatch[1]);
      const post = await api(`/api/blog/posts/${encodeURIComponent(slug)}`);
      return { status: 200, html: renderBlogPost(htmlTemplate, siteUrl, post) };
    }

    if (pathname === '/blogs') return { redirect: '/blog' };
    const staticPage = renderStaticPage(htmlTemplate, siteUrl, pathname);
    if (staticPage) return { status: 200, html: staticPage };
    if (PRIVATE_ROUTE_PATTERN.test(pathname)) {
      return { status: 200, html: renderPrivateShell(htmlTemplate, siteUrl, pathname), privatePage: true };
    }
    throw new ApiError(404, 'The page you requested could not be found.');
  }

  async function serveStatic(request, response, pathname) {
    const decoded = safeSegment(pathname);
    const relative = decoded.replace(/^\/+/, '');
    if (!relative || relative.includes('\0')) return false;
    const filePath = path.resolve(staticDirectory, relative);
    if (filePath !== staticDirectory && !filePath.startsWith(`${staticDirectory}${path.sep}`)) return false;
    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      return false;
    }
    if (!fileStat.isFile()) return false;
    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    await send(request, response, 200, content, {
      contentType: MIME_TYPES.get(extension) || 'application/octet-stream',
      cacheControl: pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
    });
    return true;
  }

  return async function app(request, response) {
    try {
      if (!['GET', 'HEAD'].includes(request.method || '')) {
        await send(request, response, 405, 'Method Not Allowed', {
          contentType: 'text/plain; charset=utf-8',
          cacheControl: 'no-store',
        });
        return;
      }
      const url = new URL(request.url || '/', siteUrl);
      if (url.pathname === '/index.html') {
        canonicalRedirect(response, '/');
        return;
      }
      if (url.pathname === '/healthz') {
        await send(request, response, 200, 'ok', {
          contentType: 'text/plain; charset=utf-8',
          cacheControl: 'no-store',
        });
        return;
      }
      if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
        await proxySeoEndpoint(request, response, url.pathname);
        return;
      }
      if (await serveStatic(request, response, url.pathname)) return;

      const cacheKey = `${url.pathname}${url.search}`;
      const cached = cache.get(cacheKey);
      let result;
      if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
        result = cached.result;
      } else {
        result = await renderPath(url);
        if (!result.redirect && !result.privatePage) cache.set(cacheKey, { createdAt: Date.now(), result });
      }
      if (result.redirect) {
        canonicalRedirect(response, result.redirect);
        return;
      }
      await send(request, response, result.status, result.html, {
        cacheControl: result.privatePage ? 'no-store' : undefined,
      });
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      if (status >= 500) console.error(error);
      const message = status === 404 ? error.message : 'Content is temporarily unavailable. Please try again shortly.';
      const html = renderNotFound(htmlTemplate, siteUrl, message);
      await send(request, response, status, html, {
        cacheControl: status === 404 ? 'public, max-age=60' : 'no-store',
      });
    }
  };
}

export async function startServer(options = {}) {
  const app = await createApp(options);
  const server = createServer((request, response) => {
    app(request, response).catch((error) => {
      console.error(error);
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
    });
  });
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => {
    console.log(`Kamyaabi pre-render server listening on port ${port}`);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
