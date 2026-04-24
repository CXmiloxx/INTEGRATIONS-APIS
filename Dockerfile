# ---------- Base ----------
FROM node:20-slim AS base

WORKDIR /app

RUN npm install -g pnpm

# ---------- Dependencies ----------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ---------- Production ----------
FROM node:20-slim AS production

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

RUN pnpm exec playwright install --with-deps


COPY --from=builder /app/dist ./dist


EXPOSE 3145

CMD ["node", "dist/main.js"]
