# ---------- Base ----------
  FROM node:20-alpine AS base

  WORKDIR /app
  
  # Instalar pnpm usando corepack (mejor práctica en Node 20+)
  RUN corepack enable
  
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
  
  RUN corepack enable
  
  ENV NODE_ENV=production
  
  COPY package.json pnpm-lock.yaml ./
  
  # Instalar solo dependencias de producción
  RUN pnpm install --prod --frozen-lockfile
  
  # Copiar build
  COPY --from=builder /app/dist ./dist
  
  # Crear usuario no root (seguridad)
  RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
  
  USER nestjs
  
  EXPOSE 2241
  
  CMD ["node", "dist/src/main.js"]