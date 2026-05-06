/**
 * Environment validation. Validated once at module load — the app refuses to
 * start if anything required is missing or malformed.
 *
 * This is the #1 source of "works on my machine, broken in prod" bugs.
 * Centralizing it here means every callsite imports a typed object instead
 * of reading process.env directly.
 *
 * To add a new env var:
 *   1. Add it to the `schema` below with a sensible validator
 *   2. Add it to .env.example
 *   3. Document it in README.md
 */

type EnvSchema = {
  // Core
  DATABASE_URL: string;
  SESSION_SECRET: string;
  APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';

  // Storage (R2 / S3 / any S3-compatible)
  STORAGE_DRIVER: 'local' | 's3';
  STORAGE_LOCAL_DIR?: string;
  STORAGE_S3_ENDPOINT?: string;
  STORAGE_S3_REGION?: string;
  STORAGE_S3_BUCKET?: string;
  STORAGE_S3_ACCESS_KEY_ID?: string;
  STORAGE_S3_SECRET_ACCESS_KEY?: string;
  STORAGE_S3_PUBLIC_URL_BASE?: string;

  // Cron
  CRON_SECRET: string;

  // WhatsApp (optional)
  META_WHATSAPP_TOKEN?: string;
  META_WHATSAPP_PHONE_NUMBER_ID?: string;
  META_WHATSAPP_VERIFY_TOKEN?: string;

  // Google reviews (optional)
  GOOGLE_PLACES_API_KEY?: string;

  // Signup gating (optional). If set, signup requires this code as
  // a query/header. Useful for closed beta.
  SIGNUP_INVITE_CODE?: string;
};

function required(name: string, value: string | undefined, minLen = 1): string {
  if (!value || value.length < minLen) {
    throw new Error(
      `Environment variable ${name} is required` +
        (minLen > 1 ? ` (min length ${minLen})` : '') +
        `. See .env.example.`
    );
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function loadEnv(): EnvSchema {
  // 1. Bulletproof NODE_ENV detection
  const rawNodeEnv = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
  const NODE_ENV = (rawNodeEnv ?? 'development') as EnvSchema['NODE_ENV'];
  
  const isBuildPhase = 
    process.env.NEXT_PHASE === 'phase-production-build' || 
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    process.env.CI === 'true';

  const STORAGE_DRIVER = (process.env.STORAGE_DRIVER ?? 'local') as EnvSchema['STORAGE_DRIVER'];

  // 2. Optimized Build Phase Return
  if (isBuildPhase) {
    return {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://placeholder:5432/db',
      SESSION_SECRET: process.env.SESSION_SECRET || 'placeholder_secret_at_least_32_chars_long',
      APP_URL: process.env.APP_URL || 'http://localhost:3000',
      NODE_ENV: NODE_ENV, // Use the safe variable we created above
      STORAGE_DRIVER,
      STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR || './uploads',
      CRON_SECRET: process.env.CRON_SECRET || 'placeholder_cron_16_chars',
      // Ensure these optional ones are at least undefined so they exist in the object
      META_WHATSAPP_TOKEN: undefined,
      META_WHATSAPP_PHONE_NUMBER_ID: undefined,
      META_WHATSAPP_VERIFY_TOKEN: undefined,
      GOOGLE_PLACES_API_KEY: undefined,
      SIGNUP_INVITE_CODE: undefined,
    } as EnvSchema;
  }

  // 3. Runtime Logic (Unchanged but safe)
  const env: EnvSchema = {
    DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL),
    SESSION_SECRET: required('SESSION_SECRET', process.env.SESSION_SECRET, 32),
    APP_URL: required('APP_URL', process.env.APP_URL),
    NODE_ENV,
    STORAGE_DRIVER,
    STORAGE_LOCAL_DIR: optional(process.env.STORAGE_LOCAL_DIR) ?? './uploads',
    CRON_SECRET: required('CRON_SECRET', process.env.CRON_SECRET, 16),
    META_WHATSAPP_TOKEN: optional(process.env.META_WHATSAPP_TOKEN),
    META_WHATSAPP_PHONE_NUMBER_ID: optional(process.env.META_WHATSAPP_PHONE_NUMBER_ID),
    META_WHATSAPP_VERIFY_TOKEN: optional(process.env.META_WHATSAPP_VERIFY_TOKEN),
    GOOGLE_PLACES_API_KEY: optional(process.env.GOOGLE_PLACES_API_KEY),
    SIGNUP_INVITE_CODE: optional(process.env.SIGNUP_INVITE_CODE),
  };

  return env;
}