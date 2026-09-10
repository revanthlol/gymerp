# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Dependencies Stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
EXPOSE 4000

CMD ["node", "server.js"]
