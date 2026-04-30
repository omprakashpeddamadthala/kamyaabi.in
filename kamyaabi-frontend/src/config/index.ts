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

const DEFAULT_BRAND_DOMAIN = 'kamyaabi.in';
const DEFAULT_SUPPORT_EMAIL = 'sm.enterprises0121@gmail.com';
const DEFAULT_SUPPORT_PHONE = '9848999072';

interface AppConfig {
  /** Backend API base URL; blank means "same origin". */
  readonly apiBaseUrl: string;
  /** Google OAuth2 web client id used by the frontend @react-oauth/google provider. */
  readonly googleClientId: string;
  /** Public brand domain (e.g. kamyaabi.in) — drives links in footer/email/support copy. */
  readonly brandDomain: string;
  /** Support email address rendered in the UI. */
  readonly supportEmail: string;
  /** Support / WhatsApp phone number rendered in the UI (digits only). */
  readonly supportPhone: string;
  /** Pretty-formatted support phone (e.g. "+91 98489 99072"). */
  readonly supportPhoneDisplay: string;
  /** `tel:` href for the support phone. */
  readonly supportPhoneTel: string;
  /** `https://wa.me/...` link for WhatsApp. */
  readonly whatsappUrl: string;
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
const supportEmail = readString('VITE_SUPPORT_EMAIL', DEFAULT_SUPPORT_EMAIL);
const supportPhoneRaw = readString('VITE_SUPPORT_PHONE', DEFAULT_SUPPORT_PHONE);

// Normalize to digits only so tel:/wa.me links stay well-formed regardless of
// how the env var is entered (with or without country code, spaces, dashes).
const supportPhone = supportPhoneRaw.replace(/\D+/g, '');
// Presentation string: "+91 XXXXX XXXXX" when it's a 10-digit Indian number;
// otherwise fall back to the raw value so non-IN numbers are unaffected.
const supportPhoneDisplay = supportPhone.length === 10
  ? `+91 ${supportPhone.slice(0, 5)} ${supportPhone.slice(5)}`
  : supportPhoneRaw;
const supportPhoneE164 = supportPhone.length === 10 ? `+91${supportPhone}` : `+${supportPhone}`;
const whatsappDigits = supportPhone.length === 10 ? `91${supportPhone}` : supportPhone;

export const config: AppConfig = Object.freeze({
  apiBaseUrl: readString('VITE_API_BASE_URL', ''),
  googleClientId: requireString('VITE_GOOGLE_CLIENT_ID', 'missing-google-client-id'),
  brandDomain,
  supportEmail,
  supportPhone,
  supportPhoneDisplay,
  supportPhoneTel: `tel:${supportPhoneE164}`,
  whatsappUrl: `https://wa.me/${whatsappDigits}`,
  brandSiteUrl: `https://${brandDomain}`,
  isProd: Boolean(import.meta.env.PROD),
});
