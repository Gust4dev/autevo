# 🗄️ Autevo — Referência do Banco de Dados

> **Provider:** PostgreSQL 16 (Neon serverless)
> **ORM:** Prisma 6
> **Última migração:** `20260220000000_add_inspection_item_photos`

---

## Enums

### `TenantStatus`
```
PENDING_ACTIVATION → tenant criado, aguardando ativação/pagamento
TRIAL              → em período de avaliação (30 dias padrão, 60 para founders)
ACTIVE             → assinatura ativa
SUSPENDED          → suspensão por inadimplência ou administrativa
PAST_DUE           → pagamento atrasado
CANCELED           → assinatura cancelada
```

### `UserRole`
```
ADMIN_SAAS → administrador global do SaaS (acesso irrestrito)
OWNER      → dono do tenant (acesso total ao seu tenant)
MANAGER    → gerente (acesso financeiro e operacional)
MEMBER     → membro (acesso operacional, dados filtrados por assignedTo)
```

### `UserStatus`
```
ACTIVE   → usuário ativo
INVITED  → convite enviado, ainda não aceitou
INACTIVE → desativado
```

### `OrderStatus`
```
AGENDADO             → OS criada e agendada
AGUARDANDO_APROVACAO → aguardando aprovação do cliente (requireApproval=true)
EM_VISTORIA          → vistoria de entrada em andamento
EM_EXECUCAO          → serviço sendo executado
AGUARDANDO_PAGAMENTO → serviço concluído, aguardando pagamento
CONCLUIDO            → OS encerrada com pagamento
CANCELADO            → OS cancelada
```

**Transições válidas:**
```
AGENDADO             → EM_VISTORIA, CANCELADO
EM_VISTORIA          → EM_EXECUCAO, CANCELADO
EM_EXECUCAO          → AGUARDANDO_PAGAMENTO, CANCELADO
AGUARDANDO_PAGAMENTO → CONCLUIDO, CANCELADO
CONCLUIDO            → CANCELADO
CANCELADO            → AGENDADO  (reabertura)
```

### `PaymentMethod`
```
PIX | CARTAO_CREDITO | CARTAO_DEBITO | DINHEIRO | TRANSFERENCIA
```

### `MovementType` (Estoque)
```
ENTRADA   → entrada de produto no estoque
SAIDA_OS  → saída vinculada a uma OS
AJUSTE    → ajuste manual
```

### `NotificationType`
```
AGENDAMENTO_CONFIRMADO | VISTORIA_LINK | SERVICO_CONCLUIDO | LEMBRETE_RETORNO
```

### `SubscriptionStatus`
```
ACTIVE | PAST_DUE | CANCELED | TRIALING | INCOMPLETE
```

### `PartnerReferralStatus`
```
PENDING  → indicado ainda não realizou primeiro pagamento
ACTIVE   → indicado ativo e pagando
CHURNED  → indicado cancelou
```

### `PartnerCommissionStatus`
```
PENDING   → aguardando pagamento ao parceiro
PAID      → pago via PIX
CANCELLED → cancelado (ex: churn do indicado)
```

---

## Modelos

