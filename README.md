# Autevo

Plataforma SaaS completa para gestao de oficinas e esteticas automotivas. Controle de ordens de servico, vistorias digitais, financeiro, agendamentos e automacao via WhatsApp.

## Stack

- **Framework:** Next.js 15 + React 19 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Radix)
- **Animacoes:** Framer Motion
- **Backend:** tRPC + Prisma + PostgreSQL
- **Auth:** Clerk
- **Pagamentos:** Stripe
- **Infra:** Vercel + AWS S3 + Upstash Redis
- **Monorepo:** Turborepo + pnpm workspaces

## Estrutura

```
apps/
  web/                    # Aplicacao Next.js principal
    src/
      app/                # App Router (pages, API routes)
      components/
        landing/          # Componentes da landing page
        layout/           # Header, Sidebar, Layout do app
        ui/               # shadcn/ui components
      server/             # tRPC routers e server-side logic
      lib/                # Utilities e helpers
packages/
  database/               # Prisma schema e client
```

## Landing Page

A landing page (`apps/web/src/app/page.tsx`) possui as seguintes secoes:

| Secao | Arquivo | Descricao |
|-------|---------|-----------|
| Navbar | `Navbar.tsx` | Navegacao fixa com scroll effect, menu mobile e link ativo |
| Hero | `HeroSection.tsx` | Mockup animado do dashboard com stats, grafico e OS |
| Problema vs Solucao | `ProblemAwareness.tsx` | Comparativo visual antes/depois do Autevo |
| Como Funciona | `HowItWorks.tsx` | 3 passos para comecar |
| Funcionalidades | `FeaturesGrid.tsx` | Grid com 8 features do sistema |
| Vistoria | `FeatureVistoria.tsx` | Mockup mobile com checklist animado e assinatura |
| Financeiro | `FeatureFinance.tsx` | Dashboard financeiro com numeros animados |
| WhatsApp | `FeatureWhatsapp.tsx` | Conversa animada com mensagens aparecendo |
| Metricas | `MetricsSection.tsx` | Contadores animados de social proof |
| Depoimentos | `Testimonials.tsx` | Cards de depoimentos de clientes |
| FAQ | `FAQSection.tsx` | Accordion com 8 perguntas frequentes |
| Planos | `FinalCTA.tsx` | Pricing mensal/anual com CTA |

## Funcionalidades do Sistema

- **Ordens de Servico** - Criacao, edicao, status e envio via WhatsApp
- **Vistoria Digital** - Checklist com fotos, marcacao de avarias e assinatura do cliente
- **Financeiro** - Faturamento, comissoes, fluxo de caixa e relatorios
- **Clientes & Veiculos** - Cadastro completo com historico
- **Agendamento Online** - Link de booking para clientes
- **Automacao WhatsApp** - Notificacoes automaticas de status
- **Equipe & RH** - Gestao de funcionarios e comissoes
- **Parceria** - Sistema de indicacao de clientes

## Desenvolvimento

```bash
# Instalar dependencias
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build
pnpm build

# Gerar Prisma client
pnpm db:generate
```

## Variaveis de Ambiente

O arquivo `.env` deve conter:

- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Autenticacao
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Pagamentos
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_BUCKET_NAME` - Storage S3
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Rate limiting
- `SENTRY_DSN` - Monitoramento de erros
