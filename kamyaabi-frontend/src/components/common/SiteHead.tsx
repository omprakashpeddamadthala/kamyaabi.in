import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

const GOOGLE_SITE_VERIFICATION = '1e586fe8a6a37882';

/**
 * Global, site-wide <head> tags rendered on every page:
 *  - Google Search Console site-verification meta tag (backup to the static
 *    /google1e586fe8a6a37882.html file).
 *  - GSC FIX: sitewide Organization + WebSite + LocalBusiness JSON-LD so every
 *    page exposes valid structured data (enables sitelinks search box + brand
 *    knowledge panel + local pack eligibility).
 *  - hreflang="en-IN" global alternate tag (geographic/language targeting).
 *  - Google Analytics (gtag.js) loaded as early as the app mounts.
 */
const SiteHead: React.FC = () => {
  const { gaId, brandSiteUrl, supportPhoneDisplay, supportEmail, facebookUrl, instagramUrl } = config;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kamyaabi',
    url: brandSiteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${brandSiteUrl}/pwa-512x512.png`,
      width: 512,
      height: 512,
    },
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

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Kamyaabi - Premium Dry Fruits',
    url: brandSiteUrl,
    logo: `${brandSiteUrl}/pwa-512x512.png`,
    image: `${brandSiteUrl}/pwa-512x512.png`,
    description:
      'Shop premium, hand-picked dry fruits and nuts — almonds, cashews, pistachios, raisins and more. Sourced for purity, sealed for freshness, delivered across India.',
    telephone: supportPhoneDisplay,
    email: supportEmail,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Visakhapatnam',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    areaServed: 'IN',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Credit Card, Debit Card, UPI, Net Banking',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [facebookUrl, instagramUrl].filter(Boolean),
  };

  return (
    <Helmet>
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      {/* GSC FIX: hreflang global alternate for India/English targeting. */}
      <link rel="alternate" hrefLang="en-IN" href={brandSiteUrl} />
      <link rel="alternate" hrefLang="x-default" href={brandSiteUrl} />
      {/* GSC FIX: sitewide structured data (schema.org Organization + WebSite + LocalBusiness). */}
      <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(webSiteJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(localBusinessJsonLd)}</script>
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
