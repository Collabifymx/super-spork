FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install dependencies (no lockfile in repo)
RUN pnpm install

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client and build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @collabify/api build

# Production
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
