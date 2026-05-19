FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm install tsx prisma && npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 4000

# No external entrypoint script — works reliably when copied from Windows
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (npx tsx prisma/seed.ts || true) && exec node dist/index.js"]
