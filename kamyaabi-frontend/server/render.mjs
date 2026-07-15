const SITE_NAME = 'Kamyaabi';
const DEFAULT_DESCRIPTION = 'Shop premium, hand-picked dry fruits and nuts at Kamyaabi. Sourced for purity, sealed for freshness, and delivered across India.';
const DEFAULT_IMAGE_PATH = '/pwa-512x512.png';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function plainText(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function absoluteUrl(siteUrl, value) {
  if (!value) return `${siteUrl}${DEFAULT_IMAGE_PATH}`;
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return `${siteUrl}${DEFAULT_IMAGE_PATH}`;
  }
}

function optimizedImageUrl(siteUrl, value, width) {
  const image = absoluteUrl(siteUrl, value);
  if (!image.includes('res.cloudinary.com') || !image.includes('/upload/')) return image;
  return image.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

function titleWithBrand(title) {
  const normalized = plainText(title);
  if (!normalized) return `${SITE_NAME} - Premium Dry Fruits`;
  return normalized.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? normalized
    : `${normalized} | ${SITE_NAME}`;
}

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

export function seoHead({
  siteUrl,
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  canonicalUrl,
  image,
  type = 'website',
  keywords,
  noindex = false,
  jsonLd = [],
}) {
  const fullTitle = titleWithBrand(title);
  const cleanDescription = plainText(description).slice(0, 320) || DEFAULT_DESCRIPTION;
  const canonical = canonicalUrl || `${siteUrl}${canonicalPath}`;
  const socialImage = absoluteUrl(siteUrl, image);
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return [
    '<!--app-seo-start-->',
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(cleanDescription)}" />`,
    keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : '',
    `<meta name="robots" content="${noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(cleanDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(socialImage)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(cleanDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(socialImage)}" />`,
    ...schemas.filter(Boolean).map((schema) => `<script type="application/ld+json">${safeJson(schema)}</script>`),
    '<!--app-seo-end-->',
  ].filter(Boolean).join('\n');
}

const CRITICAL_STYLES = `
<style id="prerender-critical-css">
  .seo-page{max-width:1200px;margin:0 auto;padding:32px 20px;color:#172033;font-family:"Plus Jakarta Sans",Arial,sans-serif;line-height:1.6}
  .seo-page h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.15;margin:16px 0}.seo-page h2{margin-top:32px}
  .seo-breadcrumbs{font-size:.9rem;margin-bottom:20px}.seo-breadcrumbs a,.seo-page a{color:#1d4ed8}
  .seo-product{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1fr);gap:40px;align-items:start}
  .seo-product img,.seo-card img,.seo-article>img{max-width:100%;height:auto;border-radius:16px}
  .seo-price{font-size:1.6rem;font-weight:800}.seo-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
  .seo-card{border:1px solid #e5e7eb;border-radius:16px;padding:16px;background:#fff}.seo-card h2,.seo-card h3{margin:12px 0 4px;font-size:1.05rem}
  .seo-muted{color:#5f6b7a}.seo-status{font-weight:700}.seo-article{max-width:800px;margin:0 auto}.seo-article p{margin:16px 0}
  @media(max-width:720px){.seo-product{grid-template-columns:1fr}.seo-page{padding:24px 16px}}
</style>`;

export function renderDocument(template, head, body, bootstrapData) {
  const bootstrap = bootstrapData
    ? `<script id="kamyaabi-bootstrap-data" type="application/json">${safeJson(bootstrapData)}</script>`
    : '';
  return template
    .replace(/<!--app-seo-start-->[\s\S]*?<!--app-seo-end-->/, head)
    .replace('</head>', `${CRITICAL_STYLES}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace('</body>', `${bootstrap}\n</body>`);
}

function breadcrumbs(items, siteUrl) {
  const links = items.map((item, index) => {
    const value = escapeHtml(item.name);
    return item.path && index < items.length - 1
      ? `<a href="${escapeHtml(item.path)}">${value}</a>`
      : `<span aria-current="page">${value}</span>`;
  }).join(' <span aria-hidden="true">/</span> ');

  return {
    html: `<nav class="seo-breadcrumbs" aria-label="Breadcrumb">${links}</nav>`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${siteUrl}${item.path || ''}`,
      })),
    },
  };
}

