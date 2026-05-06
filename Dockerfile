# ---------- deps ----------
FROM node:20-alpine AS deps
# Install openssl for Prisma compatibility
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- build ----------
FROM node:20-alpine AS builder
# Install openssl for Prisma compatibility
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- CRITICAL: Build-time variables ---
# These ARG lines allow Docker to see your Railway variables during 'next build'
ARG DATABASE_URL
ARG APP_URL
ARG SESSION_SECRET
ARG CRON_SECRET
ARG SKIP_ENV_VALIDATION=true
ARG PRISMA_CLI_BINARY_TARGETS='["native", "debian-openssl-3.0.x"]'

# Set them as ENV so the 'npm run build' process can find them
ENV DATABASE_URL=$DATABASE_URL
ENV APP_URL=$APP_URL
ENV SESSION_SECRET=$SESSION_SECRET
ENV CRON_SECRET=$CRON_SECRET
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION
ENV PRISMA_CLI_BINARY_TARGETS=$PRISMA_CLI_BINARY_TARGETS

RUN npx prisma generate
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runner
# Install openssl at runtime for Prisma engine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

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