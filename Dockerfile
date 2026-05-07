# ---------- 1. DEPS STAGE ----------
# We separate this to cache your node_modules
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- 2. BUILD STAGE ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# A. Bring in deps from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# B. Copy source code (This includes the 'public' folder)
COPY . .

# C. Set up Environment Variables BEFORE building
# These must be defined before 'npm run build' runs
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

# D. Generate Prisma and Build
RUN npx prisma generate
RUN npm run build

# ---------- 3. RUNNER STAGE ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy over the necessary build artifacts
# Note: Next.js standalone mode puts the 'public' and 'static' files 
# in specific places for the node server to find them.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Ensure Prisma engines are available for the migrations in the CMD
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Deploy migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]