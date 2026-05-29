import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

const GOOGLE_SITE_VERIFICATION = '1e586fe8a6a37882';

/**
 * Global, site-wide <head> tags rendered on every page:
 *  - Google Search Console site-verification meta tag (backup to the static
 *    /google1e586fe8a6a37882.html file).
 *  - Google Analytics (gtag.js) loaded as early as the app mounts.
 */
const SiteHead: React.FC = () => {
  const { gaId } = config;

  return (
    <Helmet>
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
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
