FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API using pnpm from root
RUN pnpm --filter @collabify/api run build

# Verify dist exists
RUN ls -la apps/api/dist/

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy; node dist/main"]
