FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY apps/api/. .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY apps/api/package*.json ./
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || echo 'Seed skipped') && node dist/server.js"]
