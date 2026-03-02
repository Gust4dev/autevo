# 💰 Autevo — Billing, Assinaturas e Parcerias

> **Provider:** Stripe
> **Moeda:** BRL (Real Brasileiro)
> **Última atualização:** Março 2026

---

## Planos e Preços

| Plano | Preço/mês | Público |
|-------|-----------|---------|
| Standard | R$ 190,00 | Clientes regulares |
| Founder | R$ 140,00 | Primeiros 15 membros fundadores |
| Founder Trial | R$ 97,00 | Preço especial no período trial dos founders |
| Custom/Enterprise | Negociado | Contratos especiais |

---

## Programa Membro Fundador

### Regras
- **Vagas:** 15 slots totais, controlados pelo modelo `FounderSlot`
- **Trial:** 60 dias grátis (vs 30 dias padrão)
- **Preço:** R$ 97/mês durante o trial, R$ 140/mês após
- **Benefícios:** Preço travado enquanto o plano for mantido ativo

### Fluxo
```
Signup + vagas disponíveis → isFoundingMember = true
→ Trial de 60 dias
→ Expiração → tela de upgrade para Stripe
→ Checkout Stripe com price_id founder
→ Webhook customer.subscription.completed → Subscription.isFounder = true
→ Fatura mensal em R$ 140
```

### Verificação no Middleware
```typescript
// O JWT carrega isFoundingMember para verificação edge-compatible
if (!isFoundingMember && trialEndsAt && new Date(trialEndsAt) < new Date()) {
    return redirect('/trial-expired');
}
```

---

## Machine State de Assinatura

```
Signup
    │
    ▼
PENDING_ACTIVATION (Tenant) + INCOMPLETE (Subscription)
    │
    │ [Stripe checkout completed]
    ▼
TRIAL (Tenant) + TRIALING (Subscription)
    │
    ├─ [Trial expira + pagamento confirmado] ──► ACTIVE
    │
    ├─ [Pagamento falha] ─────────────────────► PAST_DUE
    │
    └─ [Cancelamento] ────────────────────────► CANCELED
```

**Sincronização Stripe ↔ DB:**
O webhook `/api/webhooks/stripe` sincroniza o status da `Subscription` no DB e invalida o cache Redis do tenant. O Clerk `public_metadata` é atualizado via sync para refletir o novo status no JWT.

---

## Webhooks Stripe

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Cria/ativa Subscription, define trial, atualiza Tenant.status |
| `invoice.payment_succeeded` | Renova `currentPeriodEnd`, cria `SubscriptionPayment` |
| `invoice.payment_failed` | Marca Subscription.status = PAST_DUE, Tenant.status = PAST_DUE |
| `customer.subscription.deleted` | Cancela Subscription e Tenant |
| `customer.subscription.updated` | Sync completo dos dados da assinatura |

Todos os webhooks são:
1. Validados com `STRIPE_WEBHOOK_SECRET`
2. Logados em `WebhookLog` (payload + status)
3. Idempotentes (processamento por `externalId` único)

---

## Promo Codes (Descontos de Indicação)

### Estrutura
```
PromoCode {
    code: "FILMTECH15"          → código único
    discountPercent: 15         → 15% de desconto
    monthlyDuration: 1          → 1 mês para plano mensal
    yearlyDuration: 3           → 3 meses para plano anual
    maxUses: null               → ilimitado (ou valor fixo)
    referrerTenantId: "..."     → tenant que criou
}
```

### Aplicação no Checkout
1. Cliente aplica código no checkout Stripe
2. `/api/stripe/validate-promo-code` valida o código
3. Stripe aplica o desconto via coupon
4. Webhook `checkout.session.completed` registra `promoCodeId` na Subscription
5. `promoMonthsRemaining` é decrementado mensalmente

### Criação de Promo Codes
Os promo codes são criados pelo ADMIN_SAAS para distribuidores/parceiros. O campo `referrerTenantId` vincula o código ao tenant parceiro para rastreamento de indicações.

---

## Programa de Parceria (Referral)

### Modelo de Negócio
```
Parceiro indica → Novo cliente usa código no signup
→ Novo cliente paga primeiro mês
→ 1 mês depois: comissão começa

Comissão: 30% de R$ 140 = R$ 42/mês por indicado ativo

5+ indicados ativos = mensalidade grátis (R$ 140/mês economizado)
```

### Fluxo Completo
```
1. Tenant parceiro cria partnerCode (ex: "FILMTECH")
2. Compartilha o código com prospects
3. Novo tenant usa o código no signup
4. PartnerReferral criado com status PENDING
5. Indicado paga o primeiro mês → status = ACTIVE, firstPaymentAt = now
6. 30 dias depois → commissionStartsAt = firstPaymentAt + 30d
7. A partir daí, comissão mensal de R$ 42 para o parceiro
```

### Modelos de Dados
```
PartnerReferral
    partnerTenantId   → quem indicou
    referredTenantId  → quem foi indicado
    status            → PENDING | ACTIVE | CHURNED
    firstPaymentAt    → data do 1º pagamento
    commissionStartsAt → quando comissão começa (1 mês depois)

PartnerCommission
    amount            → R$ 42 (30% × R$ 140)
    periodStart       → início do mês
    periodEnd         → fim do mês
    status            → PENDING | PAID | CANCELLED
    pixTransactionId  → referência do PIX de pagamento
```

### Limiar de Mensalidade Grátis
```typescript
const FREE_TIER_THRESHOLD = 5;
// 5+ indicados ACTIVE e ELEGÍVEIS → mensalidade grátis para o parceiro
```

### Stats do Parceiro (dashboard)
Via `partnership.getPartnerStats`, o tenant vê:
- `monthlyRevenue` — receita mensal estimada de comissões
- `annualRevenue` — receita anual estimada
- `hasFreeTier` — se tem mensalidade grátis
- `annualSavings` — economia com mensalidade grátis

---

## Portal de Billing (Stripe Customer Portal)

O tenant pode gerenciar sua assinatura via `/api/stripe/create-portal-session`:
- Ver histórico de faturas
- Atualizar método de pagamento
- Cancelar assinatura

O cancelamento usa `cancelAtPeriodEnd = true` — o tenant mantém acesso até o fim do período pago.

---

## Preço Customizado (Enterprise)

Para contratos negociados diretamente:
1. Admin define `Subscription.customMonthlyPrice` via `admin.setCustomPrice`
2. O valor substitui o padrão nas próximas faturas
3. `Tenant.customMonthlyPrice` espelha o valor para referência rápida

---

## Tela de Cancelamento

Antes de cancelar, o sistema mostra ao cliente os dados que serão perdidos:

```typescript
// billing.getCancellationStats
{
    orders: 247,     // total de OS
    customers: 89,   // total de clientes
    photos: 1.204,   // fotos de vistorias
    vehicles: 134    // veículos cadastrados
}
```

---

## Preços no SystemConfig

O preço padrão pode ser ajustado pelo admin sem deploy:

```
SystemConfig {
    key: "pro_monthly_price"
    value: "190"   → R$ 190/mês
    type: "number"
}
```

O `adminRouter.getDashboardStats` lê este valor para cálculo de MRR.
