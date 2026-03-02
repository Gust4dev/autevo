# 🏗️ Autevo — Arquitetura do Sistema

> **Última atualização:** Março 2026
> **Stack Version:** Next.js 15.1 / tRPC 11 / Prisma 6 / PostgreSQL 16

---

## Visão Geral

Autevo é um SaaS multi-tenant construído como um monorepo Turborepo, rodando na Vercel (edge-compatible). O design prioriza:

- **Type-safety end-to-end** via tRPC — mudanças no backend quebram o frontend em compile time, nunca em runtime
- **Isolamento de dados por tenant** em todas as queries do Prisma
- **Edge-friendly** — middleware na Vercel Edge, sem cold start crítico
- **Mobile-first PWA** — techs trabalhando offline com service worker customizado

---

## Estrutura do Monorepo

```
autevo/
├── apps/
│   └── web/                         # App Next.js (único app)
│       ├── src/
│       │   ├── app/                 # App Router (pages + layouts + route handlers)
│       │   │   ├── (public)/        # Rotas sem autenticação
│       │   │   │   ├── /            # Landing page
│       │   │   │   ├── /tracking/   # Rastreamento público de OS
│       │   │   │   ├── /booking/    # Agendamento público
│       │   │   │   └── /public/     # Aprovação de contrato sem login
│       │   │   ├── dashboard/       # Área autenticada do tenant
│       │   │   ├── admin/           # Painel SaaS (ADMIN_SAAS only)
│       │   │   ├── setup/           # Onboarding wizard
│       │   │   └── api/             # Route handlers
│       │   │       ├── trpc/        # tRPC endpoint
│       │   │       ├── webhooks/    # Clerk + Stripe webhooks
│       │   │       ├── cron/        # Scheduled jobs
│       │   │       ├── stripe/      # Stripe action routes
│       │   │       └── upload/      # File upload
│       │   ├── server/              # Backend logic (tRPC)
│       │   │   ├── trpc.ts          # Context, middlewares, procedure factory
│       │   │   └── routers/         # 20+ domain routers
│       │   ├── components/          # React components (UI + business)
│       │   ├── lib/                 # Utilitários, helpers, integrações
│       │   ├── hooks/               # React hooks customizados
│       │   └── middleware.ts        # Edge middleware (Clerk + routing)
│       └── worker/                  # Service worker customizado
│
├── packages/
│   └── database/                   # Shared database layer
│       └── prisma/
│           ├── schema.prisma        # Source of truth do schema
│           └── migrations/          # Migration SQL files
│
├── docs/                            # Esta pasta
├── turbo.json                       # Config do Turborepo
└── pnpm-workspace.yaml
```

---

## Fluxo de uma Requisição

```
Browser/PWA
    │
    ▼
[Vercel Edge Network]
    │
    ▼
[Next.js Middleware] ──────────────────────────────────────────┐
    │  clerkMiddleware()                                        │
    │  • Checa autenticação                                     │
    │  • Valida TenantStatus (TRIAL/ACTIVE/SUSPENDED...)        │
    │  • Redirects: /activate, /trial-expired, /setup           │
    │  • ToS version check para OWNERs                          │
    │                                                           │
    ▼                                                           │
[Next.js App Router]                                           │
    │                                                           │
    ├── Server Components ──────────────────────────────────────┘
    │     (data fetching direta via Prisma em RSC)
    │
    └── Client Components
          │
          ▼
        [tRPC Client] ──────► POST /api/trpc/[procedure]
                                      │
                                      ▼
                              [tRPC Route Handler]
                                      │
                              createContext()
                                      │  - user lookup via Clerk session
                                      │  - db = prisma client
                                      │
                                      ▼
                              [rateLimitMiddleware]
                                      │  50 req/min via Upstash Redis
                                      │
                                      ▼
                              [tenantMiddleware]
                                      │  - Valida tenant status (com Redis cache 30min)
                                      │  - Injeta tenantId no contexto
                                      │
                                      ▼
                              [RBAC Middleware]
                                      │  (managerProcedure / ownerProcedure / adminProcedure)
                                      │
                                      ▼
                              [Procedure Handler]
                                      │
                                      ▼
                              [Prisma → Neon PostgreSQL]
```

---

## Camadas de Middleware tRPC

O arquivo `server/trpc.ts` define a factory de procedimentos com middleware em cadeia:

| Procedimento | Autenticação | Tenant Status | RBAC |
|---|---|---|---|
| `publicProcedure` | ❌ | ❌ | ❌ |
| `publicProcedureNoRateLimit` | ❌ | ❌ | ❌ |
| `authenticatedProcedure` | ✅ | ❌ | ❌ |
| `protectedProcedure` | ✅ | ✅ | ❌ |
| `protectedProcedureNoRateLimit` | ✅ | ✅ (sem rate limit) | ❌ |
| `managerProcedure` | ✅ | ✅ | OWNER, MANAGER, ADMIN_SAAS |
| `ownerProcedure` | ✅ | ✅ | OWNER, ADMIN_SAAS |
| `adminProcedure` | ✅ | ✅ | ADMIN_SAAS only |

> `protectedProcedureNoRateLimit` existe especificamente para operações de alta frequência nas vistorias (atualização de itens foto a foto), onde o rate limit padrão de 50 req/min seria insuficiente.

---

## Multi-Tenancy: Isolamento de Dados

O isolamento é implementado em três camadas complementares:

