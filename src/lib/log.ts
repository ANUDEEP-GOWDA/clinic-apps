/**
 * Tiny structured logger. Defaults to JSON-to-stdout, which Railway/Vercel/
 * any cloud platform happily ingests. When you want Sentry/Axiom/Datadog,
 * change the implementation here. Callsites stay the same.
 *
 * Don't `console.log` from app code — use this. The cost of doing it right
 * from day one is zero; the cost of retrofitting at 30k tenants is large.
 */
import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogFields = Record<string, unknown>;

function emit(level: LogLevel, msg: string, fields?: LogFields) {
  if (level === 'debug' && env.NODE_ENV === 'production') return;
  const line = {
    t: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  // One line of JSON per log. Railway/Vercel parse this natively.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit('debug', msg, fields),
  info: (msg: string, fields?: LogFields) => emit('info', msg, fields),
  warn: (msg: string, fields?: LogFields) => emit('warn', msg, fields),
  error: (msg: string, fields?: LogFields) => emit('error', msg, fields),
};
