/**
 * @deprecated Import from `@/config` (`src/config/index.ts`) instead.
 * Retained as a shim so existing callers (Footer, ContactPage) keep working
 * without churn; will be removed in a later pass.
 */

import { config } from './index';

export const BRAND_DOMAIN: string = config.brandDomain;
export const SUPPORT_EMAIL: string = config.supportEmail;
export const BRAND_SITE_URL: string = config.brandSiteUrl;