### 1. JWT Claims (Clerk)
O middleware lê `session.sessionClaims.public_metadata` para obter:
- `tenantStatus` — estado atual do tenant (cacheado no JWT)
- `role` — role do usuário
- `trialEndsAt` — data de expiração do trial
- `isFoundingMember` — flag de membro fundador
- `tosVersion` — versão dos ToS aceita

### 2. Context (tRPC)
`tenantMiddleware` extrai o `tenantId` do usuário autenticado e injeta no `ctx`. Toda procedure autenticada recebe `ctx.tenantId`.

### 3. Query Level (Prisma)
Toda query usa `where: { tenantId: ctx.tenantId! }`. Isso garante que um tenant nunca acesse dados de outro, mesmo que consiga descobrir IDs.

```typescript
// Exemplo: busca de clientes sempre filtrada pelo tenant
const customers = await ctx.db.customer.findMany({
    where: { tenantId: ctx.tenantId!, deletedAt: null }
});
```

---

## Cache Layer (Upstash Redis)

O Redis é usado de forma defensiva — falhas são silenciadas e o sistema cai de volta para o DB:

| Cache Key | TTL | Conteúdo |
|---|---|---|
| `tenant:status:{tenantId}` | 30 min | Status do tenant (string) |
| Rate limit window | 1 min | Contador por userId |

O cache de status é invalidado explicitamente via `invalidateTenantCache(tenantId)` sempre que o status muda (ex: webhook do Stripe atualiza assinatura).

---

## Storage (S3-Compatible)

O módulo `lib/storage.ts` usa o AWS SDK com `forcePathStyle: true` para compatibilidade com o endpoint Supabase Storage.

Estrutura de paths no bucket:
```
{tenantId}/{orderId}/{filename}
```

Exemplo de URL:
```
https://{supabase-project}.supabase.co/storage/v1/object/public/{bucket}/{tenantId}/{orderId}/OS001-entrada-signature-1234567890.png
```

Tipos de arquivo armazenados:
- Fotos de itens de vistoria (base64 → buffer → S3)
- Assinaturas digitais (canvas → PNG → S3)
- PDFs de contratos e OS
- Vídeos de vistoria final (`finalVideoUrl`)

---

## PWA & Service Worker

Configurado via `@ducanh2912/next-pwa` com worker customizado em `worker/index.ts`.

**Estratégias de cache:**

| Pattern | Strategy | TTL |
|---|---|---|
| `*.clerk.*` | NetworkFirst | 1h |
| `/api/trpc/*` | NetworkFirst | 5min |
| `/_next/static/*` | CacheFirst | 30 dias |
| `/_next/image/*` | CacheFirst | 7 dias |

O modo offline é crítico para técnicos trabalhando em vistorias sem conexão estável. O `UploadQueue` gerencia fotos offline que precisam ser sincronizadas quando a conexão retorna.

---

## Routers tRPC (Visão Geral)

O `_app.ts` compõe 19 routers de domínio:

```
appRouter
├── admin          → Painel administrativo SaaS
├── health         → Healthcheck e benchmarks
├── customer       → CRUD de clientes
├── vehicle        → CRUD de veículos
├── service        → Catálogo de serviços
├── product        → Catálogo de produtos + estoque
├── order          → Motor de OS (Service Orders)
├── inspection     → Sistema de vistorias
├── schedule       → Agendamento e calendário
├── dashboard      → KPIs e analytics
├── user           → Gerenciamento de usuários
├── settings       → Configurações do tenant
├── tenant         → Setup e perfil do tenant
├── notification   → Push notifications
├── report         → Exportação de relatórios
├── backup         → Exportação de dados
├── billing        → Assinatura e pagamentos Stripe
├── partnership    → Programa de parceria/indicação
└── benchmark      → Métricas de performance
```

---

## Webhooks

### Clerk Webhook (`/api/webhooks/clerk`)
Eventos tratados:
- `user.created` — cria User no banco
- `user.updated` — sincroniza dados do usuário
- `organization.created` — pode criar tenant
- `organizationMembership.*` — gerencia membros

### Stripe Webhook (`/api/webhooks/stripe`)
Eventos tratados:
- `checkout.session.completed` — ativa assinatura
- `invoice.payment_succeeded` — renova período
- `invoice.payment_failed` — marca PAST_DUE
- `customer.subscription.deleted` — cancela tenant
- `customer.subscription.updated` — sincroniza status

Todos os webhooks são logados em `WebhookLog` para debug e retry.

---

## Segurança de Cabeçalhos HTTP

Configurados globalmente em `next.config.ts`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Monitoramento

- **Sentry** — error tracking com source maps (client + server + edge)
- **Vercel Analytics** — web vitals e métricas de uso
- **Vercel Speed Insights** — Core Web Vitals por página
- **Uptime** — UptimeRobot (configuração externa)
- **Benchmarks** — router `benchmark` coleta latência de queries críticas

---

## Decisões Arquiteturais Chave

### Por que tRPC em vez de REST?
Type-safety end-to-end sem codegen. Quando um input ou output muda no router, o TypeScript quebra no frontend imediatamente. Zero contratos OAI para manter.

### Por que Clerk?
Multi-tenancy via Organizations é built-in. JWT claims propagam estado do tenant sem DB lookup no middleware (edge-compatible). Social SSO sem configuração.

### Por que Neon?
Branching de banco para ambientes efêmeros. Escala serverless sem cold start de conexão pesado. Compatível com Prisma Accelerate se necessário no futuro.

### Por que pnpm + Turborepo?
Cache de build inteligente. O pacote `database` é compartilhado entre apps. Turborepo garante que o `db:generate` rode antes do `build` automaticamente.
