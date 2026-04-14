# ---------- Base ----------
  FROM node:20-alpine AS base

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
  FROM node:20-alpine AS production

  WORKDIR /app

  RUN npm install -g pnpm

  ENV NODE_ENV=production

  COPY package.json pnpm-lock.yaml ./

  RUN pnpm install --prod --frozen-lockfile

  COPY --from=builder /app/dist ./dist

  # Seguridad
  RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

  USER nestjs

  EXPOSE 3145

  CMD ["node", "dist/src/main.js"]
