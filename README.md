# Filmtech OS

Sistema SaaS de Ordem de Serviço para Estéticas Automotivas.

## Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: tRPC + Prisma
- **Database**: PostgreSQL
- **Auth**: Clerk
- **Styling**: Tailwind CSS

## Setup

```bash
# Install
pnpm install

# Database (Docker)
docker-compose up -d

# Push schema
cd packages/database && pnpm db:push && cd ../..

# Run
pnpm dev
```

## Structure

```
├── apps/web/          # Next.js app
├── packages/database/ # Prisma schema
└── docker-compose.yml
```