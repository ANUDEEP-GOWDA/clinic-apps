-- Store image bytes directly in Postgres so no S3/disk needed
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "bytes" BYTEA;
ALTER TABLE "Media" ALTER COLUMN "storageKey" SET DEFAULT '';
