/**
 * Environment validation.
 * 
 * This version uses a Lazy-loading Proxy to prevent "Cannot read properties of undefined" 
 * errors during the Next.js build phase.
 */

type EnvSchema = {
  // Core
  DATABASE_URL: string;
  SESSION_SECRET: string;
  APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';

  // Storage
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

  // Optional Third Party
  META_WHATSAPP_TOKEN?: string;
  META_WHATSAPP_PHONE_NUMBER_ID?: string;
  META_WHATSAPP_VERIFY_TOKEN?: string;
  GOOGLE_PLACES_API_KEY?: string;
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
  // Safe process detection
  const envSource = typeof process !== 'undefined' ? process.env : {};
  
  const NODE_ENV = (envSource.NODE_ENV ?? 'development') as EnvSchema['NODE_ENV'];
  
  // Phase detection: check if we are building or explicitly skipping
  const isBuildPhase = 
    envSource.NEXT_PHASE === 'phase-production-build' || 
    envSource.SKIP_ENV_VALIDATION === 'true' ||
    envSource.CI === 'true';

  const STORAGE_DRIVER = (envSource.STORAGE_DRIVER ?? 'local') as EnvSchema['STORAGE_DRIVER'];

  // --- BUILD PHASE (Return Placeholders) ---
  if (isBuildPhase) {
    return {
      DATABASE_URL: envSource.DATABASE_URL || 'postgresql://placeholder:5432/db',
      SESSION_SECRET: envSource.SESSION_SECRET || 'placeholder_secret_at_least_32_chars_long',
      APP_URL: envSource.APP_URL || 'http://localhost:3000',
      NODE_ENV,
      STORAGE_DRIVER,
      STORAGE_LOCAL_DIR: envSource.STORAGE_LOCAL_DIR || './uploads',
      CRON_SECRET: envSource.CRON_SECRET || 'placeholder_cron_16_chars',
    } as EnvSchema;
  }

  // --- RUNTIME PHASE (Strict Validation) ---
  const validatedEnv: EnvSchema = {
    DATABASE_URL: required('DATABASE_URL', envSource.DATABASE_URL),
    SESSION_SECRET: required('SESSION_SECRET', envSource.SESSION_SECRET, 32),
    APP_URL: required('APP_URL', envSource.APP_URL),
    NODE_ENV,
    STORAGE_DRIVER,
    STORAGE_LOCAL_DIR: optional(envSource.STORAGE_LOCAL_DIR) ?? './uploads',
    STORAGE_S3_ENDPOINT: optional(envSource.STORAGE_S3_ENDPOINT),
    STORAGE_S3_REGION: optional(envSource.STORAGE_S3_REGION) ?? 'auto',
    STORAGE_S3_BUCKET: optional(envSource.STORAGE_S3_BUCKET),
    STORAGE_S3_ACCESS_KEY_ID: optional(envSource.STORAGE_S3_ACCESS_KEY_ID),
    STORAGE_S3_SECRET_ACCESS_KEY: optional(envSource.STORAGE_S3_SECRET_ACCESS_KEY),
    STORAGE_S3_PUBLIC_URL_BASE: optional(envSource.STORAGE_S3_PUBLIC_URL_BASE),
    CRON_SECRET: required('CRON_SECRET', envSource.CRON_SECRET, 16),
    META_WHATSAPP_TOKEN: optional(envSource.META_WHATSAPP_TOKEN),
    META_WHATSAPP_PHONE_NUMBER_ID: optional(envSource.META_WHATSAPP_PHONE_NUMBER_ID),
    META_WHATSAPP_VERIFY_TOKEN: optional(envSource.META_WHATSAPP_VERIFY_TOKEN),
    GOOGLE_PLACES_API_KEY: optional(envSource.GOOGLE_PLACES_API_KEY),
    SIGNUP_INVITE_CODE: optional(envSource.SIGNUP_INVITE_CODE),
  };

  // Cross-field validation for S3
  if (validatedEnv.STORAGE_DRIVER === 's3') {
    const missing = [
      'STORAGE_S3_ENDPOINT',
      'STORAGE_S3_BUCKET',
      'STORAGE_S3_ACCESS_KEY_ID',
      'STORAGE_S3_SECRET_ACCESS_KEY',
    ].filter((k) => !validatedEnv[k as keyof EnvSchema]);
    if (missing.length > 0) {
      throw new Error(`STORAGE_DRIVER=s3 requires: ${missing.join(', ')}`);
    }
  }

  return validatedEnv;
}

/**
 * LAZY EXPORT
 * 
 * We use a Proxy to ensure 'loadEnv' is only called when a property is accessed.
 * This prevents circular dependencies and 'undefined' crashes during Next.js initialization.
 */
let cachedEnv: EnvSchema | undefined;

export const env = new Proxy({} as EnvSchema, {
  get(_, prop) {
    if (!cachedEnv) {
      cachedEnv = loadEnv();
    }
    return cachedEnv[prop as keyof EnvSchema];
  },
});