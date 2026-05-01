
type LogContext = Record<string, unknown> | undefined;

const isProd = Boolean(import.meta.env.PROD);

function format(level: string, message: string, ctx?: LogContext): unknown[] {
  const stamp = new Date().toISOString();
  return ctx ? [`[${stamp}] [${level}] ${message}`, ctx] : [`[${stamp}] [${level}] ${message}`];
}

export const logger = {
  debug(message: string, ctx?: LogContext): void {
    if (isProd) return;
    console.debug(...format('DEBUG', message, ctx));
  },
  info(message: string, ctx?: LogContext): void {
    if (isProd) return;
    console.info(...format('INFO', message, ctx));
  },
  warn(message: string, ctx?: LogContext): void {
    console.warn(...format('WARN', message, ctx));
  },
  error(message: string, ctx?: LogContext): void {
    console.error(...format('ERROR', message, ctx));
  },
};