function productPath(product) {
  return product.categorySlug
    ? `/products/${encodeURIComponent(product.categorySlug)}/${encodeURIComponent(product.slug)}`
    : `/products/${encodeURIComponent(product.slug)}`;
}

function effectivePrice(product) {
  const discount = Number(product.discountPrice);
  return Number.isFinite(discount) && discount > 0 ? discount : Number(product.price);
}

function productCard(product, siteUrl) {
  const path = productPath(product);
  const image = optimizedImageUrl(siteUrl, product.mainImageUrl || product.imageUrl, 480);
  const description = plainText(product.description).slice(0, 140);
  return `<article class="seo-card">
    <a href="${escapeHtml(path)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="420" height="420" loading="lazy" /></a>
    <h2><a href="${escapeHtml(path)}">${escapeHtml(product.name)}</a></h2>
    ${description ? `<p class="seo-muted">${escapeHtml(description)}</p>` : ''}
    <p class="seo-price">₹${escapeHtml(effectivePrice(product).toFixed(2))}</p>
  </article>`;
}

function blogCard(post, siteUrl) {
  const path = `/blog/${encodeURIComponent(post.slug)}`;
  const image = post.coverImageUrl
    ? `<a href="${escapeHtml(path)}"><img src="${escapeHtml(optimizedImageUrl(siteUrl, post.coverImageUrl, 720))}" alt="${escapeHtml(post.coverImageAlt || post.title)}" width="640" height="360" loading="lazy" /></a>`
    : '';
  return `<article class="seo-card">
    ${image}
    <h2><a href="${escapeHtml(path)}">${escapeHtml(post.title)}</a></h2>
    ${post.excerpt ? `<p class="seo-muted">${escapeHtml(plainText(post.excerpt))}</p>` : ''}
  </article>`;
}

