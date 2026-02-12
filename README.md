<p align="center">
  <img src="apps/web/src/app/icon.svg" alt="Autevo Logo" width="150" height="150" />
</p>

<h1 align="center">Autevo</h1>

<p align="center">
  <strong>Sistema SaaS de Ordem de Serviço para Estéticas Automotivas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square&logo=trpc" alt="tRPC" />
</p>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tech Stack](#-tech-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Deploy](#-deploy)

---

## 🚀 Sobre o Projeto

**Autevo** é uma plataforma SaaS completa para gerenciamento estratégico de negócios automotivos (oficinas, estéticas, centros de detalhamento e mecânicas). O sistema oferece controle total sobre ordens de serviço, clientes, veículos, agendamentos, vistorias digitais, financeiro e comissionamento.

### Destaques

- 🏢 **Multi-tenant** — Isolamento completo de dados por empresa
- 📱 **Responsivo** — Interface otimizada para desktop e mobile
- 🔐 **Seguro** — Autenticação robusta com Clerk + rate limiting com Upstash
- 📊 **Dashboard** — Métricas em tempo real e relatórios detalhados
- 🔔 **Notificações** — Integração com WhatsApp para comunicação com clientes
- 🖨️ **PDF/Print** — Geração de contratos, ordens de serviço e relatórios

---

## ✨ Funcionalidades

| Módulo                | Descrição                                                           |
| --------------------- | ------------------------------------------------------------------- |
| **Dashboard**         | Visão geral com métricas de faturamento, agendamentos e performance |
| **Ordens de Serviço** | Criação, acompanhamento e gestão completa de OS                     |
| **Clientes**          | Cadastro com histórico, veículos e aniversários da semana           |
| **Veículos**          | Registro detalhado com marca, modelo, placa e cor                   |
| **Serviços**          | Catálogo de serviços com preços e tempo estimado                    |
| **Produtos**          | Controle de estoque e movimentações                                 |
| **Agendamentos**      | Calendário interativo com disponibilidade                           |
| **Vistorias**         | Checklist fotográfico de entrada e saída                            |
| **Comissões**         | Cálculo automático por funcionário (% ou fixo)                      |
| **Financeiro**        | Controle de pagamentos (PIX, cartão, dinheiro)                      |
| **Relatórios**        | Exportação em Excel e visualização de dados                         |
| **Tracking**          | Link público para cliente acompanhar status                         |
| **Admin SaaS**        | Painel administrativo para gestão de tenants                        |

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** — App Router + Server Components
- **React 19** — UI Library
- **Tailwind CSS 3** — Styling
- **Radix UI** — Componentes acessíveis
- **Framer Motion** — Animações
- **Recharts** — Gráficos
- **Lucide React** — Ícones

### Backend

- **tRPC 11** — API type-safe end-to-end
- **Prisma 6** — ORM para PostgreSQL
- **Clerk** — Autenticação e gerenciamento de usuários
- **Upstash Redis** — Rate limiting e cache
- **Supabase Storage** — Armazenamento de imagens

### Infraestrutura

- **Turborepo** — Monorepo tooling
- **Docker** — Container para PostgreSQL local
- **Vercel** — Deploy e hosting
- **Neon** — PostgreSQL serverless (produção)
- **Sentry** — Monitoramento de erros

---

## 📁 Estrutura do Projeto

```
autevo/
├── apps/
│   └── web/                    # Aplicação Next.js
│       ├── src/
│       │   ├── app/            # App Router (páginas e rotas)
│       │   │   ├── admin/      # Painel administrativo SaaS
│       │   │   ├── booking/    # Agendamento público
│       │   │   ├── dashboard/  # Área logada do tenant
│       │   │   ├── tracking/   # Acompanhamento público de OS
│       │   │   └── api/        # API routes (webhooks, trpc)
│       │   ├── components/     # Componentes React
│       │   │   ├── ui/         # Primitivos (Button, Input, Dialog)
│       │   │   ├── layout/     # Navbar, Sidebar, Footer
│       │   │   ├── orders/     # Componentes de OS
│       │   │   └── ...
│       │   ├── server/         # Backend tRPC
│       │   │   ├── routers/    # Procedures por domínio
│       │   │   └── trpc.ts     # Configuração tRPC
│       │   ├── lib/            # Utilitários e helpers
│       │   ├── hooks/          # Custom hooks
│       │   └── types/          # TypeScript declarations
│       └── public/             # Assets estáticos
│
├── packages/
│   └── database/               # Prisma schema e client
│       ├── prisma/
│       │   └── schema.prisma   # Definição do banco
│       └── src/
│           └── index.ts        # Export do Prisma Client
│
├── docs/                       # Documentação do projeto
│   ├── FEATURES.md             # Funcionalidades do sistema
│   └── ROADMAP.md              # Roadmap de desenvolvimento
│
├── docker-compose.yml          # PostgreSQL local
├── turbo.json                  # Configuração Turborepo
├── pnpm-workspace.yaml         # Workspaces pnpm
└── package.json                # Scripts root
```

---

## 📚 Documentação

| Documento                       | Descrição                                    |
| ------------------------------- | -------------------------------------------- |
| [FEATURES.md](docs/FEATURES.md) | Lista completa de funcionalidades do sistema |
| [ROADMAP.md](docs/ROADMAP.md)   | Roadmap de 12 meses com metas e KPIs         |

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta  | Versão | Link                                  |
| ----------- | ------ | ------------------------------------- |
| **Node.js** | ≥ 20.x | [nodejs.org](https://nodejs.org/)     |
| **pnpm**    | 10.x   | [pnpm.io](https://pnpm.io/)           |
| **Docker**  | Latest | [docker.com](https://www.docker.com/) |

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/autevo.git
cd autevo
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie os arquivos de exemplo e preencha:

```bash
# Banco de dados
cp packages/database/.env.example packages/database/.env

# Aplicação web
cp apps/web/.env.example apps/web/.env.local
```

### 4. Inicie o banco de dados

```bash
docker-compose up -d
```

### 5. Sincronize o schema do banco

```bash
pnpm db:push
```

### 6. Execute o projeto

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔐 Variáveis de Ambiente

### `packages/database/.env`

```env
DATABASE_URL="postgresql://filmtech:filmtech123@localhost:5433/filmtech"
```

### `apps/web/.env.local`

```env
# Database
DATABASE_URL="postgresql://filmtech:filmtech123@localhost:5433/filmtech"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Supabase Storage (Armazenamento de imagens)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Upstash Redis (Rate Limiting + Cache)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Security
ENCRYPTION_SALT="seu-salt-secreto"

# Sentry (Opcional)
SENTRY_AUTH_TOKEN="..."
NEXT_PUBLIC_SENTRY_DSN="..."

# Stripe (Billing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STANDARD="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 📜 Scripts Disponíveis

Execute na raiz do projeto:

| Script             | Descrição                            |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Inicia o servidor de desenvolvimento |
| `pnpm build`       | Gera build de produção               |
| `pnpm lint`        | Executa linting em todos os pacotes  |
| `pnpm type-check`  | Verifica tipos TypeScript            |
| `pnpm db:generate` | Gera o Prisma Client                 |
| `pnpm db:push`     | Sincroniza schema com o banco        |
| `pnpm db:studio`   | Abre o Prisma Studio                 |
| `pnpm clean`       | Limpa caches e node_modules          |

---

## 🌐 Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Defina os comandos:
   - **Build Command:** `pnpm build`
   - **Install Command:** `pnpm install`
   - **Root Directory:** `apps/web`

### Banco de Dados

Recomendamos [Neon](https://neon.tech/) para PostgreSQL serverless em produção.

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

<p align="center">
  Desenvolvido com ❤️ por <strong>Autevo Team</strong>
</p>
