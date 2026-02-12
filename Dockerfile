FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install

# Build shared package first
RUN pnpm --filter @collabify/shared run build

# Build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy; node dist/src/main"]