export function renderProduct(template, siteUrl, product, rating) {
  const path = productPath(product);
  const image = optimizedImageUrl(siteUrl, product.ogImageUrl || product.mainImageUrl || product.imageUrl, 1200);
  const contentDescription = plainText(product.description || product.seoDescription)
    || `Buy ${product.name} online at Kamyaabi. Premium quality, freshly packed, and delivered across India.`;
  const metaDescription = plainText(product.seoDescription || contentDescription);
  const price = effectivePrice(product);
  const inStock = Number(product.stock) > 0;
  const crumb = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    ...(product.categoryName ? [{ name: product.categoryName, path: `/products/category/${encodeURIComponent(product.categorySlug)}` }] : []),
    { name: product.name, path },
  ], siteUrl);
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: contentDescription,
    image: [image],
    sku: product.slug,
    category: product.categoryName || undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${path}`,
      priceCurrency: 'INR',
      price: price.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(rating?.totalReviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(rating.averageRating).toFixed(1),
        reviewCount: rating.totalReviews,
      },
    } : {}),
  };
  const head = seoHead({
    siteUrl,
    title: product.seoTitle || product.name,
    description: metaDescription,
    canonicalUrl: product.canonicalUrl || `${siteUrl}${path}`,
    image,
    type: 'product',
    keywords: product.seoKeywords,
    jsonLd: [productSchema, crumb.schema],
  });
  const body = `<main class="seo-page">
    ${crumb.html}
    <article class="seo-product">
      <div><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="720" height="720" fetchpriority="high" /></div>
      <div>
        <h1>${escapeHtml(product.name)}</h1>
        ${product.categoryName ? `<p><a href="/products/category/${escapeHtml(product.categorySlug)}">${escapeHtml(product.categoryName)}</a></p>` : ''}
        <p class="seo-price">₹${escapeHtml(price.toFixed(2))}</p>
        <p class="seo-status">${inStock ? 'In stock' : 'Out of stock'}</p>
        <p>${escapeHtml(contentDescription)}</p>
        ${product.weight ? `<p><strong>Pack size:</strong> ${escapeHtml(`${product.weight}${product.unit || ''}`)}</p>` : ''}
      </div>
    </article>
  </main>`;
  return renderDocument(template, head, body, { path, product });
}

export function renderProductList(template, siteUrl, { products, categories, category }) {
  const path = category ? `/products/category/${encodeURIComponent(category.slug)}` : '/products';
  const title = category ? `${category.name} Dry Fruits & Nuts` : 'Shop Premium Dry Fruits & Nuts';
  const description = category?.description
    || `Browse Kamyaabi's premium ${category ? category.name : 'dry fruits and nuts'}, freshly packed and delivered across India.`;
  const crumb = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    ...(category ? [{ name: category.name, path }] : []),
  ], siteUrl);
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${siteUrl}${path}`,
  };
  const categoryLinks = categories.map((item) => (
    `<li><a href="/products/category/${escapeHtml(item.slug)}">${escapeHtml(item.name)}</a></li>`
  )).join('');
  const head = seoHead({ siteUrl, title, description, canonicalPath: path, jsonLd: [collectionSchema, crumb.schema] });
  const body = `<main class="seo-page">
    ${crumb.html}
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    ${categoryLinks ? `<nav aria-label="Product categories"><h2>Shop by category</h2><ul>${categoryLinks}</ul></nav>` : ''}
    <section aria-labelledby="products-heading"><h2 id="products-heading">${category ? `Products in ${escapeHtml(category.name)}` : 'All products'}</h2>
      <div class="seo-list">${products.length ? products.map((product) => productCard(product, siteUrl)).join('') : '<p>No products are currently available.</p>'}</div>
    </section>
  </main>`;
  return renderDocument(template, head, body);
}

export function renderBlogList(template, siteUrl, { posts, categories = [], tags = [], category, tag }) {
  const filter = category || tag;
  const path = category
    ? `/blog/category/${encodeURIComponent(category.slug)}`
    : tag
      ? `/blog/tag/${encodeURIComponent(tag.slug)}`
      : '/blog';
  const title = filter ? `${filter.name} Articles` : 'Kamyaabi Dry Fruits Blog';
  const description = filter?.description
    || `Expert guides, nutrition tips, recipes, and buying advice for premium dry fruits and nuts.`;
  const crumb = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    ...(filter ? [{ name: filter.name, path }] : []),
  ], siteUrl);
  const taxonomy = [
    ...categories.map((item) => `<li><a href="/blog/category/${escapeHtml(item.slug)}">${escapeHtml(item.name)}</a></li>`),
    ...tags.map((item) => `<li><a href="/blog/tag/${escapeHtml(item.slug)}">${escapeHtml(item.name)}</a></li>`),
  ].join('');
  const head = seoHead({ siteUrl, title, description, canonicalPath: path, jsonLd: crumb.schema });
  const body = `<main class="seo-page">
    ${crumb.html}
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    ${taxonomy ? `<nav aria-label="Blog topics"><h2>Browse topics</h2><ul>${taxonomy}</ul></nav>` : ''}
    <section aria-labelledby="articles-heading"><h2 id="articles-heading">Latest articles</h2>
      <div class="seo-list">${posts.length ? posts.map((post) => blogCard(post, siteUrl)).join('') : '<p>No published articles were found.</p>'}</div>
    </section>
  </main>`;
  return renderDocument(template, head, body);
}

export function renderBlogPost(template, siteUrl, post) {
  const path = `/blog/${encodeURIComponent(post.slug)}`;
  const description = plainText(post.seoDescription || post.excerpt || post.content).slice(0, 320);
  const image = optimizedImageUrl(siteUrl, post.ogImageUrl || post.coverImageUrl, 1200);
  const crumb = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path },
  ], siteUrl);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: [image],
    author: { '@type': 'Person', name: post.authorName || SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/pwa-512x512.png` },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}${path}` },
  };
  const content = plainText(post.content);
  const paragraphs = content
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .reduce((chunks, sentence) => {
      const last = chunks.at(-1);
      if (!last || last.length > 500) chunks.push(sentence);
      else chunks[chunks.length - 1] = `${last} ${sentence}`;
      return chunks;
    }, [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const head = seoHead({
    siteUrl,
    title: post.seoTitle || post.title,
    description,
    canonicalUrl: post.canonicalUrl || `${siteUrl}${path}`,
    image,
    type: 'article',
    keywords: post.seoKeywords,
    jsonLd: [articleSchema, crumb.schema],
  });
  const body = `<main class="seo-page"><article class="seo-article">
    ${crumb.html}
    <h1>${escapeHtml(post.title)}</h1>
    <p class="seo-muted">${escapeHtml(post.authorName || SITE_NAME)}${post.publishedAt ? ` · ${escapeHtml(new Date(post.publishedAt).toLocaleDateString('en-IN'))}` : ''}</p>
    ${post.coverImageUrl ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.coverImageAlt || post.title)}" width="1200" height="675" fetchpriority="high" />` : ''}
    ${paragraphs || `<p>${escapeHtml(description)}</p>`}
  </article></main>`;
  return renderDocument(template, head, body);
}

export function renderHome(template, siteUrl, { products, categories, posts }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/pwa-512x512.png`,
  };
  const head = seoHead({
    siteUrl,
    title: 'Premium Dry Fruits',
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/',
    jsonLd: organizationSchema,
  });
  const body = `<main class="seo-page">
    <h1>Premium Dry Fruits, Nuts & Healthy Snacks</h1>
    <p>${escapeHtml(DEFAULT_DESCRIPTION)}</p>
    <nav aria-label="Product categories"><h2>Shop by category</h2><ul>${categories.map((category) => `<li><a href="/products/category/${escapeHtml(category.slug)}">${escapeHtml(category.name)}</a></li>`).join('')}</ul></nav>
    <section><h2>Featured products</h2><div class="seo-list">${products.map((product) => productCard(product, siteUrl)).join('')}</div></section>
    <section><h2>Latest from our blog</h2><div class="seo-list">${posts.map((post) => blogCard(post, siteUrl)).join('')}</div></section>
  </main>`;
  return renderDocument(template, head, body);
}

