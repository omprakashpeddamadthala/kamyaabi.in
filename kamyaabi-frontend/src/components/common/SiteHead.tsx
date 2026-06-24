import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

const GOOGLE_SITE_VERIFICATION = '1e586fe8a6a37882';

/**
 * Global, site-wide <head> tags rendered on every page:
 *  - Google Search Console site-verification meta tag (backup to the static
 *    /google1e586fe8a6a37882.html file).
 *  - GSC FIX: sitewide Organization + WebSite JSON-LD so every page exposes
 *    valid structured data (enables sitelinks search box + brand knowledge
 *    panel). Page-level <Seo> blocks add more specific schema on top.
 *  - Google Analytics (gtag.js) loaded as early as the app mounts.
 */
const SiteHead: React.FC = () => {
  const { gaId, brandSiteUrl, supportPhoneDisplay, facebookUrl, instagramUrl } = config;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kamyaabi',
    url: brandSiteUrl,
    logo: `${brandSiteUrl}/pwa-512x512.png`,
    sameAs: [facebookUrl, instagramUrl].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: supportPhoneDisplay,
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kamyaabi',
    url: brandSiteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${brandSiteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      {/* GSC FIX: sitewide structured data (schema.org Organization + WebSite). */}
      <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(webSiteJsonLd)}</script>
      {gaId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      )}
      {gaId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}</script>
      )}
    </Helmet>
  );
};

export default SiteHead;