### `Tenant`
Entidade central. Cada tenant é um negócio independente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `name` | String | Nome do estabelecimento |
| `slug` | String (unique) | Identificador URL-friendly |
| `logo` | String? | URL do logo |
| `primaryColor` | String | Cor principal (#DC2626 default) |
| `secondaryColor` | String | Cor secundária (#1F2937 default) |
| `status` | TenantStatus | Estado atual |
| `plan` | String | Plano (pro_monthly, ADMIN) |
| `trialStartedAt` | DateTime? | Início do trial |
| `trialEndsAt` | DateTime? | Fim do trial |
| `isFoundingMember` | Boolean | Membro fundador (preço R$ 97/mês → R$ 140/mês) |
| `customMonthlyPrice` | Decimal? | Preço negociado (override) |
| `stripeCustomerId` | String? | ID do cliente no Stripe |
| `phone` | String? | Telefone do negócio |
| `email` | String? | Email do negócio |
| `cnpj` | String? | CNPJ |
| `pixKey` | String? | Chave PIX para recebimento |
| `paymentTerms` | Text? | Termos de pagamento (texto do contrato) |
| `contractTemplate` | Text? | Template de contrato customizado |
| `maxDailyCapacity` | Int | Capacidade máxima diária (default: 10) |
| `businessHours` | Text? | JSON com horários de funcionamento |
| `inspectionRequired` | String | NONE / ENTRY / EXIT / BOTH |
| `inspectionSignature` | Boolean | Exige assinatura nas vistorias |
| `requireApproval` | Boolean | Exige aprovação do cliente antes de executar |
| `showWallet` | Boolean | Exibe carteira de créditos |
| `tosAcceptedAt` | DateTime? | Data de aceite dos ToS |
| `tosAcceptedByIp` | String? | IP do aceite |
| `tosVersion` | String? | Versão dos ToS aceita |
| `customerInactivityDays` | Int | Dias sem serviço para considerar inativo (default: 30) |
| `inactivityReminderEnabled` | Boolean | Habilita lembrete automático de inatividade |
| `partnerCode` | String? (unique) | Código de parceiro para indicações |
| `referredByTenantId` | String? | Quem indicou este tenant |

---

### `User`
Funcionário/membro do tenant. Vinculado ao Clerk via `clerkId`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clerkId` | String? (unique) | ID do usuário no Clerk |
| `email` | String | Email |
| `name` | String | Nome completo |
| `role` | UserRole | ADMIN_SAAS, OWNER, MANAGER, MEMBER |
| `status` | UserStatus | ACTIVE, INVITED, INACTIVE |
| `avatarUrl` | String? | URL do avatar |
| `phone` | String? | Telefone |
| `jobTitle` | String? | Cargo (ex: "Detailer Sênior") |
| `salary` | Decimal? | Salário fixo mensal |
| `admissionDate` | DateTime? | Data de admissão |
| `pixKey` | String? | PIX para receber comissões |
| `defaultCommissionPercent` | Decimal | % padrão de comissão (default: 0) |
| `tenantId` | String | FK → Tenant |

**Índices:** `[tenantId]`, `[clerkId]`, `[email]`

---

### `Customer`
Cliente do estabelecimento (não confundir com usuário/funcionário).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `name` | String | Nome |
| `phone` | String | Telefone (usado para WhatsApp) |
| `email` | String? | Email |
| `document` | String? | CPF |
| `birthDate` | DateTime? | Data de nascimento (para parabéns) |
| `instagram` | String? | @ do Instagram |
| `notes` | String? | Observações internas |
| `whatsappOptIn` | Boolean | Aceita receber WhatsApp (default: true) |
| `tenantId` | String | FK → Tenant |
| `deletedAt` | DateTime? | Soft delete |
| `lastReminderSentAt` | DateTime? | Último lembrete de inatividade enviado |

**Índices:** `[tenantId, phone]`, `[tenantId, name]`, `[tenantId, email]`, `[tenantId, deletedAt]`

---

### `Vehicle`
Veículo do cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `plate` | String | Placa |
| `brand` | String | Marca (ex: Toyota) |
| `model` | String | Modelo (ex: Corolla) |
| `color` | String | Cor |
| `year` | Int? | Ano |
| `customerId` | String? | FK → Customer (opcional) |
| `tenantId` | String | FK → Tenant |
| `deletedAt` | DateTime? | Soft delete |

**Unique:** `[tenantId, plate]` — mesma placa não pode existir duas vezes no tenant

---

### `Service`
Catálogo de serviços do tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `name` | String | Nome do serviço |
| `description` | String? | Descrição |
| `basePrice` | Decimal | Preço base |
| `estimatedTime` | Int? | Tempo estimado em minutos |
| `returnDays` | Int? | Dias sugeridos para retorno |
| `isActive` | Boolean | Serviço disponível para novas OS |
| `defaultCommissionPercent` | Decimal? | % de comissão padrão |
| `defaultCommissionFixed` | Decimal? | Comissão fixa em R$ |
| `tenantId` | String | FK → Tenant |

---

### `Product`
Produto/insumo do catálogo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `name` | String | Nome |
| `sku` | String? | Código de referência |
| `unit` | String | Unidade (un, ml, L, kg) |
| `costPrice` | Decimal? | Preço de custo |
| `salePrice` | Decimal? | Preço de venda |
| `stock` | Int | Estoque atual |
| `minStock` | Int | Estoque mínimo (alerta) |
| `tenantId` | String | FK → Tenant |

---

### `ServiceOrder` (OS)
Coração do sistema. Representa uma Ordem de Serviço.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `code` | String | Código sequencial por tenant (ex: OS-001) |
| `status` | OrderStatus | Estado atual da OS |
| `version` | Int | Versão para optimistic locking |
| `scheduledAt` | DateTime | Data/hora agendada |
| `startedAt` | DateTime? | Início da execução |
| `completedAt` | DateTime? | Data de conclusão |
| `vehicleId` | String | FK → Vehicle |
| `assignedToId` | String | FK → User (técnico responsável) |
| `createdById` | String | FK → User (quem criou) |
| `customerId` | String? | FK → Customer |
| `tenantId` | String | FK → Tenant |
| `subtotal` | Decimal | Subtotal antes do desconto |
| `discountType` | DiscountType? | PERCENTAGE ou FIXED |
| `discountValue` | Decimal? | Valor/percentual do desconto |
| `total` | Decimal | Total final |
| `totalCommission` | Decimal | Total de comissões da OS |
| `inventoryDeducted` | Boolean | Estoque já foi baixado |
| `pdfUrl` | String? | URL do PDF da OS |
| `approvalToken` | String? (unique) | Token para aprovação pública |
| `approvalTokenExpiry` | DateTime? | Expiração do token |
| `approvedAt` | DateTime? | Data de aprovação pelo cliente |
| `rejectedAt` | DateTime? | Data de rejeição |
| `termsAcceptedAt` | DateTime? | Aceite dos termos |

**Índices:** `[tenantId, status]`, `[tenantId, scheduledAt]`, `[tenantId, assignedToId]`, `[code]`

---

### `OrderItem`
Item de serviço dentro de uma OS.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `serviceId` | String? | FK → Service (null = serviço avulso) |
| `customName` | String? | Nome avulso quando serviceId = null |
| `price` | Decimal | Preço cobrado |
| `quantity` | Int | Quantidade |
| `technicianId` | String? | FK → User (técnico do item) |

---

### `OrderProduct`
Produto utilizado em uma OS (com snapshot do custo).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `productId` | String? | FK → Product (null = produto avulso) |
| `customName` | String? | Nome quando productId = null |
| `costPrice` | Decimal? | Snapshot do custo no momento da OS |
| `quantity` | Int | Quantidade utilizada |

---

### `OrderItemCommission`
Comissão calculada por item de serviço.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `orderItemId` | String | FK → OrderItem |
| `userId` | String | FK → User (quem recebe) |
| `commissionValue` | Decimal | Valor em R$ |
| `status` | String | ACTIVE, CANCELLED, REVERSED |
| `settlementId` | String? | FK → CommissionSettlement (quando pago) |

---

### `CommissionSettlement`
Registro de pagamento de comissões para um funcionário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | String | Funcionário |
| `periodStart` | DateTime | Início do período |
| `periodEnd` | DateTime | Fim do período |
| `totalPaid` | Decimal | Total pago |
| `paymentMethod` | String? | Como foi pago |
| `paymentRef` | String? | Referência do pagamento |

---

### `Inspection`
Vistoria vinculada a uma OS. Máximo 3 por OS (entrada, intermediaria, final).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `orderId` | String | FK → ServiceOrder |
| `type` | String | entrada / intermediaria / final |
| `status` | String | em_andamento / concluida |
| `version` | Int | Versão para conflitos de sync |
| `checklistData` | Json | Dados do checklist (legado) |
| `signatureUrl` | String? | URL da assinatura digital |
| `signedAt` | DateTime? | Data da assinatura |
| `signedVia` | String? | digital_canvas / public_tracking |
| `lastSyncedAt` | DateTime? | Último sync offline |
| `pendingSync` | Boolean | Tem dados offline pendentes |
| `finalVideoUrl` | String? | URL do vídeo (vistoria final) |
| `sourceInspectionId` | String? | ID da vistoria de entrada (clonada na final) |

**Unique:** `[orderId, type]` — apenas uma vistoria de cada tipo por OS

---

### `InspectionItem`
Item individual do checklist de vistoria.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `category` | String | exterior / rodas / detalhes / items_pessoais |
| `itemKey` | String | Chave única (frente, traseira, roda_de...) |
| `label` | String | Label display |
| `isRequired` | Boolean | Item obrigatório para concluir vistoria |
| `isCritical` | Boolean | Exibe alerta vermelho |
| `photoUrl` | String? | URL da primeira foto (compat legado) |
| `photos` | String[] | Array de todas as URLs de fotos |
| `status` | String | pendente / ok / com_avaria |
| `damageType` | String? | arranhao / amassado / trinca / mancha / risco / pintura / outro |
| `severity` | String? | leve / moderado / grave |

**Unique:** `[inspectionId, itemKey]`

---

### `InspectionDamage`
Registro de avaria livre (não vinculado ao checklist).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `position` | String | Parte do carro afetada |
| `damageType` | String | Tipo da avaria |
| `photoUrl` | String? | Foto da avaria |
| `notes` | String? | Observações |

---

### `Payment`
Pagamento realizado na OS (pode ser parcial).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `orderId` | String | FK → ServiceOrder |
| `method` | PaymentMethod | Método de pagamento |
| `amount` | Decimal | Valor recebido |
| `paidAt` | DateTime | Data/hora do recebimento |
| `receivedBy` | String | Nome de quem recebeu |
| `notes` | String? | Observações |

---

### `Subscription`
Assinatura Stripe do tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tenantId` | String (unique) | FK → Tenant |
| `stripeCustomerId` | String (unique) | ID no Stripe |
| `stripeSubscriptionId` | String? (unique) | ID da assinatura |
| `status` | SubscriptionStatus | Estado atual |
| `billingInterval` | BillingInterval | MONTHLY / YEARLY |
| `currentPeriodStart` | DateTime? | Início do período atual |
| `currentPeriodEnd` | DateTime? | Fim do período atual |
| `cancelAtPeriodEnd` | Boolean | Cancela ao fim do período |
| `customMonthlyPrice` | Decimal? | Preço customizado (enterprise) |
| `isFounder` | Boolean | É membro fundador |
| `founderExpiresAt` | DateTime? | Quando o preço founder expira |
| `promoCodeId` | String? | Promo code usado no signup |
| `promoMonthsRemaining` | Int | Meses restantes de desconto |

---

### `PromoCode`
Código promocional para desconto na assinatura.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `code` | String (unique) | Código (ex: FILMTECH15) |
| `referrerTenantId` | String? | Tenant que criou o código |
| `discountPercent` | Int | Desconto em % (default: 15) |
| `monthlyDuration` | Int | Meses de desconto para plano mensal (default: 1) |
| `yearlyDuration` | Int | Meses de desconto para plano anual (default: 3) |
| `maxUses` | Int? | Limite de usos (null = ilimitado) |
| `usedCount` | Int | Quantas vezes foi usado |
| `expiresAt` | DateTime? | Expiração do código |

---

### `FounderSlot`
Controle global de vagas para Membros Fundadores.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `totalSlots` | Int | Total de vagas (default: 15) |
| `usedSlots` | Int | Vagas ocupadas |

---

### `PartnerReferral`
Rastreamento de indicação entre parceiros.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `partnerTenantId` | String | Quem indicou |
| `referredTenantId` | String | Quem foi indicado |
| `status` | PartnerReferralStatus | PENDING / ACTIVE / CHURNED |
| `firstPaymentAt` | DateTime? | Primeiro pagamento do indicado |
| `commissionStartsAt` | DateTime? | Quando começa a gerar comissão (1 mês após firstPaymentAt) |

**Unique:** `[partnerTenantId, referredTenantId]`

---

### `PartnerCommission`
Histórico de comissões geradas ao parceiro.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tenantId` | String | Parceiro que recebe |
| `referralId` | String | FK → PartnerReferral |
| `amount` | Decimal | R$ 42 (30% de R$ 140) |
| `periodStart` | DateTime | Início do período |
| `periodEnd` | DateTime | Fim do período |
| `status` | PartnerCommissionStatus | PENDING / PAID / CANCELLED |
| `paidAt` | DateTime? | Data do pagamento |
| `pixTransactionId` | String? | ID da transação PIX |

---

### `AuditLog`
Trail de auditoria de todas as ações críticas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tenantId` | String | Tenant do evento |
| `userId` | String? | Quem executou |
| `action` | String | Nome da ação (ex: ORDER_STATUS_CHANGED) |
| `entityType` | String | Tipo da entidade (Order, Customer...) |
| `entityId` | String? | ID da entidade |
| `oldValue` | Json? | Estado anterior |
| `newValue` | Json? | Novo estado |
| `ipAddress` | String? | IP da requisição |
| `userAgent` | String? | User-Agent |

---

### `SystemConfig`
Configurações globais do SaaS (admin only).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `key` | String (unique) | Chave da configuração |
| `value` | String | Valor |
| `label` | String | Label legível |
| `type` | String | string / number / boolean / json |

Exemplos de chaves: `pro_monthly_price`, `trial_days_founder`

---

### `WebhookLog`
Log de webhooks recebidos para debug e retry.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `source` | String | stripe / clerk |
| `event` | String | Nome do evento |
| `externalId` | String (unique) | ID externo do evento |
| `status` | String | pending / success / failed |
| `payload` | Json | Payload completo |
| `errorMessage` | String? | Erro se falhou |
| `attempts` | Int | Tentativas de processamento |

---

### `TenantSequence`
Sequenciamento de códigos de OS por tenant (garante atomicidade).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tenantId` | String (unique) | FK → Tenant |
| `prefix` | String | Prefixo (default: "OS") |
| `currentValue` | Int | Próximo número (incrementado atomicamente) |

---

### `PushSubscription`
Assinatura de push notification (Web Push API).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | String | FK → User |
| `endpoint` | String (unique) | Endpoint do browser |
| `p256dh` | String | Chave pública ECDH |
| `auth` | String | Auth secret |

---

## Relações Principais

```
Tenant
  ├── User[] (1:N)
  ├── Customer[] (1:N)
  │     └── Vehicle[] (1:N)
  ├── Service[] (1:N)
  ├── Product[] (1:N)
  ├── ServiceOrder[] (1:N)
  │     ├── OrderItem[] (1:N)
  │     │     └── OrderItemCommission[] (1:N)
  │     ├── OrderProduct[] (1:N)
  │     ├── Inspection[] (1:3)
  │     │     ├── InspectionItem[] (1:N)
  │     │     └── InspectionDamage[] (1:N)
  │     └── Payment[] (1:N)
  └── Subscription (1:1)
        └── SubscriptionPayment[] (1:N)
```

---

## Migrations

| Migração | Data | Descrição |
|----------|------|-----------|
| `20260120190243_init` | 20/01/2026 | Schema inicial completo |
| `20260220000000_add_inspection_item_photos` | 20/02/2026 | Campo `photos` (array) em InspectionItem |

---

## Convenções

- **IDs:** todos usam `cuid()` — collision-resistant, URL-safe
- **Decimais monetários:** `@db.Decimal(10, 2)` — nunca float para dinheiro
- **Soft delete:** Customer e Vehicle usam `deletedAt` em vez de delete real
- **Timestamps:** todos os modelos têm `createdAt @default(now())` e `updatedAt @updatedAt` onde aplicável
- **Tenant isolation:** toda tabela de dados tem `tenantId` FK + cascade delete
