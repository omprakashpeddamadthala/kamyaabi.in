import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

/**
 * GSC FIX: Reusable per-page SEO head component.
 *
 * Centralises the tags Google Search Console flags when missing:
 *  - unique <title> and <meta name="description"> per page
 *  - a self-referencing <link rel="canonical"> (resolves "Duplicate without
 *    user-selected canonical" + "Alternate page with proper canonical tag")
 *  - Open Graph + Twitter Card tags (rich social/link previews)
 *  - optional robots `noindex,nofollow` for private/transactional pages so
 *    they never enter the index ("Crawled - currently not indexed" noise)
 *  - optional JSON-LD structured data blocks (schema.org)
 *  - hreflang for en-IN locale targeting
 *  - article published/modified dates for blog posts
 *
 * react-helmet-async de-dupes by tag, and because this renders inside the
 * Router (after the sitewide <SiteHead/> defaults) the page-level values win.
 */
export interface SeoProps {
  title?: string;
  description?: string;
  /** Canonical path (e.g. "/products"). Defaults to the current pathname. */
  canonicalPath?: string;
  /** Absolute canonical URL. Takes precedence over canonicalPath when set. */
  canonicalUrl?: string;
  image?: string;
  /** og:type — "website" for listings, "product"/"article" for detail pages. */
  type?: string;
  keywords?: string;
  noindex?: boolean;
  /** One or more schema.org JSON-LD objects rendered as <script> blocks. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  /**
   * ISO 8601 date strings for article Open Graph tags (blog posts).
   * Setting these changes og:type to "article" automatically.
   */
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** Author name for article Open Graph. */
  authorName?: string | null;
}

const SITE_NAME = 'Kamyaabi';
const DEFAULT_DESCRIPTION =
  'Shop premium, hand-picked dry fruits and nuts at Kamyaabi — almonds, cashews, '
  + 'pistachios and more. Sourced for purity, sealed for freshness, delivered across India.';
const DEFAULT_OG_IMAGE = `${config.brandSiteUrl}/pwa-512x512.png`;
const OG_IMAGE_WIDTH = '512';
const OG_IMAGE_HEIGHT = '512';

const resolveCanonical = (canonicalUrl?: string, canonicalPath?: string): string => {
  if (canonicalUrl) return canonicalUrl;
  const path = canonicalPath
    ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  // Strip query/hash so paginated/filtered variants collapse onto one canonical.
  const cleanPath = path.split('?')[0].split('#')[0];
  return `${config.brandSiteUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

const Seo: React.FC<SeoProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  canonicalUrl,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  keywords,
  noindex = false,
  jsonLd,
  publishedTime,
  modifiedTime,
  authorName,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Premium Dry Fruits`;
  const canonical = resolveCanonical(canonicalUrl, canonicalPath);
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Auto-switch og:type to "article" when publish dates are provided.
  const resolvedType = publishedTime ? 'article' : type;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta
        name="robots"
        content={noindex
          ? 'noindex,nofollow'
          : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}
      />
      {/* GSC FIX: self-referencing canonical to avoid duplicate-URL warnings. */}
      <link rel="canonical" href={canonical} />

      {/* GSC FIX: hreflang targeting India / English. */}
      <link rel="alternate" hrefLang="en-IN" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* GSC FIX: Open Graph tags for rich link previews. */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={resolvedType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
      <meta property="og:locale" content="en_IN" />

      {/* Article-specific Open Graph tags (blog posts). */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {authorName && <meta property="article:author" content={authorName} />}

      {/* GSC FIX: Twitter Card tags. */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdBlocks.map((block, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
