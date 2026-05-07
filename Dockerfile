# ---------- deps ----------
FROM node:20-alpine AS deps
# Install openssl for Prisma compatibility (Required for Alpine)
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- build ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass Railway variables into the build process to satisfy your env.ts validation
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

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone output optimizes the image size significantly
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

# Deploy migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]