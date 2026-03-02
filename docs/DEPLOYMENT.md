# 🚀 Autevo — Guia de Deploy e CI/CD

> **Plataforma:** Vercel
> **CI/CD:** GitHub Actions
> **Branch principal:** `main`

---

## Visão Geral do Pipeline

```
push/PR → main
    │
    ├─ [1] lint (ESLint)
    │         │
    ├─ [2] type-check (TypeScript) ── depende de [1]
    │         │
    ├─ [3] build ────────────────── depende de [2]
    │         │
    ├─ [4] test-integration ──────── depende de [3]
    │   (Vitest + PostgreSQL real)
    │         │
    ├─ [5] test-e2e ─────────────── depende de [3] (paralelo com [4])
    │   (Playwright + PostgreSQL real)
    │         │
    └─ [6] deploy-production ──────── depende de [4] + [5]
        (Vercel, apenas na main)
```

O deploy para produção **só acontece** se os testes de integração E os E2E passarem. Um único teste falhando bloqueia o deploy.

---

## Jobs do CI

### 1. ESLint
```yaml
pnpm lint
```
Roda em paralelo, sem dependências. Falha rápida.

### 2. TypeScript Type Check
```yaml
pnpm type-check
```
Depende do lint passar. Garante que refatorações não quebram contratos de tipo.

### 3. Build
```yaml
pnpm build
```
Build completo do Turborepo. Usa cache de build (`.turbo`). Variáveis de ambiente de build são mocks seguros para não expor segredos reais em CI.

### 4. Integration Tests (Vitest)
- Sobe um container PostgreSQL 15 real
- Executa `pnpm db:push` para criar o schema
- Roda `pnpm --filter web run test`
- Testa lógica de negócio (cálculo de comissões, validações de OS, etc.)

### 5. E2E Tests (Playwright)
- Sobe PostgreSQL real separado
- Seed com usuário Clerk real (via `seed-e2e.ts`)
- Build da aplicação Next.js
- Roda testes de fluxo completo:
  - `auth.setup.ts` — setup de autenticação
  - `order-flow.spec.ts` — fluxo completo de OS
  - `legal-blindage.spec.ts` — testes de compliance legal
- Report do Playwright é salvo como artefato (7 dias)

### 6. Deploy Produção
```yaml
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```
Usa Vercel CLI. Os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` devem estar configurados nos GitHub Secrets.

---

## Configuração da Vercel

### Configuração do Projeto

```json
// vercel.json (raiz)
{
    "buildCommand": "pnpm build",
    "installCommand": "pnpm install"
}
```

```json
// apps/web/vercel.json
{
    "crons": [
        { "path": "/api/cron/cleanup-expired-tokens", "schedule": "0 2 * * *" },
        { "path": "/api/cron/inactive-customers",      "schedule": "0 9 * * *" },
        { "path": "/api/cron/update-founder-subscriptions", "schedule": "0 0 * * 0" },
        { "path": "/api/cron/warmup",                  "schedule": "*/5 * * * *" }
    ]
}
```

### Configurações Obrigatórias

| Configuração Vercel | Valor |
|--------------------|-------|
| Root Directory | `.` (raiz do monorepo) |
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Output Directory | `apps/web/.next` |

### Node.js Version
Usar **Node.js 20.x** — conforme configurado nos workflows de CI.

---

## Environment Variables — Produção

Todas as variáveis do `apps/web/.env.local` devem ser configuradas no dashboard da Vercel em **Settings → Environment Variables**.

Veja `ENVIRONMENT.md` para a lista completa e descrição de cada variável.

---

## GitHub Secrets Necessários

Configurar em **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|--------|-----------|
| `VERCEL_TOKEN` | Token de API da Vercel |
| `VERCEL_ORG_ID` | ID da organização na Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel |
| `CLERK_SECRET_KEY` | Secret key do Clerk (para seed E2E) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key (para build E2E) |

---

## Deploy Manual (Emergência)

Se o CI estiver quebrado e for necessário deploy imediato:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy direto (skip CI)
cd /caminho/do/projeto
vercel --prod
```

⚠️ **Apenas em emergência.** Contorna todos os testes.

---

## Rollback

Na Vercel, o rollback é feito via dashboard:
1. **Deployments** → selecionar deployment anterior
2. **Promote to Production**

Ou via CLI:
```bash
vercel rollback [deployment-url]
```

---

## Banco de Dados (Neon)

### Migrations em Produção
```bash
# Nunca fazer db:push em produção — usar migrate deploy
pnpm --filter database prisma migrate deploy
```

### Branch Strategy (Neon)
- `main` branch → banco de produção
- Feature branches → Neon database branches (ephemeral)
- CI usa banco local em container

### Backup
- Neon faz backup automático diário (configuração nativa)
- Recomendado: configurar backup adicional via `backup.exportAll` tRPC + cron

---

## Domínios e DNS

| Domínio | Ambiente | Configuração |
|---------|----------|-------------|
| `autevo.com.br` | Produção | CNAME → cname.vercel-dns.com |
| `*.vercel.app` | Preview | Automático por branch |

---

## Monitoramento Pós-Deploy

Após cada deploy de produção, verificar:

1. **Sentry** — novos erros nos primeiros 5 min
2. **Vercel Analytics** — Core Web Vitals da nova versão
3. **UptimeRobot** — Status do `/api/trpc/health.ping`
4. **Banco** — Verificar se as migrations rodaram corretamente

---

## Troubleshooting

### Build falha: "Cannot find module @autevo/database"
O `db:generate` precisa rodar antes do build. Verificar `turbo.json`:
```json
"build": { "dependsOn": ["^build", "^db:generate"] }
```

### Deploy falha: TypeScript errors ignorados?
O `next.config.ts` tem `ignoreBuildErrors: true` para TypeScript — o build passa mesmo com erros de TS. Os type errors devem ser capturados no job `type-check` do CI antes de chegar ao deploy.

### E2E falha: "Clerk session invalid"
O seed do E2E usa `CLERK_SECRET_KEY` real. Verificar se o secret está atualizado no GitHub Actions.

### Rate limit no CI
Se a Vercel bloquear deploys por rate limit de API, aumentar o delay entre jobs ou usar `concurrency` no workflow.
