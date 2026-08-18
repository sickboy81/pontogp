# Stage 1: build Next.js app from next-app/
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase.cerejavip.com
ARG NEXT_PUBLIC_APP_URL=https://cerejavip.com
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACL4t9bYfAhgsV5R

ENV NEXT_PUBLIC_POCKETBASE_URL=$NEXT_PUBLIC_POCKETBASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

COPY next-app/package*.json ./
# Sentry 10 declara suporte a Next 16 estável, enquanto este projeto ainda usa
# o preview 16.3.0; manter a mesma resolução usada no lockfile local.
RUN npm ci --legacy-peer-deps
COPY next-app/ ./
RUN npm run build

# Stage 2: runtime with cron (auto bump/reset) + Next.js server
FROM node:20-alpine

RUN apk add --no-cache dcron
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Runtime app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/pocketbase ./node_modules/pocketbase

# Legacy operational scripts kept for cron compatibility
COPY auto_bump.cjs ./auto_bump.cjs
COPY auto_bump_eligibility.cjs ./auto_bump_eligibility.cjs
COPY scripts/reset-daily-bumps.mjs ./scripts/reset-daily-bumps.mjs

# Refresh cron env on each container start
RUN printf '%s\n' \
  '#!/bin/sh' \
  'printenv | grep -E "^(VITE_|NEXT_PUBLIC_|POCKETBASE_|PB_ADMIN_|DIRECTUS_|ADMIN_|PIXGO_|TURNSTILE_)" > /etc/environment.sh || true' \
  > /usr/local/bin/export-cron-env.sh \
  && chmod +x /usr/local/bin/export-cron-env.sh

# Cron jobs (daily reset + 5-min auto bump)
RUN /usr/local/bin/export-cron-env.sh && \
    echo "0 0 * * * . /etc/environment.sh && cd /app && node /app/scripts/reset-daily-bumps.mjs >> /var/log/cron.log 2>&1" > /etc/crontabs/root && \
    echo "*/5 * * * * . /etc/environment.sh && cd /app && node /app/auto_bump.cjs >> /var/log/auto_bump.log 2>&1" >> /etc/crontabs/root

EXPOSE 3000

CMD ["sh", "-c", "/usr/local/bin/export-cron-env.sh && crond && node server.js"]
