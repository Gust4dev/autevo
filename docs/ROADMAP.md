# 🚀 Autevo — Roadmap Estratégico 2026

> **Última atualização:** 2 de março de 2026
> **Meta:** R$ 10k MRR (53 clientes pagantes @ R$ 190/mês)
> **Período:** Janeiro 2026 – Dezembro 2026
> **Fases:** Lançamento → Validação → Crescimento → Escala

---

## 📊 Visão Geral

| Mês | Fase | Meta de Clientes | MRR Alvo | Status |
|-----|------|-----------------|----------|--------|
| Jan | Lançamento | 5 | R$ 570 | ✅ Concluído |
| Fev | Validação | 10 | R$ 1.330 | ✅ Concluído |
| Mar | Integrações | 18 | R$ 3.420 | 🔵 Atual |
| Abr | Escala Regional | 28 | R$ 5.320 | ⏳ Futuro |
| Mai | Otimização | 38 | R$ 7.220 | ⏳ Futuro |
| Jun | Premium | 48 | R$ 9.120 | ⏳ Futuro |
| Jul–Dez | Ecossistema | 53+ | R$ 10k+ | ⏳ Futuro |

---

## ✅ MÊS 1 — JANEIRO 2026 (Lançamento)

**Objetivo:** Primeiros 5 clientes pagantes
**Status:** ✅ CONCLUÍDO — Sistema em produção, primeiros contratos fechados

### Marketing & Vendas (Prioridade 1)

- [x] Criar vídeo demo de 60s
- [x] Criar 6–8 screenshots estratégicos
- [x] Criar PDF de 1 página para apresentação
- [x] Levantar lista de 50 prospects (estéticas de Anápolis/Goiânia)
- [x] Prospectar JK Detailers
- [x] Prospectar Virtus_design
- [x] Prospectar Vida Nova
- [x] Fechar primeiros 2–3 clientes
- [x] Criar vídeo demo completo (3–5 min)
- [x] Configurar Google Analytics + Microsoft Clarity

### Produto (Prioridade 2)

- [x] Sistema de onboarding melhorado (wizard 3 etapas)
- [x] Tutorial in-app (tooltips + vídeo curto)
- [x] Ambiente de demo público (dados dummy para prospects)
- [x] Página de status do sistema (uptime, incidentes)

### Infraestrutura (Prioridade 3)

- [x] Configurar backup automático diário (Neon)
- [x] Monitoramento de uptime (UptimeRobot)
- [x] Documentação de deploy e rollback

**KPIs do Mês — Resultado Real:**

| KPI | Meta | Resultado |
|-----|------|-----------|
| Mensagens enviadas | 50 | ✅ 50+ |
| Respostas | 15 (30%) | ✅ Atingido |
| Demos agendadas | 5 | ✅ Atingido |
| Clientes fechados | 3 | ✅ Atingido |
| MRR | R$ 570 | ✅ Atingido |

---

## ✅ MÊS 2 — FEVEREIRO 2026 (Validação + Iteração)

**Objetivo:** 10 clientes no total (validar product-market fit)
**Status:** ✅ CONCLUÍDO — Foco em automação e retenção entregue

### Produto (Prioridade 1)

- [x] **Gestão de Inatividade Automática**
  - Tracking de clientes ociosos com threshold configurável (`customerInactivityDays`)
  - Anti-spam: intervalo mínimo de 7 dias entre lembretes
  - Push notifications para owners + `NotificationLog`
- [x] **PWA & Otimização Mobile**
  - Correção de problemas de upload no service worker
  - Suporte completo a instalação como PWA
  - Fila offline (`UploadQueue`) para sincronização de fotos
- [x] **Motor de Parceria & Indicação**
  - Implementação de promo codes com duração configurável
  - Tracking de indicações por parceiro (ex: Filmtech)
  - Comissão de R$ 42/mês por indicado ativo
  - Tier gratuito: 5+ indicados ativos = plano zero custo
- [ ] **Lembretes WhatsApp Automáticos**
  - Lembrete 1 dia antes do agendamento
  - Aviso de retorno (X dias após serviço)
  - ⚠️ Parcialmente entregue — integração via wa.me manual (sem API externa)

