FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install

# Generate Prisma client and build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx nest build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
