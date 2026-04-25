/**
 * Central, type-safe access point for every Vite environment variable.
 *
 * Rules:
 * - Nothing in the app should read `import.meta.env` directly. Import from here instead.
 * - Each variable has an explicit type and a runtime guard. Missing "required" values
 *   are only fatal in production (`import.meta.env.PROD`) so a broken build never ships;
 *   in development they fall back to sensible defaults and log a warning.
 * - Adding a new env var? Add it to both `.env.example` and this file.
 */

import { logger } from '../utils/logger';

const DEFAULT_BRAND_DOMAIN = 'kamyaabi.shop';

interface AppConfig {
  /** Backend API base URL; blank means "same origin". */
  readonly apiBaseUrl: string;
  /** Google OAuth2 web client id used by the frontend @react-oauth/google provider. */
  readonly googleClientId: string;
  /** Public brand domain (e.g. kamyaabi.shop) — drives links in footer/email/support copy. */
  readonly brandDomain: string;
  /** Support email address rendered in the UI. */
  readonly supportEmail: string;
  /** Convenience: full https URL for the brand domain. */
  readonly brandSiteUrl: string;
  /** Convenience: true when running a production build. */
  readonly isProd: boolean;
}

function readString(key: string, fallback: string): string {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
}

function requireString(key: string, fallback: string): string {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  const msg = `Missing required env var ${key}`;
  if (import.meta.env.PROD) {
    throw new Error(msg);
  }
  logger.warn(`${msg} — using development fallback`, { fallback });
  return fallback;
}

const brandDomain = readString('VITE_BRAND_DOMAIN', DEFAULT_BRAND_DOMAIN);
const supportEmail = readString('VITE_SUPPORT_EMAIL', `support@${brandDomain}`);

export const config: AppConfig = Object.freeze({
  apiBaseUrl: readString('VITE_API_BASE_URL', ''),
  googleClientId: requireString('VITE_GOOGLE_CLIENT_ID', 'missing-google-client-id'),
  brandDomain,
  supportEmail,
  brandSiteUrl: `https://${brandDomain}`,
  isProd: Boolean(import.meta.env.PROD),
});
