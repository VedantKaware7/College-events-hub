# Build stage: production dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Runtime: Alpine + node binary only (no npm)
FROM alpine:3.23
ENV NODE_ENV=production

RUN apk upgrade --no-cache \
    && apk add --no-cache libstdc++ \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /sbin/nologin -D node
COPY --from=deps /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
# Root-owned files: the app user can't modify them
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    PORT=5000

EXPOSE 5000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["node", "server.js"]
