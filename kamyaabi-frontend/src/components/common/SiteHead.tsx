import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

const GOOGLE_SITE_VERIFICATION = '1e586fe8a6a37882';

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
      <link rel="alternate" hrefLang="en-IN" href={brandSiteUrl} />
      <link rel="alternate" hrefLang="x-default" href={brandSiteUrl} />
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
