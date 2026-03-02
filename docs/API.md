# 📡 Autevo — Referência da API tRPC

> **Versão:** tRPC v11 com SuperJSON transformer
> **Endpoint:** `POST /api/trpc/[procedure]`
> **Autenticação:** Clerk JWT (via cookie de sessão)

Todas as procedures seguem a notação `{router}.{procedure}`. O tipo `AppRouter` é exportado de `server/routers/_app.ts` e pode ser usado no cliente para full type-safety.

---

## Legenda de Permissões

| Símbolo | Procedure Base | Descrição |
|---------|---------------|-----------|
| 🌐 | `publicProcedure` | Acesso sem autenticação |
| 🔒 | `protectedProcedure` | Autenticado + tenant ACTIVE/TRIAL |
| 📊 | `managerProcedure` | OWNER, MANAGER ou ADMIN_SAAS |
| 👑 | `ownerProcedure` | OWNER ou ADMIN_SAAS |
| 🛡️ | `adminProcedure` | ADMIN_SAAS apenas |
| ⚡ | `protectedProcedureNoRateLimit` | Sem rate limit (vistorias) |

---

## `admin` Router

Painel administrativo do SaaS. Acesso restrito a `ADMIN_SAAS`.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `admin.getDashboardStats` | query | 🛡️ | KPIs globais: total tenants, MRR, tenants por status |
| `admin.getAllTenants` | query | 🛡️ | Lista todos os tenants com paginação e filtros |
| `admin.getTenantById` | query | 🛡️ | Detalhes de um tenant específico |
| `admin.updateTenantStatus` | mutation | 🛡️ | Muda status de um tenant (ACTIVE, SUSPENDED, etc.) |
| `admin.setCustomPrice` | mutation | 🛡️ | Define preço customizado para enterprise |
| `admin.getSystemLogs` | query | 🛡️ | Audit logs globais do sistema |
| `admin.getPerformanceMetrics` | query | 🛡️ | Métricas de performance do sistema |
| `admin.syncAllUsers` | mutation | 🛡️ | Força sincronização de usuários Clerk → DB |

---

## `customer` Router

CRUD de clientes do tenant.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `customer.list` | query | 🔒 | Lista clientes com busca e paginação |
| `customer.getById` | query | 🔒 | Detalhes de um cliente |
| `customer.create` | mutation | 🔒 | Cria novo cliente |
| `customer.update` | mutation | 🔒 | Atualiza dados do cliente |
| `customer.delete` | mutation | 📊 | Soft delete do cliente |
| `customer.getBirthdays` | query | 🔒 | Clientes aniversariantes próximos |
| `customer.getInactive` | query | 📊 | Clientes sem serviço há X dias |

---

## `vehicle` Router

Gerenciamento de veículos.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `vehicle.list` | query | 🔒 | Lista veículos do tenant (com filtros) |
| `vehicle.getById` | query | 🔒 | Detalhes do veículo |
| `vehicle.getByCustomer` | query | 🔒 | Veículos de um cliente |
| `vehicle.create` | mutation | 🔒 | Cria veículo |
| `vehicle.update` | mutation | 🔒 | Atualiza veículo |
| `vehicle.delete` | mutation | 📊 | Soft delete |

---

## `service` Router

Catálogo de serviços.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `service.list` | query | 🔒 | Lista serviços ativos/inativos |
| `service.getById` | query | 🔒 | Detalhes do serviço |
| `service.create` | mutation | 📊 | Cria serviço |
| `service.update` | mutation | 📊 | Atualiza serviço |
| `service.delete` | mutation | 📊 | Desativa serviço |
| `service.getTemplates` | query | 🔒 | Templates de produtos vinculados ao serviço |

---

## `product` Router

Catálogo de produtos e controle de estoque.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `product.list` | query | 🔒 | Lista produtos com estoque |
| `product.getById` | query | 🔒 | Detalhes do produto |
| `product.create` | mutation | 📊 | Cria produto |
| `product.update` | mutation | 📊 | Atualiza produto |
| `product.delete` | mutation | 📊 | Remove produto |
| `product.adjustStock` | mutation | 📊 | Ajuste manual de estoque |
| `product.getMovements` | query | 📊 | Histórico de movimentações |
| `product.getLowStock` | query | 📊 | Produtos abaixo do estoque mínimo |

