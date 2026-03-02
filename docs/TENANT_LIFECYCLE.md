# 🏢 Autevo — Ciclo de Vida do Tenant

> **Última atualização:** Março 2026

---

## Visão Geral

O ciclo de vida de um tenant cobre desde o cadastro até o eventual cancelamento. Cada transição de status é refletida no banco, no cache Redis, nos metadados Clerk (JWT) e no comportamento do middleware Edge.

---

## Máquina de Estados

```
                    ┌─────────────────────────────────┐
                    │                                 │
         Signup     ▼                                 │
────────► PENDING_ACTIVATION                          │
             │                                        │
             │ [Completa setup + inicia trial]         │
             ▼                                        │
           TRIAL ──────────────────────────────────► CANCELED
             │                                        ▲
             │ [Trial expira + pagamento OK]           │
             ▼                                        │
           ACTIVE ──────────────────────────────────► CANCELED
             │                                        │
             │ [Pagamento falha]                      │
             ▼                                        │
          PAST_DUE ─────────────────────────────────► CANCELED
             │                                        │
             │ [Admin suspende]                        │
             ▼                                        │
          SUSPENDED ─────────────────────────────────┘
```

---

## Estados em Detalhe

### `PENDING_ACTIVATION`
- **Quando:** Imediatamente após o signup
- **Acesso:** Apenas `tenant.updateSetup` é permitido (setup wizard)
- **Middleware:** Redireciona para `/activate`
- **Duração:** Até completar o setup e iniciar o trial

### `TRIAL`
- **Quando:** Após completar o onboarding
- **Duração padrão:** 30 dias
- **Duração founder:** 60 dias
- **Acesso:** Total (todas as features)
- **Expiração:** Middleware verifica `trialEndsAt` no JWT e redireciona para `/trial-expired`

### `ACTIVE`
- **Quando:** Assinatura Stripe ativa com pagamento confirmado
- **Acesso:** Total
- **Manutenção:** Status sincronizado via webhooks Stripe

### `PAST_DUE`
- **Quando:** Fatura do Stripe não paga
- **Acesso:** Middleware redireciona para `/trial-expired`
- **Resolução:** Webhook `invoice.payment_succeeded` restaura para `ACTIVE`

### `SUSPENDED`
- **Quando:** Admin do SaaS suspende manualmente
- **Acesso:** Middleware redireciona para `/trial-expired`
- **tRPC:** `tenantMiddleware` retorna `FORBIDDEN`

### `CANCELED`
- **Quando:** Assinatura cancelada (período pago esgotado ou cancelamento imediato)
- **Acesso:** Middleware redireciona para `/trial-expired`
- **Dados:** Mantidos no banco (não deletados)

---

## Processo de Onboarding

### Setup Wizard (3 etapas)

**Página:** `/setup`

**Etapa 1 — Dados do Negócio:**
- Nome do estabelecimento
- Telefone
- Cidade/UF
- Tipo de negócio (estética, oficina mecânica, etc.)

**Etapa 2 — Configurações Operacionais:**
- Capacidade máxima diária
- Horários de funcionamento
- Serviços principais
- Aceite dos Termos de Serviço (registra IP + versão)

**Etapa 3 — Personalização:**
- Logo
- Cor primária e secundária (aplicadas via `TenantThemeProvider`)

Após completar, o tenant transita para `TRIAL`.

### Tutorial In-App
`TutorialProvider` + `TutorialOverlay` exibem tooltips e destaques (spotlight) nas funcionalidades principais na primeira visita. O progresso é salvo no estado local.

---

## Sincronização de Metadados Clerk

Os dados do tenant nos metadados Clerk (`public_metadata`) são a "cache quente" que o Edge Middleware usa sem DB lookup:

```typescript
// JWT public_metadata
{
    tenantStatus: TenantStatus,
    trialEndsAt: string,       // ISO date string
    isFoundingMember: boolean,
    role: UserRole,
    tosVersion: string,
}
```

**Quando é atualizado:**
1. Setup wizard completa → Clerk metadata sincronizado
2. Webhook Stripe recebido → Redis cache invalidado → próxima request re-sincroniza
3. Webhook Clerk recebido → User metadata atualizado
4. ADMIN_SAAS muda status manualmente → invalida cache + re-sincroniza

**Latência de propagação:** Os metadados do JWT têm TTL de sessão do Clerk. Em casos críticos (ex: suspensão), a invalidação do cache Redis garante que o `tenantMiddleware` (que consulta DB) bloqueia imediatamente, mesmo que o JWT ainda carregue `ACTIVE`.

---

## Convite de Membros

O OWNER pode convidar funcionários via `/dashboard/users/invite`.

**Fluxo:**
```
1. OWNER preenche email + role
2. user.invite mutation → cria User com status INVITED
3. Email de convite enviado via Clerk
4. Novo usuário aceita → Clerk cria conta → webhook user.created
5. User.status = ACTIVE, User.clerkId preenchido
```

**Controle de acesso ao aceitar:**
- Novo usuário não pode criar seu próprio tenant (rota de signup bloqueada se já tem convite)
- Se não tem convite pendente → `/awaiting-invite`

---

## ToS (Termos de Serviço)

**Versão atual:** `v1.0` (definida em `middleware.ts`)

**Re-aceite obrigatório:** Quando `CURRENT_TOS_VERSION` é atualizado, todo OWNER que loga é redirecionado para `/setup?reaccept=true` antes de acessar o dashboard.

**Campos registrados:**
```
Tenant.tosAcceptedAt     → data/hora do aceite
Tenant.tosAcceptedByIp   → IP do usuário
Tenant.tosVersion        → versão aceita (ex: "v1.0")
```

---

## Soft Delete de Usuários

Usuários não são deletados permanentemente. São desativados:
```
User.isActive = false
User.status = INACTIVE
```

Mas suas OS, comissões e audit logs são preservados.

---

## Dados de Branding

`TenantThemeProvider` injeta as cores do tenant via CSS variables em toda a aplicação:

```css
:root {
    --primary: {tenant.primaryColor};
    --secondary: {tenant.secondaryColor};
}
```

Isso permite que cada tenant veja o sistema com suas próprias cores.

---

## Checklist de Setup Completo

Para um tenant estar operacional, deve ter:

- [ ] Nome e dados básicos preenchidos
- [ ] Pelo menos 1 serviço cadastrado
- [ ] Pelo menos 1 usuário ativo (além do OWNER)
- [ ] Horários de funcionamento configurados
- [ ] ToS aceitos
- [ ] Assinatura ativa (após trial)
- [ ] (Opcional) Chave PIX configurada para recebimentos
- [ ] (Opcional) Template de contrato personalizado
