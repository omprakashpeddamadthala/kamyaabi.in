import { logger } from '../utils/logger';

const DEFAULT_BRAND_DOMAIN = 'kamyaabi.in';
const DEFAULT_SUPPORT_EMAIL = 'sm.enterprises0121@gmail.com';
const DEFAULT_SUPPORT_PHONE = '9848999072';

const DEFAULT_DEV_ADMIN_EMAIL = 'omprakashornold@gmail.com';
const DEFAULT_DEV_USER_EMAIL = 'dev.user@kamyaabi.local';

export interface DevLoginConfig {
  readonly enabled: boolean;
  readonly adminEmail: string;
  readonly userEmail: string;
}

interface AppConfig {
  readonly apiBaseUrl: string;
  readonly googleClientId: string;
  readonly brandDomain: string;
  readonly supportEmail: string;
  readonly supportPhone: string;
  readonly supportPhoneDisplay: string;
  readonly supportPhoneTel: string;
  readonly whatsappUrl: string;
  readonly brandSiteUrl: string;
  readonly isProd: boolean;
  readonly devLogin: DevLoginConfig;
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

const supportPhone = supportPhoneRaw.replace(/\D+/g, '');
const supportPhoneDisplay = supportPhone.length === 10
  ? `+91 ${supportPhone.slice(0, 5)} ${supportPhone.slice(5)}`
  : supportPhoneRaw;
const supportPhoneE164 = supportPhone.length === 10 ? `+91${supportPhone}` : `+${supportPhone}`;
const whatsappDigits = supportPhone.length === 10 ? `91${supportPhone}` : supportPhone;

const isProdBuild = Boolean(import.meta.env.PROD);

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const devLogin: DevLoginConfig = Object.freeze({
  enabled: !isProdBuild && isLocalHost,
  adminEmail: readString('VITE_DEV_ADMIN_EMAIL', DEFAULT_DEV_ADMIN_EMAIL),
  userEmail: readString('VITE_DEV_USER_EMAIL', DEFAULT_DEV_USER_EMAIL),
});

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
  isProd: isProdBuild,
  devLogin,
});
