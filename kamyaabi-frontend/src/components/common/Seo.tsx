import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  image?: string;
  type?: string;
  keywords?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  publishedTime?: string | null;
  modifiedTime?: string | null;
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
      <link rel="canonical" href={canonical} />

      <link rel="alternate" hrefLang="en-IN" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={resolvedType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
      <meta property="og:locale" content="en_IN" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {authorName && <meta property="article:author" content={authorName} />}

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
