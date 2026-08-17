# syntax=docker/dockerfile:1

# Build context is the repo ROOT (see docker-compose.yml) — same
# reasoning as apps/server/Dockerfile.

FROM node:20-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts

# ---- build ----
FROM base AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:shared && npm run build --workspace=apps/web

# ---- runtime ----
# next.config.ts sets output: "standalone", so the build produces a
# self-contained server with only the files it actually needs —
# no full node_modules copy required here.
FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

RUN chown -R app:app /app
USER app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
