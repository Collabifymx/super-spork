# 🚀 Collabify

**UGC & Influencer Marketplace** — Connect brands with content creators. Campaign management, proposals, real-time chat, deliverable tracking, escrow payments, and admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **Backend** | NestJS + TypeScript + Prisma |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 |
| **Realtime** | Socket.IO (WebSockets) |
| **Payments** | Stripe (hold/capture escrow flow) |
| **Storage** | S3-compatible (MinIO local / R2 prod) |
| **Auth** | JWT + Refresh Tokens |
| **Validation** | Zod (shared schemas) |
| **CI** | GitHub Actions |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 1. Start infrastructure
```bash
docker compose up -d
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Run migrations and seed
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Start dev servers
```bash
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Swagger**: http://localhost:4000/api/docs
- **MinIO**: http://localhost:9001 (minioadmin/minioadmin)

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@collabify.com | Password123 |
| Brand (Pro) | brand@example.com | Password123 |
| Brand (Free) | brand2@example.com | Password123 |
| Creator | susan@example.com | Password123 |
| Creator | tamara@example.com | Password123 |
| Creator | jay@example.com | Password123 |

## Project Structure

```
collabify/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   └── src/
│   │       ├── app/         # App Router pages
│   │       ├── components/  # React components
│   │       ├── lib/         # Utilities, API client, stores
│   │       └── styles/      # Global CSS
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── modules/     # Feature modules
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── brands/
│       │   │   ├── creators/
│       │   │   ├── campaigns/
│       │   │   ├── proposals/
│       │   │   ├── contracts/
│       │   │   ├── chat/
│       │   │   ├── deliverables/
│       │   │   ├── payments/
│       │   │   ├── subscriptions/
│       │   │   ├── admin/
│       │   │   ├── search/
│       │   │   ├── notifications/
│       │   │   └── upload/
│       │   ├── common/      # Guards, decorators, interceptors
│       │   └── prisma/      # Database service
│       ├── prisma/          # Schema + migrations + seed
│       └── test/            # Unit + E2E tests
├── packages/
│   └── shared/              # Zod schemas, types, constants, utils
├── docs/
│   └── architecture.md      # Architecture documentation
├── docker-compose.yml       # Local infrastructure
├── turbo.json              # Turborepo config
└── pnpm-workspace.yaml     # Workspace config
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/logout | Logout |

### Creators
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/creators/:slug | Get creator profile |
| PATCH | /api/creators/me | Update own profile |
| POST | /api/creators/me/social-accounts | Add social account |
| POST | /api/creators/me/portfolio | Add portfolio item |
| POST | /api/creators/me/rates | Add rate |

### Search
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/search/creators | Search creators with filters |

### Campaigns
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns | List live campaigns |
| GET | /api/campaigns/:id | Get campaign |
| PATCH | /api/campaigns/:id | Update campaign |
| PATCH | /api/campaigns/:id/status | Update status |

### Applications
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/applications | Apply to campaign (creator) |
| GET | /api/applications/campaign/:id | Get applications (brand) |
| GET | /api/applications/me | My applications (creator) |
| POST | /api/applications/:id/offer | Send offer (brand) |
| POST | /api/applications/offers/:id/respond | Accept/reject offer |
| POST | /api/applications/offers/:id/counter | Counter-offer |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat/conversations | Create/get conversation |
| GET | /api/chat/inbox | Get inbox |
| GET | /api/chat/conversations/:id/messages | Get messages |
| POST | /api/chat/conversations/:id/messages | Send message |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/payments/intent/:contractId | Create payment (escrow hold) |
| POST | /api/payments/capture/:contractId | Capture payment |
| POST | /api/payments/release/:contractId | Release to creator |
| GET | /api/payments/ledger/:contractId | Get ledger |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/verifications | Pending verifications |
| POST | /api/admin/verify | Verify/reject creator |
| GET | /api/admin/audit-logs | Audit logs |

## Scripts

```bash
pnpm dev          # Start all services
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed database
pnpm db:studio    # Open Prisma Studio
pnpm db:reset     # Reset database
pnpm format       # Format code
```

## Deployment

### Frontend (Vercel)
```bash
# Framework: Next.js
# Root Directory: apps/web
# Build Command: cd ../.. && pnpm turbo run build --filter=@collabify/web
# Install Command: pnpm install
```

### Backend (Render / Fly.io / AWS)
```bash
# Build: cd apps/api && pnpm build
# Start: node dist/main.js
# Env vars: see apps/api/.env.example
```

### Database
- Use managed PostgreSQL (Supabase, Neon, RDS)
- Use managed Redis (Upstash, ElastiCache)

## License

Proprietary - All rights reserved.