const STATIC_PAGES = {
  '/about': {
    title: 'About Kamyaabi',
    description: 'Learn about Kamyaabi and our commitment to premium, carefully sourced dry fruits and nuts.',
    heading: 'About Kamyaabi',
    content: 'Kamyaabi brings carefully selected dry fruits and nuts to customers across India, with a focus on quality, freshness, secure packing, and reliable delivery.',
  },
  '/contact': {
    title: 'Contact Kamyaabi',
    description: 'Contact Kamyaabi for product, order, delivery, and customer support questions.',
    heading: 'Contact Kamyaabi',
    content: 'Our customer support team can help with product, order, payment, and delivery questions. Use the contact options on this page to reach us.',
  },
  '/refund-policy': {
    title: 'Refund & Return Policy',
    description: 'Read the Kamyaabi refund, return, cancellation, and damaged-order policy.',
    heading: 'Refund & Return Policy',
    content: 'Review the conditions and process for cancellations, returns, damaged items, and eligible refunds before placing or changing an order.',
  },
  '/track-order': {
    title: 'Track Your Kamyaabi Order',
    description: 'Track the latest delivery status of your Kamyaabi order.',
    heading: 'Track Your Order',
    content: 'Enter your order information on this page to view the latest available shipment and delivery status.',
  },
};

export function renderStaticPage(template, siteUrl, path) {
  const page = STATIC_PAGES[path];
  if (!page) return null;
  const crumb = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: page.heading, path },
  ], siteUrl);
  const head = seoHead({ siteUrl, title: page.title, description: page.description, canonicalPath: path, jsonLd: crumb.schema });
  const body = `<main class="seo-page">${crumb.html}<h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.content)}</p></main>`;
  return renderDocument(template, head, body);
}

export function renderNotFound(template, siteUrl, message = 'The page you requested could not be found.') {
  const head = seoHead({
    siteUrl,
    title: 'Page Not Found',
    description: message,
    canonicalPath: '/404',
    noindex: true,
  });
  const body = `<main class="seo-page"><h1>Page Not Found</h1><p>${escapeHtml(message)}</p><p><a href="/">Return to Kamyaabi</a></p></main>`;
  return renderDocument(template, head, body);
}

export function renderPrivateShell(template, siteUrl, path) {
  const head = seoHead({
    siteUrl,
    title: 'Kamyaabi',
    description: 'Kamyaabi customer account and shopping page.',
    canonicalPath: path,
    noindex: true,
  });
  return renderDocument(template, head, '');
}

export { productPath };
