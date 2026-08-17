# syntax=docker/dockerfile:1

# Build context is the repo ROOT (see docker-compose.yml), not this
# directory — the server workspace depends on packages/shared, so npm
# workspaces needs the whole monorepo present to resolve it correctly.

FROM node:20-alpine AS base
WORKDIR /app

# ---- deps: install once, reused by the build stage ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts

# ---- build: compile shared + server TypeScript ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:shared && npm run build --workspace=apps/server
# Strip devDependencies from the already-resolved tree (safe: full
# monorepo + lockfile are present here, unlike in a fresh partial copy).
RUN npm prune --omit=dev

# ---- runtime: minimal image, non-root user ----
FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/prisma ./apps/server/prisma
COPY --from=build /app/apps/server/scripts ./apps/server/scripts
COPY apps/server/docker-entrypoint.sh ./apps/server/docker-entrypoint.sh

RUN chmod +x ./apps/server/docker-entrypoint.sh && chown -R app:app /app
USER app

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./apps/server/docker-entrypoint.sh"]
