// Centralised brand/domain configuration.
//
// Everything that renders the public domain (footer, contact page, email
// links, etc.) should read from this module so the domain can be switched
// with a single env-var change at build time.
//
// Build-time env vars (see `.env.example` and docker-compose build args):
//   VITE_BRAND_DOMAIN   -- the public domain, e.g. "kamyaabi.shop"
//   VITE_SUPPORT_EMAIL  -- the support inbox, e.g. "support@kamyaabi.shop"
//
// Defaults stay in sync with `.env.example`.

const DEFAULT_DOMAIN = 'kamyaabi.shop';

export const BRAND_DOMAIN: string =
  import.meta.env.VITE_BRAND_DOMAIN?.trim() || DEFAULT_DOMAIN;

export const SUPPORT_EMAIL: string =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() || `support@${BRAND_DOMAIN}`;

export const BRAND_SITE_URL: string = `https://${BRAND_DOMAIN}`;
