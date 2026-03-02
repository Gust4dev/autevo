# ⏰ Autevo — Jobs Agendados (Crons)

> **Plataforma:** Vercel Crons
> **Autenticação:** `Authorization: Bearer {CRON_SECRET}`
> **Config:** `apps/web/vercel.json`

---

## Visão Geral

Todos os crons são `GET` handlers em `/api/cron/*`. A Vercel chama automaticamente conforme o schedule configurado. O `CRON_SECRET` protege contra chamadas não autorizadas.

---

## Jobs Ativos

### 1. `cleanup-expired-tokens`
**Rota:** `GET /api/cron/cleanup-expired-tokens`
**Schedule:** `0 2 * * *` (02:00 UTC diariamente)

**O que faz:**
Remove tokens de aprovação de OS que expiraram:
```sql
DELETE FROM ServiceOrder
WHERE approvalToken IS NOT NULL
AND approvalTokenExpiry < NOW()
```

Define `approvalToken = null` e `approvalTokenExpiry = null` em OS com tokens vencidos.

**Por que importa:** Previne que tokens antigos sejam reutilizados e mantém o banco limpo.

---

### 2. `inactive-customers`
**Rota:** `GET /api/cron/inactive-customers`
**Schedule:** `0 9 * * *` (09:00 UTC diariamente)

**O que faz:**
1. Busca todos os tenants com `inactivityReminderEnabled = true` e status `ACTIVE` ou `TRIAL`
2. Para cada tenant, encontra clientes que:
   - Têm `whatsappOptIn = true`
   - Não foram notificados nos últimos 7 dias (`ANTI_SPAM_DAYS = 7`)
   - Não têm OS concluída nos últimos `customerInactivityDays` dias do tenant
3. Cria `NotificationLog` para cada cliente encontrado
4. Atualiza `Customer.lastReminderSentAt`
5. Envia push notification para os owners do tenant

**Anti-spam:** O campo `lastReminderSentAt` garante que o mesmo cliente não seja notificado mais de uma vez a cada 7 dias.

**Resposta:**
```json
{
    "status": "ok",
    "tenantsProcessed": 3,
    "totalCustomersNotified": 12,
    "details": [...]
}
```

---

### 3. `update-founder-subscriptions`
**Rota:** `GET /api/cron/update-founder-subscriptions`
**Schedule:** `0 0 * * 0` (00:00 UTC todo domingo)

**O que faz:**
Verifica assinaturas de membros fundadores com `founderExpiresAt` no passado e transiciona o preço para o valor padrão. Garante que o benefício do preço founder seja removido quando configurado para expirar.

---

### 4. `warmup`
**Rota:** `GET /api/cron/warmup`
**Schedule:** `*/5 * * * *` (a cada 5 minutos)

**O que faz:**
Faz um ping simples no banco de dados e na API para manter o serverless "quente" e evitar cold starts desnecessários no Neon/Vercel.

**Importante:** Este job é crítico em produção para garantir responsividade. Sem ele, a primeira requisição após períodos de inatividade pode ter latência significativa.

---

## Chamada Manual

Para testar um cron manualmente:

```bash
curl -H "Authorization: Bearer {CRON_SECRET}" \
     https://autevo.com.br/api/cron/inactive-customers
```

Ou localmente:
```bash
curl -H "Authorization: Bearer {CRON_SECRET}" \
     http://localhost:3000/api/cron/warmup
```

---

## Monitoramento

Todos os crons retornam JSON estruturado:
```json
{
    "status": "ok" | "error",
    "timestamp": "ISO string",
    "... dados específicos do job ..."
}
```

Recomendado: configurar alertas no UptimeRobot ou similar para monitorar falhas nos crons críticos (`inactive-customers`, `cleanup-expired-tokens`).

---

## Tratamento de Erros

Todos os crons têm `try/catch` global:
```typescript
try {
    const results = await processJob();
    return NextResponse.json({ status: 'ok', ...results });
} catch (error) {
    console.error('[Cron:JobName] Error:', error);
    return NextResponse.json(
        { status: 'error', error: error.message },
        { status: 500 }
    );
}
```

Erros são capturados pelo Sentry (via `instrumentation-client.ts`).

---

## Configuração Vercel Crons

```json
// apps/web/vercel.json
{
    "crons": [
        { "path": "/api/cron/cleanup-expired-tokens",        "schedule": "0 2 * * *"    },
        { "path": "/api/cron/inactive-customers",            "schedule": "0 9 * * *"    },
        { "path": "/api/cron/update-founder-subscriptions",  "schedule": "0 0 * * 0"    },
        { "path": "/api/cron/warmup",                        "schedule": "*/5 * * * *"  }
    ]
}
```

Crons Vercel são executados no timezone UTC. Para converter para Brasília (UTC-3): 09:00 UTC = 06:00 BRT.

---

## Adicionando Novos Crons

1. Criar handler em `apps/web/src/app/api/cron/{nome}/route.ts`
2. Adicionar a entrada em `apps/web/vercel.json`
3. Sempre incluir autenticação por `CRON_SECRET`
4. Incluir logging estruturado e tratamento de erro
5. Testar manualmente antes de habilitar o schedule