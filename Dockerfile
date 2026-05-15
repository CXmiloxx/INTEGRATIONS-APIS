# syntax=docker/dockerfile:1.7

# ────────────────────────────────────────────────────────────────
# Build stage: compile TypeScript
# ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy lockfile + package.json
COPY pnpm-lock.yaml package.json ./

# Install all deps (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source + build
COPY . .
RUN pnpm build

# ────────────────────────────────────────────────────────────────
# Production stage: minimal runtime
# ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS production

WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NODE_OPTIONS="--max-old-space-size=512"

# Install pnpm for prod install
RUN npm install -g pnpm

# Copy lockfile + package.json only
COPY pnpm-lock.yaml package.json ./

# Install prod dependencies only (no devDeps, no build tools)
RUN pnpm install --prod --frozen-lockfile && \
    rm -rf /app/.pnpm-store && \
    npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Security: non-root user + minimal permissions
RUN chown -R pwuser:pwuser /app && \
    chmod -R u=rwX,g=,o= /app

USER pwuser

EXPOSE 3145

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "require('net').createConnection(3145,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
