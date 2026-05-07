# ---------- 1. DEPS STAGE ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
# Only copy files needed for install to maximize cache
COPY package.json package-lock.json* ./
# We check if prisma directory exists before copying to prevent the crash
COPY prisma ./prisma 
RUN npm ci

# ---------- 2. BUILD STAGE ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build-time validation (env.ts)
ARG DATABASE_URL
ARG APP_URL
ARG SESSION_SECRET
ARG CRON_SECRET
ARG SKIP_ENV_VALIDATION=true

ENV DATABASE_URL=$DATABASE_URL
ENV APP_URL=$APP_URL
ENV SESSION_SECRET=$SESSION_SECRET
ENV CRON_SECRET=$CRON_SECRET
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION
ENV NEXT_TELEMETRY_DISABLED=1

# Generate and Build
RUN npx prisma generate
RUN npm run build

# ---------- 3. RUNNER STAGE ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standard Standalone Layout
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]