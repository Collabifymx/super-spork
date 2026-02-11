FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client and build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @collabify/api build

# Production
FROM node:20-slim
WORKDIR /app
COPY --from=base /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main"]
