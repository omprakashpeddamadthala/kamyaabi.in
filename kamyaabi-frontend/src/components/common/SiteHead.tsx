import React from 'react';
import { Helmet } from 'react-helmet-async';
import { config } from '../../config';

/**
 * Global, site-wide <head> tags rendered on every page:
 *  - Google Analytics (gtag.js) loaded as early as the app mounts.
 */
const SiteHead: React.FC = () => {
  const { gaId } = config;

  return (
    <Helmet>
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