---

## `order` Router

Motor central das Ordens de Serviço. Router mais complexo do sistema.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `order.list` | query | 🔒 | Lista OS com filtros (status, data, técnico) |
| `order.getById` | query | 🔒 | Detalhes completos da OS |
| `order.getPublicById` | query | 🌐 | OS pública para tracking (sem login) |
| `order.create` | mutation | 🔒 | Cria nova OS |
| `order.update` | mutation | 🔒 | Edita OS (itens, produtos, desconto) |
| `order.updateStatus` | mutation | 🔒 | Avança/retrocede status da OS |
| `order.addPayment` | mutation | 📊 | Registra pagamento na OS |
| `order.removePayment` | mutation | 📊 | Estorna pagamento |
| `order.cancel` | mutation | 📊 | Cancela OS |
| `order.share` | query | 🔒 | Gera link de rastreamento público |
| `order.generateApprovalToken` | mutation | 🔒 | Gera token para aprovação do cliente |
| `order.approveByToken` | mutation | 🌐 | Cliente aprova OS via token público |
| `order.rejectByToken` | mutation | 🌐 | Cliente rejeita OS via token público |

**Regras de negócio críticas:**
- Transições de status são validadas contra `validTransitions` (state machine rígida)
- `CONCLUIDO` → deduz estoque automaticamente (se não deduzido ainda)
- Comissões são calculadas e criadas ao concluir
- Push notification é disparada ao owner/manager em novas OS e conclusões

---

## `inspection` Router

Sistema de vistorias digitais.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `inspection.list` | query | 🔒 | Lista vistorias de uma OS |
| `inspection.getById` | query | 🔒 | Vistoria com itens e avarias |
| `inspection.getByOrderIdAndType` | query | ⚡ | Busca por OS + tipo (sem rate limit) |
| `inspection.create` | mutation | 🔒 | Cria nova vistoria (gera checklist automático) |
| `inspection.updateItem` | mutation | ⚡ | Atualiza item do checklist |
| `inspection.addPhoto` | mutation | ⚡ | Adiciona foto a um item |
| `inspection.removePhoto` | mutation | ⚡ | Remove foto de um item |
| `inspection.updateVideo` | mutation | ⚡ | Define URL do vídeo final |
| `inspection.addDamage` | mutation | ⚡ | Registra avaria livre |
| `inspection.removeDamage` | mutation | ⚡ | Remove avaria |
| `inspection.complete` | mutation | 🔒 | Conclui vistoria (valida todos obrigatórios) |
| `inspection.canCompleteOrder` | query | 🔒 | Verifica se OS pode ser concluída |
| `inspection.saveSignature` | mutation | 🔒 | Salva assinatura digital (staff) |
| `inspection.savePublicSignature` | mutation | 🌐 | Salva assinatura do cliente (verifica phone) |

**Notas:**
- A vistoria `final` é criada como clone da `entrada` (herda fotos e status)
- `savePublicSignature` valida os últimos 8+ dígitos do telefone do cliente
- Items em vistorias `concluida` não podem ser editados

---

## `schedule` Router

Calendário e disponibilidade de agendamentos.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `schedule.getMonthView` | query | 🔒 | OS do mês para visão calendário |
| `schedule.getDayView` | query | 🔒 | OS do dia com horários |
| `schedule.getAvailability` | query | 🌐 | Slots disponíveis (usado no booking público) |
| `schedule.book` | mutation | 🌐 | Cria agendamento público (sem login) |

---

## `dashboard` Router