### Marketing & Vendas (Prioridade 2)

- [ ] Expandir para 100 prospects (cidades vizinhas) — parcialmente
- [ ] Criar case study do primeiro cliente (depoimento + métricas)
- [x] Otimização da landing page (Pricing, Slots Membro Fundador)
- [ ] Instagram Business (3 posts/semana)
- [ ] Stories mostrando o sistema em uso

### Suporte (Prioridade 3)

- [x] Canal de suporte estruturado (WhatsApp Business)
- [x] Base de Conhecimento inicial (FAQs)
- [ ] Onboarding personalizado para novos clientes (call de 30min)

**KPIs do Mês — Resultado Real:**

| KPI | Meta | Resultado |
|-----|------|-----------|
| Mensagens enviadas | 75 | ✅ |
| Novos clientes | 4 | ✅ |
| Total de clientes | 7 | ✅ |
| MRR | R$ 1.330 | ✅ |
| NPS | > 8/10 | 🟡 Em coleta |

---

## 🔵 MÊS 3 — MARÇO 2026 (Primeiras Integrações) ← ATUAL

**Objetivo:** 18 clientes no total + automação de pagamentos
**Status:** 🔵 EM ANDAMENTO

### Produto (Prioridade 1)

- [ ] **Integração Mercado Pago (MVP)**
  - Link de pagamento integrado (Pix + Cartão)
  - Webhook de confirmação automática
  - Registro automático de pagamento na OS
- [ ] **Sistema de Templates de OS**
  - Templates para serviços recorrentes
  - Duplicação rápida de OS anterior
  - Sugestões de serviço baseadas no histórico do cliente
- [ ] **Dashboard de Produtividade**
  - Tempo médio por serviço
  - Taxa de cumprimento de prazos
  - Produtividade por funcionário

### Marketing & Vendas (Prioridade 2)

- [ ] Expandir para todo Goiás (200 prospects)
- [ ] Criar segundo case study
- [ ] Programa de indicação de cliente (indica → ganha desconto)
- [ ] Vídeo de depoimento de cliente real

### Infraestrutura (Prioridade 3)

- [ ] Health checks automatizados
- [ ] Logs centralizados (Better Stack ou Datadog)
- [ ] Alertas de erros críticos (Slack/WhatsApp)

**KPIs do Mês (Previsão):**

| KPI | Meta |
|-----|------|
| Mensagens enviadas | 150 |
| Novos clientes | 8 |
| Total de clientes | 18 |
| MRR | R$ 3.420 |
| % transações via Mercado Pago | 30% |

---

## ⏳ MÊS 4 — ABRIL 2026 (Escala Regional)

**Objetivo:** 28 clientes + expansão Brasília/Goiânia

### Marketing & Vendas (Prioridade 1)

- [ ] Expansão Brasília (100 prospects)
- [ ] Expansão Goiânia (100 prospects)
- [ ] Google Ads local (R$ 500/mês)
- [ ] Parcerias com distribuidores de produtos automotivos
- [ ] Presença em eventos locais (feiras automotivas)

### Produto (Prioridade 2)

- [ ] **Gestão de Fornecedores**
  - CRUD de fornecedores
  - Vinculação de produtos a fornecedores
  - Histórico de compras
- [ ] **OS Recorrentes**
  - Criação periódica de OS (semanal/mensal)
  - Lembrete automático de retorno

### Suporte (Prioridade 3)

- [ ] Contratar suporte part-time (10h/semana)
- [ ] Documentação de troubleshooting
- [ ] Vídeos de treinamento por funcionalidade

**KPIs do Mês:**

| KPI | Meta |
|-----|------|
| Mensagens enviadas | 300 |
| Novos clientes | 10 |
| Total de clientes | 28 |
| MRR | R$ 5.320 |

---

## ⏳ MÊS 5 — MAIO 2026 (Otimização de Conversão)

**Objetivo:** 38 clientes + redução de churn

### Produto (Prioridade 1)

