# Collabify Architecture

## Overview

Collabify is a UGC & Influencer Marketplace connecting brands with content creators. Built as a production-grade monorepo.

## Design Decisions

### Backend: NestJS (over Fastify)
- **Why**: NestJS provides a structured, opinionated architecture with built-in DI, guards, interceptors, and decorator-based routing. For a complex application with RBAC, WebSockets, and multiple modules, NestJS's modular architecture scales better than Fastify's more manual approach.
- **Trade-off**: Slightly more boilerplate, but significantly better maintainability at scale.

### ORM: Prisma
- Schema-first approach with type safety
- Automatic migrations
- Excellent PostgreSQL support including array fields, JSON, enums

### Auth: JWT + Refresh Tokens
- Stateless access tokens (15m TTL) for scalability
- Refresh tokens stored in DB for revocation capability
- Optional Google OAuth and magic link support

### Payments: Stripe with Escrow-like Flow
- `capture_method: 'manual'` creates an authorization hold
- Funds captured after deliverables approved
- Platform commission deducted, remainder paid to creator
- Internal ledger for full audit trail

### Chat: WebSocket (Socket.IO) + REST
- Socket.IO for real-time messaging with automatic reconnection
- REST endpoints as fallback
- Unique constraint `(brandId, creatorId, campaignId)` prevents duplicate conversations
- Read receipts and conversation assignments for team collaboration

### Search: PostgreSQL Full-Text + Trigram
- `ILIKE` with `contains` for MVP
- Indexed fields: categories, totalFollowers, startingPrice, location
- Interface designed for future Elasticsearch/Meilisearch migration

## Module Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐      │
│  │   Auth    │ │  Search  │ │Campaigns │ │   Messages   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐      │
│  │Contracts │ │Deliverbl │ │ Payments │ │  Admin Panel  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼───────────────────────────────────────┐
│                      API (NestJS)                              │
│                                                                │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │  Auth   │  │  Users   │  │  Brands   │  │  Creators    │   │
│  │ Module  │  │  Module  │  │  Module   │  │  Module      │   │
│  └─────────┘  └──────────┘  └───────────┘  └──────────────┘   │
│                                                                │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │Campaign │  │Proposals │  │ Contracts │  │    Chat      │   │
│  │ Module  │  │  Module  │  │  Module   │  │  + Gateway   │   │
│  └─────────┘  └──────────┘  └───────────┘  └──────────────┘   │
│                                                                │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │Deliver- │  │ Payments │  │  Subscr   │  │   Admin      │   │
│  │ ables   │  │ + Ledger │  │  ptions   │  │   Panel      │   │
│  └─────────┘  └──────────┘  └───────────┘  └──────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Common: Guards, Interceptors, Pipes          │  │
│  │  JwtAuthGuard | RolesGuard | SubscriptionGuard           │  │
│  │  AuditInterceptor | ZodValidationPipe                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    DATA LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │PostgreSQL│  │  Redis   │  │  S3/R2   │  │   Stripe     │   │
│  │  (Prisma)│  │ (Cache/Q)│  │ (Files)  │  │  (Payments)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Core Flows

### Campaign → Proposal → Contract → Deliverables → Payment

```
Brand creates Campaign (DRAFT → LIVE)
    │
    ▼
Creator applies (Application: PENDING)
    │
    ▼
Brand reviews → Shortlists (SHORTLISTED)
    │
    ▼
Brand sends Offer (OFFERED)
    │
    ├──→ Creator Accepts → Contract created (ACTIVE)
    │       │
    │       ▼
    │    Brand authorizes payment (Stripe hold)
    │       │
    │       ▼
    │    Creator submits deliverables (DELIVERING → IN_REVIEW)
    │       │
    │       ├──→ Brand approves → APPROVED
    │       │       │
    │       │       ▼
    │       │    All approved? → Contract COMPLETED
    │       │       │
    │       │       ▼
    │       │    Stripe captures payment
    │       │       │
    │       │       ▼
    │       │    Ledger: Commission + Creator Payout
    │       │
    │       └──→ Brand requests changes → CHANGES_REQUESTED
    │               │
    │               ▼
    │            Creator resubmits (loop)
    │
    ├──→ Creator Rejects (REJECTED)
    │
    └──→ Creator Counter-offers (COUNTER_OFFERED)
            │
            ▼
         Brand sends new Offer (loop)
```

### Chat Deduplication

```
Conversation uniqueness: (brandId, creatorId, campaignId)
- Enforced at DB level with @@unique constraint
- Service layer uses getOrCreateConversation pattern
- All brand team members share same conversation
- Read receipts per-user, not per-brand
```

## Security

- **Auth**: JWT (15m) + Refresh tokens (7d) with rotation
- **RBAC**: RolesGuard checks user.role against @Roles() decorator
- **Feature Gating**: SubscriptionGuard checks brand plan features
- **Rate Limiting**: @nestjs/throttler (100 req/min default, 5/min for auth)
- **Input Validation**: Zod schemas shared between frontend/backend
- **Audit**: AuditInterceptor logs all mutating operations
- **CORS**: Strict origin whitelist
- **Helmet**: Standard security headers

## State Machines

All entity transitions are validated against predefined state machines:
- `APPLICATION_STATE_MACHINE`: PENDING → SHORTLISTED → OFFERED → ACCEPTED
- `CONTRACT_STATE_MACHINE`: ACTIVE → DELIVERING → IN_REVIEW → COMPLETED
- `CAMPAIGN_STATE_MACHINE`: DRAFT → LIVE → PAUSED → CLOSED

Invalid transitions throw `BadRequestException`.

## Paywall

Feature gating is enforced at the API level via `SubscriptionGuard`:
- Free brands: can explore, create campaigns (limited), but cannot message, view proposals, or contract
- Pro brands: full access
- The guard returns a JSON error with `code: 'PAYWALL'` that the frontend uses to show upgrade prompts