KPIs e analytics.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `dashboard.getDashboardOverview` | query | 🔒 | Stats principais (hoje, em andamento, receita, pendentes) |
| `dashboard.getFinancialStats` | query | 📊 | Receita, ticket médio, comissões, CMV, lucro |
| `dashboard.getFinancialChartData` | query | 📊 | Receita diária do mês (para gráfico) |
| `dashboard.getTeamFinancials` | query | 📊 | Performance financeira por técnico |
| `dashboard.getFinancialOverview` | query | 📊 | Overview completo com filtro de período |
| `dashboard.getQuickStats` | query | 🔒 | Stats rápidas para header |

**Nota sobre MEMBER:** `getDashboardOverview` filtra por `assignedToId = ctx.user.id` quando o usuário é MEMBER.

---

## `user` Router

Gerenciamento de membros do tenant.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `user.list` | query | 📊 | Lista usuários do tenant |
| `user.getById` | query | 📊 | Detalhes do usuário |
| `user.invite` | mutation | 👑 | Convida novo membro via email |
| `user.updateRole` | mutation | 👑 | Altera role do usuário |
| `user.update` | mutation | 👑 | Atualiza dados (salário, cargo, comissão padrão) |
| `user.deactivate` | mutation | 👑 | Desativa usuário |
| `user.getCommissions` | query | 📊 | Comissões de um funcionário |
| `user.settleCommissions` | mutation | 👑 | Registra pagamento de comissões |

---

## `settings` Router

Configurações do tenant.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `settings.get` | query | 🔒 | Todas as configurações do tenant |
| `settings.update` | mutation | 👑 | Atualiza configurações gerais |
| `settings.updateBranding` | mutation | 👑 | Atualiza logo e cores |
| `settings.updateBusinessHours` | mutation | 👑 | Configura horários de funcionamento |
| `settings.updateInspectionSettings` | mutation | 👑 | Configura exigências de vistoria |
| `settings.getMessageTemplates` | query | 🔒 | Templates de mensagem WhatsApp |
| `settings.updateMessageTemplate` | mutation | 📊 | Edita template de mensagem |
| `settings.getAuditLogs` | query | 👑 | Logs de auditoria do tenant |

---

## `tenant` Router

Setup e gestão do tenant.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `tenant.get` | query | 🔒 | Dados do tenant atual |
| `tenant.updateSetup` | mutation | 👑 | Wizard de setup (funciona em PENDING_ACTIVATION) |
| `tenant.acceptTos` | mutation | 👑 | Aceite dos termos de serviço |
| `tenant.updatePixKey` | mutation | 👑 | Atualiza chave PIX (com criptografia) |

---

## `notification` Router

Push notifications e preferências.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `notification.subscribe` | mutation | 🔒 | Registra subscription de push |
| `notification.unsubscribe` | mutation | 🔒 | Remove subscription |
| `notification.getPreferences` | query | 🔒 | Preferências de notificação |
| `notification.updatePreferences` | mutation | 🔒 | Atualiza preferências |
| `notification.test` | mutation | 🔒 | Dispara notificação de teste |

---

## `report` Router

Exportação de dados e relatórios.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `report.getCustomerReport` | query | 📊 | Relatório de clientes (CSV/Excel) |
| `report.getServiceReport` | query | 📊 | Relatório de serviços |
| `report.getEmployeeReport` | query | 📊 | Performance por funcionário |
| `report.getFinancialReport` | query | 📊 | Relatório financeiro com período |

---

## `backup` Router

Exportação completa de dados do tenant.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `backup.exportAll` | query | 👑 | Exporta todos os dados do tenant em JSON |
| `backup.exportOrders` | query | 👑 | Exporta OS em CSV |
| `backup.exportCustomers` | query | 👑 | Exporta clientes em CSV |

---

## `billing` Router

Assinatura e pagamentos.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `billing.getSubscription` | query | 🔒 | Dados da assinatura atual |
| `billing.getPayments` | query | 🔒 | Histórico de pagamentos da assinatura |
| `billing.getPromoCodeStats` | query | 🔒 | Stats dos promo codes do tenant |
| `billing.getCancellationStats` | query | 🔒 | Dados para tela de cancelamento |

---

## `partnership` Router

