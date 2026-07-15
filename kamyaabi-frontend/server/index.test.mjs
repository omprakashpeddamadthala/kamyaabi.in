import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { afterEach, test } from 'node:test';
import { createApp } from './index.mjs';

const TEMPLATE = `<!doctype html><html><head>
<!--app-seo-start--><title>Default</title><link rel="canonical" href="https://kamyaabi.in/" /><!--app-seo-end-->
</head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;

const product = {
  id: 12,
  name: 'Premium Cashews 500g',
  slug: 'premium-cashews-500g',
  description: '<p>Large, crunchy premium cashews packed fresh.</p>',
  price: 899,
  discountPrice: 749,
  mainImageUrl: 'https://images.example/cashews.jpg',
  categoryName: 'Cashews',
  categorySlug: 'cashews',
  stock: 20,
  weight: '500',
  unit: 'g',
  seoTitle: 'Buy Premium Cashews 500g Online',
  seoDescription: 'Fresh premium cashews delivered across India.',
};

const post = {
  id: 4,
  title: 'Health Benefits of Cashews',
  slug: 'health-benefits-of-cashews',
  excerpt: 'Learn why cashews belong in a balanced diet.',
  content: '<p>Cashews provide healthy fats, plant protein, and essential minerals. They are easy to add to meals and snacks.</p>',
  coverImageUrl: 'https://images.example/blog-cashews.jpg',
  authorName: 'Kamyaabi',
  publishedAt: '2026-07-01T10:00:00',
  updatedAt: '2026-07-10T10:00:00',
};

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

function fakeFetch(routes) {
  return async (input) => {
    const url = new URL(input);
    const key = `${url.pathname}${url.search}`;
    const route = routes[key];
    if (!route) return Response.json({ message: 'not found' }, { status: 404 });
    if (route.status && route.status !== 200) {
      return Response.json({ message: route.message || 'error' }, { status: route.status });
    }
    if (route.body !== undefined) {
      return new Response(route.body, { headers: route.headers });
    }
    return Response.json({ success: true, data: route.data });
  };
}

async function start(routes) {
  const app = await createApp({
    backendUrl: 'http://backend.test',
    siteUrl: 'https://kamyaabi.in',
    template: TEMPLATE,
    fetchImpl: fakeFetch(routes),
    staticDirectory: '/nonexistent',
  });
  const server = createServer(app);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test('product page returns rendered content, metadata, and Product JSON-LD in the first response', async () => {
  const origin = await start({
    '/api/products/slug/premium-cashews-500g': { data: product },
    '/api/products/12/reviews/summary': {
      data: { averageRating: 4.8, totalReviews: 32, recentBuyersCount: 9 },
    },
  });

  const response = await fetch(`${origin}/products/cashews/premium-cashews-500g`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /<h1>Premium Cashews 500g<\/h1>/);
  assert.match(html, /Large, crunchy premium cashews packed fresh/);
  assert.match(html, /https:\/\/images\.example\/cashews\.jpg/);
  assert.match(html, /<link rel="canonical" href="https:\/\/kamyaabi\.in\/products\/cashews\/premium-cashews-500g"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /"@type":"Product"/);
  assert.match(html, /"@type":"AggregateRating"/);
  assert.doesNotMatch(html, /<div id="root"><\/div>/);
});

test('missing and arbitrary page URLs return real HTTP 404 responses with noindex HTML', async () => {
  const origin = await start({
    '/api/products/slug/missing-product': { status: 404 },
  });

  for (const pathname of ['/products/cashews/missing-product', '/definitely-not-a-page']) {
    const response = await fetch(`${origin}${pathname}`);
    const html = await response.text();
    assert.equal(response.status, 404);
    assert.match(html, /Page Not Found/);
    assert.match(html, /name="robots" content="noindex,nofollow"/);
  }
});

test('legacy and mismatched product URLs redirect to the canonical hierarchy', async () => {
  const origin = await start({
    '/api/products/slug/premium-cashews-500g': { data: product },
    '/api/products/12': { data: product },
  });

  for (const pathname of ['/products/premium-cashews-500g', '/products/12', '/products/wrong/premium-cashews-500g']) {
    const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), '/products/cashews/premium-cashews-500g');
  }
});

test('blog and category pages return useful crawlable HTML', async () => {
  const origin = await start({
    '/api/blog/posts/health-benefits-of-cashews': { data: post },
    '/api/categories': {
      data: [{ id: 2, name: 'Cashews', slug: 'cashews', description: 'Premium cashew products.' }],
    },
    '/api/products/category/2?page=0&size=100': {
      data: { content: [product], totalElements: 1 },
    },
  });

  const blogResponse = await fetch(`${origin}/blog/health-benefits-of-cashews`);
  const blogHtml = await blogResponse.text();
  assert.equal(blogResponse.status, 200);
  assert.match(blogHtml, /<h1>Health Benefits of Cashews<\/h1>/);
  assert.match(blogHtml, /"@type":"Article"/);

  const categoryResponse = await fetch(`${origin}/products/category/cashews`);
  const categoryHtml = await categoryResponse.text();
  assert.equal(categoryResponse.status, 200);
  assert.match(categoryHtml, /<h1>Cashews Dry Fruits &amp; Nuts<\/h1>/);
  assert.match(categoryHtml, /Premium Cashews 500g/);
});

test('sitemap and robots are proxied with crawler-safe status and MIME types', async () => {
  const sitemap = '<?xml version="1.0"?><urlset><url><loc>https://kamyaabi.in/products/cashews/premium-cashews-500g</loc></url></urlset>';
  const robots = 'User-agent: *\nDisallow: /api/\n\nSitemap: https://kamyaabi.in/sitemap.xml\n';
  const origin = await start({
    '/sitemap.xml': {
      body: sitemap,
      headers: { 'cache-control': 'public, max-age=300' },
    },
    '/robots.txt': {
      body: robots,
      headers: { 'cache-control': 'public, max-age=3600' },
    },
  });

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get('content-type'), /application\/xml/);
  assert.equal(sitemapResponse.headers.get('cache-control'), 'public, max-age=300');
  assert.equal(await sitemapResponse.text(), sitemap);

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  assert.match(robotsResponse.headers.get('content-type'), /text\/plain/);
  assert.equal(robotsResponse.headers.get('cache-control'), 'public, max-age=3600');
  assert.equal(await robotsResponse.text(), robots);
});
