# 📋 Funcionalidades do Sistema Autevo

> **Última atualização:** 16/01/2026  
> **Versão:** 1.0.0

---

## 🏗️ Arquitetura do Sistema

| Componente           | Tecnologia                                 |
| -------------------- | ------------------------------------------ |
| **Frontend**         | Next.js 14 (App Router), React, TypeScript |
| **Backend**          | tRPC (18 routers), Prisma                  |
| **Banco de Dados**   | PostgreSQL (Neon)                          |
| **Autenticação**     | Clerk (multi-tenant com publicMetadata)    |
| **Storage**          | Supabase Storage                           |
| **Cache/Rate Limit** | Upstash Redis                              |
| **Monitoramento**    | Sentry                                     |
| **UI**               | shadcn/ui, Tailwind CSS                    |

---

## 🏢 Multi-Tenancy & Billing

### Gerenciamento de Tenants

- Criação de tenant no signup com status `PENDING_ACTIVATION`
- Ciclo de vida: `PENDING_ACTIVATION` → `TRIAL` → `ACTIVE` / `SUSPENDED` / `CANCELED`
- Customização visual por tenant (cores, logo)
- Slug único para URL de agendamento público (`/booking/{slug}`)
- Configuração de capacidade máxima diária
- Configuração de horário de funcionamento (JSON)

### Sistema de Billing

- **Founding Members** (15 vagas): Trial extendido (60 dias), preço customizado
- Preço mensal configurável por tenant (`customMonthlyPrice`)
- Configurações globais via `SystemConfig`:
  - `pro_monthly_price`: Preço base do plano Pro
  - `trial_days_standard`: Dias de trial padrão (14)
  - `trial_days_founder`: Dias de trial para fundadores (60)
- Integração preparada para Stripe (campo `stripeCustomerId`)

### Roles e Permissões

| Role         | Nível de Acesso                              |
| ------------ | -------------------------------------------- |
| `ADMIN_SAAS` | Super admin (Painel administrativo completo) |
| `OWNER`      | Proprietário do tenant                       |
| `MANAGER`    | Gerente (acesso a relatórios, configurações) |
| `MEMBER`     | Funcionário (acesso limitado às próprias OS) |

---

## 👥 Gestão de Clientes

- Cadastro com: nome, telefone, email, documento (CPF/CNPJ), data de nascimento, Instagram, observações
- Opt-in para WhatsApp
- Soft delete (`deletedAt`)
- Busca por nome/telefone
- Paginação e ordenação
- Visualização de veículos do cliente
- Total gasto histórico por cliente
- Histórico de ordens de serviço

---

## 🚗 Gestão de Veículos

- Placa (única por tenant), marca, modelo, cor, ano
- Vinculação a cliente (opcional)
- Soft delete
- Busca por placa
- Histórico de OS por veículo
- Contagem de ordens

---

## 🔧 Catálogo de Serviços

- Nome, descrição, preço base, tempo estimado
- Dias para retorno (lembrete ao cliente)
- Ativo/Inativo (toggle)
- Comissão padrão (percentual ou valor fixo)
- Não permite excluir serviço com ordens vinculadas

---

## 📦 Controle de Estoque (Produtos)

- Nome, descrição, SKU, unidade
- Preço de custo e preço de venda
- Estoque atual e estoque mínimo
- Alertas de estoque baixo
- Movimentações: `ENTRADA`, `SAIDA_OS`, `AJUSTE`
- Histórico de movimentações por produto

---

## 📋 Ordens de Serviço (OS)

### Criação e Gestão

- Código sequencial por tenant
- Vinculação a: veículo, cliente, responsável
- Múltiplos itens de serviço
- Produtos consumidos
- Agendamento (data/hora)
- Atribuição de responsável (load balancing automático no booking público)

### Status Workflow

```
AGENDADO → EM_VISTORIA → EM_EXECUCAO → AGUARDANDO_PAGAMENTO → CONCLUIDO
                                                              ↓
                                                          CANCELADO
```

### Precificação

- Subtotal automático (soma de itens)
- Desconto: percentual ou valor fixo
- Total calculado
- Comissão total calculada

---

## 🔍 Sistema de Vistorias