Programa de parceria e indicação.

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `partnership.getPartnerStats` | query | 🔒 | Stats gerais do parceiro |
| `partnership.getReferredTenants` | query | 🔒 | Lista de indicados |
| `partnership.getCommissionHistory` | query | 🔒 | Histórico de comissões (paginado) |
| `partnership.generatePartnerCode` | mutation | 🔒 | Cria/atualiza código de parceiro |
| `partnership.validatePartnerCode` | query | 🔒 | Valida código de outro parceiro |
| `partnership.suggestPartnerCode` | query | 🔒 | Sugere código baseado no nome da empresa |

---

## `health` Router

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `health.ping` | query | 🌐 | Healthcheck simples |
| `health.dbCheck` | query | 🌐 | Verifica conectividade com banco |

---

## `benchmark` Router

| Procedure | Tipo | Permissão | Descrição |
|-----------|------|-----------|-----------|
| `benchmark.runAll` | query | 🛡️ | Executa benchmark de queries críticas |
| `benchmark.getHistory` | query | 🛡️ | Histórico de benchmarks |

---

## Route Handlers (REST)

Além do tRPC, existem route handlers específicos:

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/webhooks/clerk` | POST | Webhook do Clerk (eventos de usuário) |
| `/api/webhooks/stripe` | POST | Webhook do Stripe (eventos de assinatura) |
| `/api/stripe/create-checkout-session` | POST | Cria sessão de checkout Stripe |
| `/api/stripe/create-portal-session` | POST | Cria portal de billing Stripe |
| `/api/stripe/cancel-subscription` | POST | Cancela assinatura |
| `/api/stripe/sync-subscription` | POST | Força sync da assinatura |
| `/api/stripe/upgrade-to-founder` | POST | Upgrade para plano founder |
| `/api/stripe/validate-partner-code` | POST | Valida partner code no checkout |
| `/api/stripe/validate-promo-code` | POST | Valida promo code no checkout |
| `/api/upload` | POST | Upload de arquivos (multipart) |
| `/api/pdf` | POST | Geração de PDFs |
| `/api/image-proxy` | GET | Proxy de imagens (CORS) |
| `/api/push/subscribe` | POST | Registra push subscription |
| `/api/push/test` | POST | Teste de push notification |
| `/api/cron/*` | GET | Jobs agendados (ver CRONS.md) |
| `/api/admin/sync-all-users` | POST | Sync forçado de todos os usuários |

---

## Tratamento de Erros

O error formatter do tRPC sanitiza mensagens em produção:

- Erros `INTERNAL_SERVER_ERROR` e `PrismaClientKnownRequestError` retornam mensagem genérica em produção
- `ZodError` é flattenado e retornado em `data.zodError`
- Erros de validação retornam `BAD_REQUEST` com campos inválidos

Códigos de erro tRPC usados:

| Código | Quando |
|--------|--------|
| `UNAUTHORIZED` | Não autenticado |
| `FORBIDDEN` | Autenticado mas sem permissão / tenant suspenso |
| `NOT_FOUND` | Entidade não encontrada (com tenant check) |
| `BAD_REQUEST` | Input inválido ou regra de negócio violada |
| `CONFLICT` | Duplicata (ex: vistoria do mesmo tipo) |
| `TOO_MANY_REQUESTS` | Rate limit excedido |
| `INTERNAL_SERVER_ERROR` | Erro inesperado |

---

## Exemplos de Uso (Client)

```typescript
import { trpc } from '@/lib/trpc/client';

// Query com React Query
const { data, isLoading } = trpc.dashboard.getDashboardOverview.useQuery({
    from: new Date('2026-03-01'),
    to: new Date('2026-03-31'),
});

// Mutation
const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
        router.push(`/dashboard/orders/${data.id}`);
    },
});

createOrder.mutate({
    vehicleId: 'clx...',
    scheduledAt: new Date('2026-03-15T10:00:00'),
    assignedToId: 'cly...',
    items: [{ serviceId: 'clz...', price: 150, quantity: 1 }],
});
```
