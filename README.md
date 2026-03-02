<p align="center">
  <img src="apps/web/src/app/icon.svg" alt="Autevo Logo" width="120" height="120" />
</p>

<h1 align="center">Autevo</h1>

<p align="center">
  <strong>SaaS Multi-Tenant para Gestão de Estéticas Automotivas</strong><br />
  <em>Ordens de serviço, vistorias com fotos, comissões, billing e PWA — tudo em um só lugar.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square&logo=trpc" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Turborepo-2.3-EF4444?style=flat-square&logo=turborepo" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk" />
  <img src="https://img.shields.io/badge/Stripe-Billing-008CDD?style=flat-square&logo=stripe" />
</p>

---

## 📋 Índice

- [O que é o Autevo](#-o-que-é-o-autevo)
- [Stack & Decisões Técnicas](#-stack--decisões-técnicas)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Testes](#-testes)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Documentação](#-documentação)

---

## 🚀 O que é o Autevo

**Autevo** é um SaaS B2B construído para estéticas automotivas, detailers e oficinas gerenciarem toda a operação em um único sistema: do agendamento ao pagamento, com documentação fotográfica de cada etapa.

Cada cliente do SaaS opera em um **tenant isolado** — dados completamente separados a nível de query (Prisma + `tenantId`), sem Row-Level Security de banco.

### Por que construímos assim?

- **Zero vazamento entre tenants** — todo `prisma.find*` filtra por `tenantId` extraído do JWT do Clerk.
- **PWA + Offline** — técnicos fotografam o carro sem sinal. As fotos ficam na fila (`idb-keyval`) e sincronizam quando a rede voltar.
- **Audit trail completo** — qualquer mutação crítica grava `oldValue` + `newValue` no `AuditLog`.
- **Billing automático** — máquina de estados Stripe → Clerk metadata → middleware de acesso.

---

## 🛠️ Stack & Decisões Técnicas

### Backend

| Tecnologia | Versão | Função |
|---|---|---|
| Next.js (App Router) | 15.1.11 | Framework principal, Edge middleware, API routes |
| tRPC | 11.0.0-rc | API type-safe end-to-end, 20 routers de domínio |
| Prisma | 6 | ORM, migrations, client type-safe |
| PostgreSQL (Neon) | 16 | Banco serverless com branching |
| Clerk | 6.7 | Auth multi-tenant, JWT com `public_metadata` |
| Stripe | 20.2 | Subscription lifecycle, webhooks |
| Upstash Redis | 1.36 | Rate limiting (50 req/min sliding window) + cache de tenant status |
| Supabase Storage (S3) | — | Fotos de vistoria, assinaturas, PDFs gerados |
| Sentry | 10 | Error tracking + source maps |

### Frontend

| Tecnologia | Função |
|---|---|
| React 19 | UI |
| Tailwind CSS 3.4 + Radix UI | Design system acessível |
| Framer Motion 12 | Animações |
| Recharts 3 | Dashboards financeiros e gráficos |
| Zustand 5 | Estado global leve |
| React Hook Form + Zod | Formulários com validação type-safe |
| `@react-pdf/renderer` | Geração de PDFs de OS e relatórios |
| `driver.js` | Tutorial in-app passo a passo |
| `heic2any` | Conversão de fotos HEIC (iPhone) para JPEG no browser |
| `idb-keyval` | Fila offline de fotos no IndexedDB |
| `web-push` | Push notifications via Web Push API (VAPID) |
| `next-pwa` (`@ducanh2912`) | Service worker, installable PWA |

### Monorepo

| Tecnologia | Função |
|---|---|
| Turborepo 2.3 | Build cache, task graph, pipeline de CI |
| pnpm 10 | Package manager com workspaces |
| Husky + lint-staged | Pre-commit hooks (ESLint no diff) |
| GitHub Actions | CI: lint → type-check → build → testes → deploy |
| Vitest 2 | Testes de integração |
| Playwright | Testes E2E |

---

## 📊 Funcionalidades

### Ordens de Serviço (OS)

Máquina de estados com 7 status:

```
AGENDADO → AGUARDANDO_APROVACAO → EM_VISTORIA → EM_EXECUCAO → AGUARDANDO_PAGAMENTO → CONCLUIDO
                                                                                         ↑
                                                                                    CANCELADO
```

- Aprovação do cliente por link público (token one-time com expiração)
- Múltiplos pagamentos parciais (PIX, cartão, dinheiro, transferência)
- Desconto em % ou valor fixo
- Numeração sequencial por tenant (`OS-001`, `OS-002`...) com `TenantSequence` atômico
- Audit log em cada transição de status

### Vistoria Fotográfica

- 3 tipos: **Entrada**, **Intermediária**, **Final** (herda itens da entrada)
- Checklist com **14 itens** em 4 categorias: Exterior, Interior, Acessórios, Motor
- Múltiplas fotos por item do checklist
- Registro de avarias livres (tipo, severidade, localização, fotos)
- Assinaturas digitais do funcionário e do cliente (canvas → S3)
- Vistoria final acessível via link público para o cliente assinar sem login
- Suporte a HEIC (iPhone) — conversão automática no browser

### Financeiro & Comissões

- Dashboard com KPIs: faturamento do período, ticket médio, CMV, lucro bruto
- Gráfico de faturamento por período + distribuição por método de pagamento
- Comissão por técnico: percentual ou valor fixo por serviço
- Liquidação de comissões em lote com referência PIX
- Relatório financeiro por técnico (visão de manager/owner)

### Estoque

- Controle de produtos com custo e preço de venda
- Dedução automática de estoque ao vincular produto a uma OS
- Snapshot de `costPrice` no `OrderProduct` para CMV histórico correto
- Alertas de estoque mínimo + fila de reposição (`PendingRestock`)

### Clientes & Veículos

- Múltiplos veículos por cliente
- Histórico completo de OS por cliente e por veículo
- Opt-in WhatsApp para notificações
- Soft delete (nunca exclusão física)

### Agendamento

- Visão de agenda com limite diário configurável por tenant
- Link público de agendamento por slug do tenant (`/booking/[slug]`)

### Sistema de Parceria

- Código único por parceiro (ex: `FILMTECH`)
- Comissão de R$ 42/mês por indicado ativo
- Tier gratuito: 5+ indicados ativos = plano sem custo
- Dashboard de parceria com referrals, status e histórico de comissões

### Billing & Planos

- **Trial gratuito** (duração configurável por tenant)
- **Plano Standard**: R$ 190/mês
- **Membro Fundador**: R$ 97/mês → R$ 140/mês (15 slots limitados, 60 dias de trial)
- Promo codes com desconto percentual e duração configurável (em meses)
- Portal do cliente Stripe para gerenciar assinatura
- Webhook state machine: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### PWA & Notificações

- Instalável como app nativo (iOS e Android)
- Offline: fila de fotos no IndexedDB, sincronização automática ao voltar online
- Push notifications (Web Push API + VAPID) com preferências granulares por usuário
- Página `/offline` para quando não há conexão

### RBAC

| Role | Acesso |
|---|---|
| `ADMIN_SAAS` | Acesso total cross-tenant (admin da plataforma) |
| `OWNER` | Dono do tenant — billing, configurações, todos os dados |
| `MANAGER` | Financeiro, relatórios, configurações operacionais |
| `MEMBER` | OS e vistorias do próprio tenant |

### Crons (Vercel)

| Cron | Schedule | Função |
|---|---|---|
| `/api/cron/warmup` | `0 8 * * *` | Evita cold start do Neon/Vercel |
| `/api/cron/cleanup-expired-tokens` | `0 3 * * *` | Remove tokens de aprovação expirados |
| `/api/cron/update-founder-subscriptions` | `0 4 * * *` | Atualiza benefícios de membros fundadores |
| `/api/cron/inactive-customers` | Via middleware | Envia lembretes de clientes inativos (anti-spam: mínimo 7 dias) |

---

## 🏗️ Arquitetura

```
Browser / PWA
     │
     ▼
Clerk Edge Middleware (auth, tenant status, ToS check, redirects)
     │
     ▼
Next.js 15 App Router
     │
     ├── /dashboard/*         (área autenticada — tenant)
     ├── /admin/*             (área ADMIN_SAAS)
     ├── /public/approve      (aprovação pública de OS — sem login)
     ├── /tracking/[orderId]  (tracking público de OS)
     ├── /booking/[slug]      (agendamento público)
     ├── /api/trpc/*          (tRPC handler)
     ├── /api/webhooks/*      (Clerk + Stripe webhooks)
     ├── /api/cron/*          (Vercel Crons, autenticados por CRON_SECRET)
     ├── /api/upload          (upload direto para S3/Supabase)
     └── /api/pdf             (geração de PDF com Puppeteer headless)
          │
          ▼
     tRPC Procedures (20 routers de domínio)
          │
          ├── rateLimitMiddleware    (50 req/min Upstash Redis)
          ├── tenantMiddleware       (resolve tenant do JWT Clerk)
          └── RBAC (requireRole)    (OWNER / MANAGER / MEMBER / ADMIN_SAAS)
               │
               ▼
          Prisma 6 + PostgreSQL 16 (Neon Serverless)
```

### tRPC Routers

| Router | Responsabilidade |
|---|---|
| `order` | OS — CRUD, máquina de estados, aprovação, pagamentos |
| `inspection` | Vistoria — checklist, fotos, avarias, assinaturas |
| `customer` | Clientes — CRUD, soft delete, inatividade |
| `vehicle` | Veículos — CRUD por cliente |
| `service` | Catálogo de serviços |
| `product` | Estoque — CRUD, alertas, movimentações |
| `dashboard` | KPIs financeiros, gráficos, overview |
| `report` | Relatórios por período/técnico |
| `schedule` | Agendamentos — visão de agenda |
| `user` | Usuários do tenant — convites, comissões, soft delete |
| `tenant` | Configurações do tenant, branding, preferências |
| `settings` | SystemConfig, templates WhatsApp, configurações gerais |
| `notification` | Push subscriptions, preferências, envio |
| `billing` | Stripe — planos, histórico, promo codes, parceria |
| `partnership` | Dashboard de parceiro, referrals, comissões |
| `admin` | Panel SaaS — gestão cross-tenant (ADMIN_SAAS only) |
| `backup` | Export de dados do tenant |
| `benchmark` | Métricas de performance de queries |
| `health` | Health check da aplicação |

---

## 📁 Estrutura do Projeto

```
autevo/                              # Turborepo monorepo root
├── apps/
│   └── web/                         # Next.js 15 (App Router)
│       ├── src/
│       │   ├── app/
│       │   │   ├── dashboard/       # Área autenticada do tenant
│       │   │   │   ├── orders/      # Ordens de serviço
│       │   │   │   ├── scheduling/  # Agenda
│       │   │   │   ├── customers/   # Clientes
│       │   │   │   ├── vehicles/    # Veículos
│       │   │   │   ├── services/    # Catálogo de serviços
│       │   │   │   ├── products/    # Estoque
│       │   │   │   ├── financial/   # Financeiro & comissões
│       │   │   │   ├── users/       # Equipe
│       │   │   │   └── settings/    # Configurações do tenant
│       │   │   ├── admin/           # Panel SaaS (ADMIN_SAAS)
│       │   │   ├── public/approve/  # Aprovação pública de OS
│       │   │   ├── tracking/        # Tracking público de OS
│       │   │   ├── booking/[slug]/  # Agendamento público
│       │   │   ├── setup/           # Onboarding wizard (3 etapas)
│       │   │   ├── welcome/         # Pós-cadastro
│       │   │   ├── api/
│       │   │   │   ├── trpc/        # tRPC handler
│       │   │   │   ├── webhooks/    # Clerk + Stripe webhooks
│       │   │   │   ├── cron/        # Vercel Cron jobs
│       │   │   │   ├── upload/      # Upload para S3
│       │   │   │   ├── push/        # Web Push API
│       │   │   │   └── pdf/         # Geração PDF (Puppeteer)
│       │   │   └── ...              # sign-in, sign-up, terms, privacy
│       │   ├── server/
│       │   │   ├── trpc.ts          # Context, middlewares, procedure factories
│       │   │   └── routers/         # 20 routers de domínio
│       │   ├── components/          # Design system + componentes por domínio
│       │   ├── lib/                 # Helpers: audit, rate-limit, storage, whatsapp, stripe...
│       │   ├── hooks/               # Custom hooks React
│       │   └── types/               # Tipos globais TypeScript
│       ├── __tests__/               # Testes E2E (Playwright)
│       └── vercel.json              # Crons config
│
├── packages/
│   └── database/                    # Pacote compartilhado do banco
│       ├── prisma/
│       │   ├── schema.prisma        # Source of truth do schema
│       │   └── seed.ts              # Seed de desenvolvimento
│       └── src/index.ts             # Re-export do Prisma Client
│
├── docs/                            # Documentação técnica completa
├── .github/workflows/ci.yml         # CI/CD pipeline
├── turbo.json                       # Task graph do Turborepo
└── pnpm-workspace.yaml              # Workspaces
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js** `>= 20`
- **pnpm** `10.x` — `npm i -g pnpm`
- **Docker** (para PostgreSQL local)

### 1. Clone e instale

```bash
git clone <repo-url>
cd autevo
pnpm install
```

> O `postinstall` roda `pnpm db:generate` automaticamente (gera o Prisma Client).

### 2. Variáveis de ambiente

```bash
cp apps/web/.env.example apps/web/.env.local
```

Preencha as variáveis obrigatórias (veja [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)):

```bash
# Mínimo para rodar localmente:
DATABASE_URL="postgresql://filmtech:filmtech123@localhost:5433/filmtech"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para billing e storage, consulte `.env.example` — são opcionais em desenvolvimento.

### 3. Suba o banco local

```bash
# PostgreSQL na porta 5433 (para não conflitar com instâncias locais)
docker compose up -d

# Push do schema (sem migrations, ideal para dev)
pnpm db:push
```

### 4. (Opcional) Seed

```bash
pnpm --filter database db:seed
```

### 5. Rode

```bash
pnpm dev
```

A aplicação sobe em `http://localhost:3000`.

> **Turborepo** gerencia a ordem de build dos pacotes automaticamente. O `@autevo/database` é compilado antes do `@autevo/web`.

### Comandos úteis

```bash
pnpm db:studio          # Prisma Studio (UI do banco)
pnpm db:push            # Aplica schema sem migration
pnpm db:generate        # Regenera o Prisma Client
pnpm lint               # ESLint em todos os pacotes
pnpm type-check         # TypeScript sem emitir (todos os pacotes)
pnpm build              # Build de produção (Turborepo cache)
pnpm clean              # Remove .turbo + node_modules
```

---

## 🧪 Testes

### Integração (Vitest)

Testa routers tRPC e lógica de negócio com banco de teste real.

```bash
# Configura banco de teste e roda os testes
pnpm test:integration
```

Requer `.env.test` com `DATABASE_URL` apontando para um banco de teste separado e banco de teste inicializado:

```bash
pnpm --filter web db:test:setup   # cria schema no banco de teste
```

Suítes disponíveis:

```
src/server/__tests__/order.test.ts       # Máquina de estados da OS
src/server/__tests__/inventory.test.ts   # Lógica de estoque
src/lib/__tests__/formatters.test.ts     # Utilitários de formatação
```

### E2E (Playwright)

```bash
pnpm test:e2e            # Headless
pnpm test:e2e:ui         # Com UI do Playwright
```

### Testes unitários simples

```bash
pnpm --filter web test      # Vitest watch mode
pnpm --filter web test:ui   # Vitest UI
```

---

## 🔐 Segurança

### Multi-tenancy

Todo `prisma.*.findMany/findFirst/update/delete` filtra por `tenantId` via `tenantMiddleware` no tRPC. Nunca há query cross-tenant acidental.

### Auth & Autorização

- **Clerk** gerencia sessões. O `tenantId`, `role`, `tenantStatus`, `trialEndsAt` e `tosVersion` ficam no `public_metadata` do usuário.
- **RBAC** via `requireRole()` no tRPC — hierarquia: `ADMIN_SAAS > OWNER > MANAGER > MEMBER`.
- **Edge middleware** (`middleware.ts`) bloqueia rotas com base no `tenantStatus` antes do request chegar ao servidor.

### Rate Limiting

`rateLimitMiddleware` — **50 requisições/minuto** por usuário (sliding window, Upstash Redis).

### Criptografia

Campos sensíveis (`pixKey`, `cnpj`) são criptografados com **AES-256-GCM** antes de persistir.

### Tokens de Aprovação

Tokens one-time com expiração para aprovação pública de OS. Invalidados após uso.

### Headers HTTP

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Para mais detalhes: [docs/SECURITY.md](docs/SECURITY.md)

---

## 🌐 Deploy

O Autevo é deployado no **Vercel** com integração automática via GitHub Actions.

### Pipeline CI/CD

```
push → lint → type-check → build → test:integration → test:e2e → deploy (Vercel)
```

### Configuração Vercel

| Campo | Valor |
|---|---|
| Root Directory | `.` (raiz do monorepo) |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Output Directory | Automático (Next.js) |

### Variáveis de Ambiente

Configure todas as variáveis de `apps/web/.env.example` no dashboard do Vercel. Consulte [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) para a lista completa com descrições.

### Banco de Dados

Produção usa **Neon PostgreSQL** (serverless). Migrations são aplicadas via:

```bash
pnpm --filter database db:migrate
```

> **Nunca** use `db:push` em produção.

Para guia completo de deploy, rollback e troubleshooting: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 Documentação

Toda a documentação técnica está em [`/docs`](docs/):

| Arquivo | Conteúdo |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrama de arquitetura, camadas, decisões técnicas |
| [DATABASE.md](docs/DATABASE.md) | Schema completo — todos os modelos e campos |
| [API.md](docs/API.md) | Referência de todos os 20 routers tRPC |
| [FEATURES.md](docs/FEATURES.md) | Funcionalidades detalhadas por módulo |
| [SECURITY.md](docs/SECURITY.md) | Modelo de segurança completo |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | CI/CD, Vercel, rollback, troubleshooting |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Todas as variáveis de ambiente |
| [INSPECTIONS.md](docs/INSPECTIONS.md) | Sistema de vistoria — checklist, fotos, assinaturas |
| [BILLING.md](docs/BILLING.md) | Planos, Stripe, webhooks, programa de parceria |
| [TENANT_LIFECYCLE.md](docs/TENANT_LIFECYCLE.md) | Ciclo de vida do tenant — onboarding, status, ToS |
| [CRONS.md](docs/CRONS.md) | Jobs agendados — schedules, lógica, monitoramento |
| [ROADMAP.md](docs/ROADMAP.md) | Roadmap estratégico 2026 |
| [schema-reference.xlsx](docs/schema-reference.xlsx) | Planilha do schema — todos os modelos, enums e relacionamentos |

---

<p align="center">
  Software Proprietário — Todos os Direitos Reservados.<br />
  <strong>Autevo © 2026</strong>
</p>
