# syntax=docker/dockerfile:1.7

# ---------- Base ----------
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS base

WORKDIR /app

RUN npm install -g pnpm

# ---------- Dependencies (full, for build) ----------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ---------- Prod deps only ----------
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ---------- Production runtime ----------
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS production

WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN chown -R pwuser:pwuser /app

USER pwuser

EXPOSE 3145

CMD ["node", "dist/main.js"]
