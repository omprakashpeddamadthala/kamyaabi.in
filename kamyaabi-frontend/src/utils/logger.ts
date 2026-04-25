/**
 * Small logger facade. Swap this to forward to Sentry / LogRocket / Datadog in one place.
 *
 * Rules for this codebase:
 * - Application code must NEVER call `console.*` directly; always go through this module.
 * - In production (`import.meta.env.PROD`), debug + info are silenced; warn + error still fire.
 * - The browser console is still the sink today; the indirection is what matters so we can
 *   redirect later without touching call sites.
 */

type LogContext = Record<string, unknown> | undefined;

const isProd = Boolean(import.meta.env.PROD);

function format(level: string, message: string, ctx?: LogContext): unknown[] {
  const stamp = new Date().toISOString();
  return ctx ? [`[${stamp}] [${level}] ${message}`, ctx] : [`[${stamp}] [${level}] ${message}`];
}

export const logger = {
  debug(message: string, ctx?: LogContext): void {
    if (isProd) return;
    // eslint-disable-next-line no-console
    console.debug(...format('DEBUG', message, ctx));
  },
  info(message: string, ctx?: LogContext): void {
    if (isProd) return;
    // eslint-disable-next-line no-console
    console.info(...format('INFO', message, ctx));
  },
  warn(message: string, ctx?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(...format('WARN', message, ctx));
  },
  error(message: string, ctx?: LogContext): void {
    // eslint-disable-next-line no-console
    console.error(...format('ERROR', message, ctx));
  },
};
