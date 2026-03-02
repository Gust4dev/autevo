# ⚙️ Autevo — Variáveis de Ambiente

> Copie `apps/web/.env.example` para `apps/web/.env.local` e preencha os valores.
> As variáveis marcadas com ⭐ são **obrigatórias** para o sistema funcionar.

---

## Aplicação

| Variável | Obrig. | Exemplo | Descrição |
|----------|--------|---------|-----------|
| `NEXT_PUBLIC_APP_URL` | ⭐ | `https://autevo.com.br` | URL pública da aplicação (SEO, OpenGraph, links de tracking) |

---

## Banco de Dados

| Variável | Obrig. | Exemplo | Descrição |
|----------|--------|---------|-----------|
| `DATABASE_URL` | ⭐ | `postgresql://user:pass@host/db` | Connection string PostgreSQL. Em produção, usar Neon com connection pooling |

**Dica Neon:** Use a URL com pooling (`?pgbouncer=true`) para ambientes serverless. A URL sem pooling é necessária para migrations (`prisma migrate`).

---

## Autenticação (Clerk)

Obtenha em: https://dashboard.clerk.com

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ⭐ | Chave pública do Clerk (prefixo `pk_`) — usada no client-side |
| `CLERK_SECRET_KEY` | ⭐ | Chave secreta do Clerk (prefixo `sk_`) — usada no server-side |
| `CLERK_WEBHOOK_SECRET` | ⭐ | Secret para validar webhooks do Clerk (prefixo `whsec_`) |

---

## Storage de Arquivos (S3-Compatible)

Compatível com AWS S3, Supabase Storage, Cloudflare R2.

| Variável | Obrig. | Exemplo | Descrição |
|----------|--------|---------|-----------|
| `AWS_ACCESS_KEY_ID` | ⭐ | `AKIA...` | Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | ⭐ | `...` | Secret Access Key |
| `AWS_REGION` | ⭐ | `us-east-1` | Região do bucket |
| `AWS_BUCKET_NAME` | ⭐ | `autevo-uploads` | Nome do bucket |
| `AWS_ENDPOINT` | ⭐ | `https://xxx.supabase.co/storage/v1/s3` | Endpoint S3-compatible |

**Supabase Storage:**
```
AWS_ENDPOINT=https://{projeto}.supabase.co/storage/v1/s3
AWS_REGION=us-east-1  (qualquer valor)
AWS_ACCESS_KEY_ID={service_role_key}
```

**Cloudflare R2:**
```
AWS_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
AWS_REGION=auto
```

---

## Rate Limiting (Upstash Redis)

Obtenha em: https://console.upstash.com

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `UPSTASH_REDIS_REST_URL` | ⭐ | URL REST da instância Redis |
| `UPSTASH_REDIS_REST_TOKEN` | ⭐ | Token de autenticação REST |

Se não configurado, o rate limiting é desabilitado silenciosamente (fallback seguro).

---

## Pagamentos (Stripe)

Obtenha em: https://dashboard.stripe.com

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `STRIPE_SECRET_KEY` | ⭐ | Secret key do Stripe (prefixo `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | ⭐ | Secret para validar webhooks do Stripe (prefixo `whsec_`) |
| `STRIPE_PRICE_ID_STANDARD` | ⭐ | Price ID do plano padrão (R$ 190/mês) |
| `STRIPE_PRICE_ID_FOUNDER` | ⭐ | Price ID do plano founder (R$ 140/mês) |

---

## Segurança

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `ENCRYPTION_KEY` | ⭐ | Chave de criptografia AES-256. Mínimo 32 caracteres. Nunca mude após dados estarem criptografados em produção |
| `ENCRYPTION_SALT` | ⭐ | Salt para derivação de chave. Mínimo 16 caracteres |

**Geração segura:**
```bash
# ENCRYPTION_KEY (32 bytes em hex = 64 chars)
openssl rand -hex 32

# ENCRYPTION_SALT (16 bytes em hex = 32 chars)
openssl rand -hex 16
```

---

## Jobs Agendados (Crons)

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `CRON_SECRET` | ⭐ | Secret para autenticar chamadas de cron da Vercel |

**Geração:**
```bash
openssl rand -hex 32
```

Os crons da Vercel enviam: `Authorization: Bearer {CRON_SECRET}`

---

## PWA Push Notifications

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_PWA_PUBLIC_KEY` | ⭐ | Chave pública VAPID para Web Push |
| `NEXT_PUBLIC_PWA_PRIVATE_KEY` |  | Chave privada VAPID (server-side) |

**Geração:**
```bash
node apps/web/scripts/generate-vapid.js
```

---

## Monitoramento (Sentry)

Opcional, mas recomendado para produção.

| Variável | Obrig. | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_SENTRY_DSN` |  | DSN do projeto no Sentry |
| `SENTRY_AUTH_TOKEN` |  | Token para upload de source maps no build |

Configurado em `apps/web/.env.sentry-build-plugin`.

---

## Exemplos de Configuração

### Desenvolvimento Local (Docker)
```env
DATABASE_URL="postgresql://filmtech:filmtech123@localhost:5433/filmtech"
# Sem Stripe, sem Sentry, sem Upstash — usa fallbacks
```

### Teste (CI)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_Y2xl..."
CLERK_SECRET_KEY="sk_test_51Mz..."
CLERK_WEBHOOK_SECRET="whsec_placeholder"
UPSTASH_REDIS_REST_URL="https://placeholder.upstash.io"
UPSTASH_REDIS_REST_TOKEN="placeholder"
ENCRYPTION_KEY="placeholder-key-for-ci-build"
STRIPE_SECRET_KEY="sk_test_placeholder"
STRIPE_WEBHOOK_SECRET="whsec_placeholder"
STRIPE_PRICE_ID_STANDARD="price_placeholder"
STRIPE_PRICE_ID_FOUNDER="price_placeholder"
CRON_SECRET="placeholder"
```

---

## Variáveis do Turborepo Global

O `turbo.json` declara as seguintes variáveis como `globalEnv` (afetam o cache do build):

```
DATABASE_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET,
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, AWS_ACCESS_KEY_ID,
AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME,
AWS_ENDPOINT, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
ENCRYPTION_KEY, SENTRY_AUTH_TOKEN, STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_STANDARD, STRIPE_PRICE_ID_FOUNDER,
CRON_SECRET, NEXT_PUBLIC_PWA_PUBLIC_KEY, NEXT_PUBLIC_PWA_PRIVATE_KEY
```

Mudanças nessas variáveis invalidam o cache do Turborepo.