### Tipos de Vistoria

- **Entrada**: Antes do serviço
- **Intermediária**: Durante o processo
- **Final**: Após conclusão

### Checklist Estruturado

- Categorias: exterior, rodas, detalhes
- Items obrigatórios e items críticos
- Status por item: `pendente`, `ok`, `com_avaria`

### Registro de Avarias

- Tipo de dano: arranhão, amassado, trinca, mancha, risco, outro
- Severidade: leve, moderado, grave
- Foto por item
- Posição no veículo

### Assinatura Digital

- URL da assinatura
- Data/hora da assinatura
- Via de assinatura (cliente, funcionário)

---

## 💰 Gestão de Pagamentos

### Métodos Suportados

- PIX, Cartão de Crédito, Cartão de Débito, Dinheiro, Transferência

### Funcionalidades

- Múltiplos pagamentos por OS
- Registro de quem recebeu
- Observações
- Cálculo de saldo devedor

---

## 📊 Dashboard e Métricas

### Dashboard Principal

- Agendamentos do dia
- OS em andamento
- Total de clientes
- Últimas ordens
- Agenda do dia
- Link de agendamento para compartilhar

### Métricas Financeiras (Managers+)

- Receita do mês
- Ticket médio
- Contas a receber
- Ordens concluídas

### Relatórios

- Top 10 serviços (receita e volume)
- Top 20 clientes (receita e número de OS)
- Crescimento mês-a-mês (comparativo)
- Gráfico de receita diária

---

## 🗓️ Agendamento

### Calendário Interno

- Visualização mensal
- Ordens por dia
- Cores por status

### Booking Público (`/booking/{slug}`)

- Página pública sem necessidade de login
- Seleção de serviço
- Calendário de disponibilidade (próximos 30 dias)
- Respeita capacidade máxima diária do tenant
- Cadastro de cliente e veículo inline
- Atribuição automática (load balancing por carga de trabalho)

---

## 💬 Comunicação

### Templates WhatsApp

- Link de acompanhamento
- Serviço concluído (com/sem valor)
- Lembrete de pagamento
- Feliz aniversário
- Mensagem personalizada

### Funcionalidades

- Abertura direta do WhatsApp Web/App
- Substituição de variáveis dinâmicas
- URL de tracking (`/tracking/{orderId}`)

### Notificações In-App

- Log de notificações por tenant
- Status: pending, read
- Visibilidade por role

---

## 🔐 Segurança

- Clerk com SSO
- Middleware de proteção de rotas
- Redirect automático por status do tenant
- Procedures por role: `publicProcedure`, `protectedProcedure`, `managerProcedure`, `ownerProcedure`, `adminProcedure`
- Isolamento de dados por tenant
- Rate Limiting via Upstash Redis (50 req/min)
- Chave PIX criptografada no banco
- Audit Log (ações críticas, usuário, entidade, valores, timestamp)

---

## 👑 Painel Administrativo (ADMIN_SAAS)

- Dashboard: Tenants totais, trial, ativos, suspensos, cancelados + MRR estimado
- Gestão de Tenants: Ativar Trial, Aprovar, Suspender, Cancelar, Deletar
- Configuração de preço customizado e Founding Members
- Logs de auditoria centralizados
- Configurações do sistema (preços, dias de trial)
- Métricas de performance

---

## 📱 Tracking Público

- Página `/tracking/{orderId}` para cliente acompanhar OS
- Sem necessidade de login
- Status em tempo real
- Fotos da vistoria
- Timeline de eventos

---

## 🎨 Tema e Customização

- Cor primária e secundária por tenant
- Logo customizada
- Aplicação dinâmica via `TenantThemeProvider`

---

## 📱 Responsividade

- Layout adaptativo desktop/mobile
- Sidebar colapsável
- Listas responsivas
- Design mobile-first

---

## 🔔 Onboarding

1. Signup → Status `PENDING_ACTIVATION`
2. Tela de ativação (`/activate`)
3. Welcome flow (`/welcome`)
4. Setup wizard (`/setup`)

### Usuários Convidados

- Email de convite via Clerk
- Tela de espera (`/awaiting-invite`)
- Vinculação automática ao tenant