- [ ] **Sistema de NPS Automatizado**
  - Pesquisa após 7 dias de uso
  - Identificação de clientes em risco
- [ ] **Melhorias de Onboarding**
  - Migração assistida de dados (Planilha → Sistema)
  - Wizard de setup interativo aprimorado
- [ ] **Analytics do Cliente**
  - Tracking de uso de features
  - Frequência de login
  - Red flags de churn

### Marketing & Vendas (Prioridade 2)

- [ ] Campanha de reativação de prospects inativos
- [ ] Parceria com influenciadores do nicho automotivo
- [ ] Lançamento de programa de afiliados público

**KPIs do Mês:**

| KPI | Meta |
|-----|------|
| Total de clientes | 38 |
| MRR | R$ 7.220 |
| Churn Rate | < 5% |
| NPS | > 8.5/10 |

---

## ⏳ Q3 — JULHO A SETEMBRO 2026 (Escala & Mobile)

### Junho — Features Premium

- [ ] **Integração NF-e** (via Focus NFe)
  - Emissão de nota fiscal direto da OS
  - Configuração de dados fiscais por tenant
- [ ] **IA na Precificação**
  - Sugestão de preço baseado em histórico e mercado
  - Faturamento preditivo

### Julho — Apps Nativos

- [ ] **App iOS/Android para Técnicos**
  - Foco em vistorias e execução de OS
  - Câmera nativa para fotos de maior qualidade
  - Notificações push nativas

### Agosto — Consolidação

- [ ] **Relatórios Avançados**
  - Drag-and-drop de métricas
  - Comparativo mês-a-mês
  - Exportação para PDF e Excel

---

## ⏳ Q4 — OUTUBRO A DEZEMBRO 2026 (Ecossistema)

### Setembro — API Pública

- [ ] API REST pública documentada (OpenAPI 3.0)
- [ ] Webhooks configuráveis por tenant
- [ ] SDK JavaScript básico

### Outubro — Multi-Unidade

- [ ] **Gestão de Franquias**
  - Múltiplas unidades por conta
  - Dashboard consolidado do franqueador
  - Configurações herdadas/independentes por unidade

### Novembro — Expansão Nacional

- [ ] Campanha de marketing nacional
- [ ] Parceria com redes de estética automotiva
- [ ] Programa de revendedores certificados

### Dezembro — Marco 10k MRR 🎯

- [ ] Revisão do ano (métricas, aprendizados, casos de sucesso)
- [ ] Planejamento 2027
- [ ] Celebração da comunidade Autevo

---

## ⚠️ Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Churn alto (>20%) | Média | Alto | Onboarding personalizado, NPS tracking, customer success |
| Concorrente grande entrando | Baixa | Alto | Foco em nicho, features específicas, suporte próximo |
| Escalabilidade de vendas | Alta | Médio | Automatizar prospecção, programa de afiliados |
| Bugs críticos em produção | Média | Alto | Testes automatizados, staging, rollback rápido |
| Integração MP instável | Média | Médio | Fallback manual, retry automático via webhook |
| Cold start Neon/Vercel | Baixa | Médio | Cron de warmup a cada 5min já implementado |

---

## 📐 Princípios do Roadmap

1. **Cliente Primeiro** — Features que não resolvem uma dor real são despriorizadas.
2. **Validação antes de Escala** — Não investir pesado em marketing antes de encontrar o fit.
3. **Qualidade > Quantidade** — 50 clientes felizes valem mais que 100 insatisfeitos.
4. **Documento Vivo** — Este roadmap é revisado mensalmente com base em feedback real, performance de vendas e capacidade de execução.

---

## 📝 Histórico de Revisões

| Data | Versão | Principais Mudanças |
|------|--------|---------------------|
| 12 jan 2026 | v1.0 | Versão inicial |
| 12 fev 2026 | v1.1 | Jan concluído, Fev detalhado, Q3/Q4 adicionados |
| 02 mar 2026 | v1.2 | Fev concluído, Mar como atual, tradução pt-BR, riscos atualizados |

**Próxima Revisão:** 12 de março de 2026
