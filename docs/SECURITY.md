# 🔐 Autevo — Modelo de Segurança

> **Última atualização:** Março 2026

---

## Visão Geral

O modelo de segurança do Autevo é construído em defesa por camadas (*defense in depth*). Nenhuma camada é suficiente sozinha, e uma falha em uma não compromete as outras.

```
[Edge Middleware] → [tRPC Middlewares] → [Query Level] → [DB]
     Clerk JWT           RBAC + Status        tenantId      Prisma
```

---

## 1. Autenticação (Clerk)

Toda autenticação é delegada ao Clerk. O sistema nunca armazena senhas.

**Como funciona:**
- Clerk emite um JWT de sessão com `public_metadata` customizado
- O middleware Edge lê o JWT sem round-trip ao banco (edge-compatible)
- O `clerkMiddleware()` protege todas as rotas não públicas

**Dados no JWT (`public_metadata`):**
```typescript
{
    tenantStatus: 'ACTIVE' | 'TRIAL' | ...
    role: 'OWNER' | 'MANAGER' | 'MEMBER'
    trialEndsAt: string (ISO)
    isFoundingMember: boolean
    tosVersion: string
}
```

**Sincronização:** O webhook do Clerk atualiza esses metadados sempre que o status do tenant muda. A invalidação de cache Redis garante consistência.

---

## 2. Autorização — RBAC

Quatro roles com permissões em cascata:

```
ADMIN_SAAS > OWNER > MANAGER > MEMBER
```

| Ação | MEMBER | MANAGER | OWNER | ADMIN_SAAS |
|------|--------|---------|-------|------------|
| Ver próprias OS | ✅ | ✅ | ✅ | ✅ |
| Ver todas as OS do tenant | ❌ | ✅ | ✅ | ✅ |
| Criar/editar OS | ✅ | ✅ | ✅ | ✅ |
| Ver dados financeiros | ❌ | ✅ | ✅ | ✅ |
| Gerenciar equipe | ❌ | ❌ | ✅ | ✅ |
| Configurações do tenant | ❌ | ❌ | ✅ | ✅ |
| Cancelar/estornar pagamentos | ❌ | ✅ | ✅ | ✅ |
| Painel Admin SaaS | ❌ | ❌ | ❌ | ✅ |

**Implementação no tRPC:**
```typescript
export const managerProcedure = protectedProcedure.use(
    requireRole(['ADMIN_SAAS', 'OWNER', 'MANAGER'])
);
```

O role é validado a partir do `ctx.user.role` carregado do banco, não apenas do JWT — proteção extra contra tokens desatualizados.

**Membro (MEMBER) e dados filtrados:**
O `getDashboardOverview` injeta automaticamente `assignedToId = ctx.user.id` para usuários com role MEMBER. Eles só veem as OS atribuídas a eles.

---

## 3. Isolamento Multi-Tenant

Toda query de dados usa `where: { tenantId: ctx.tenantId! }`.

O `tenantId` é extraído do usuário autenticado no banco, não de parâmetros da requisição. Mesmo que um atacante manipule o request, ele não consegue acessar dados de outro tenant.

Exemplo de ataque impedido:
```
# Atacante tenta GET /api/trpc/order.getById?input={"id":"order-de-outro-tenant"}
→ tenantMiddleware injeta tenantId = "meu-tenant-id"
→ query: WHERE id = ? AND tenantId = "meu-tenant-id"
→ Resultado: NOT_FOUND (sem vazar que o ID existe)
```

---

## 4. Rate Limiting (Upstash Redis)

Implementado como middleware tRPC via sliding window:

- **Limite:** 50 req/min por usuário (`userId` ou `"anonymous"`)
- **Provider:** Upstash Redis (edge-compatible, sem conexão TCP)
- **Resposta:** `TOO_MANY_REQUESTS` com mensagem em português

Procedures de alta frequência (atualizações de vistoria) usam `protectedProcedureNoRateLimit` deliberadamente para não bloquear o fluxo de trabalho real de técnicos.

**Fallback seguro:** Se o Upstash estiver indisponível, a verificação é ignorada (fail-open) para não bloquear o sistema em falhas de infra. Isso é um trade-off consciente — o risco de DoS é menor que a indisponibilidade do sistema principal.

---

## 5. Tenant Status Machine (Proteção de Acesso)

Além da autenticação, o `tenantMiddleware` bloqueia acesso com base no status da conta:

```
PENDING_ACTIVATION → só permite tenant.updateSetup
SUSPENDED          → bloqueia tudo (FORBIDDEN)
CANCELED           → bloqueia tudo (FORBIDDEN)
TRIAL              → acesso normal (com verificação de expiração no middleware Edge)
ACTIVE             → acesso total
```

O middleware Edge (`middleware.ts`) redireciona o usuário para páginas apropriadas antes mesmo de atingir o tRPC.

---

## 6. Sanitização de Input

Dois mecanismos complementares:

**Zod (tRPC inputs):**
Todos os inputs de mutations são validados com schemas Zod. Nenhuma mutação aceita dados brutos não validados.

**`sanitizeInput()` (`lib/sanitize.ts`):**
Aplicado em campos de texto livre (nomes, notas, descrições) antes de persistir no banco. Remove scripts e HTML perigoso.

**Limite de preço:**
```typescript
const MAX_PRICE = 99999999.99;
// Impede erros como inserir "15000" quando era "150.00"
```

---

## 7. Segurança de Aprovação Pública (Tokens)

Para aprovação de contrato sem login:

- Token `approvalToken` gerado com `crypto.randomUUID()` — não previsível
- Expira em 24-48 horas (`approvalTokenExpiry`)
- Token é removido após uso (one-time)
- IP, User-Agent e geolocalização são registrados no `approvalIp`, `approvalUserAgent`, `approvalGeo`

---

## 8. Assinatura Digital Pública (Vistorias)

`inspection.savePublicSignature` verifica identidade sem login:

```typescript
// Verifica que os últimos 8+ dígitos do telefone batem
const isValid = (phoneDigitsOnly.endsWith(inputDigits) ||
                 inputDigits.endsWith(phoneDigitsOnly)) &&
                 Math.min(phoneDigitsOnly.length, inputDigits.length) >= 8;
```

Proteções adicionais:
- Vistoria com `signatureUrl` já definida retorna `BAD_REQUEST` (não permite re-assinar)
- Todos os itens obrigatórios devem estar preenchidos antes de assinar

---

## 9. Criptografia de Dados Sensíveis

Implementado em `lib/encryption.ts`:

- Algoritmo: AES-256-GCM (autenticado)
- Campos criptografados: chave PIX do tenant (`pixKey`)
- Key derivation: `ENCRYPTION_KEY` + `ENCRYPTION_SALT` das env vars
- Migração: `packages/database/scripts/migrate-encrypt-pixkey.ts`

---

## 10. Cabeçalhos de Segurança HTTP

Configurados globalmente via `next.config.ts`:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 11. Proteção de Webhook (CRON_SECRET)

Todos os endpoints de cron exigem:
```
Authorization: Bearer {CRON_SECRET}
```

Isso previne execução não autorizada de jobs que podem disparar notificações em massa.

---

## 12. Audit Trail

Todas as ações críticas geram um `AuditLog`:

| Ação auditada |
|---------------|
| Mudança de status de OS |
| Criação/edição de OS |
| Pagamentos registrados/estornados |
| Mudança de role de usuário |
| Alterações de configuração |
| Aceite de ToS |
| Validação de partner code |
| Acesso ao painel admin |

O log inclui `oldValue` e `newValue` como JSON para diff completo.

---

## 13. Proteção de Validação de Códigos

`partnership.validatePartnerCode` tem rate limiting adicional baseado em AuditLog:

```typescript
// Máximo 10 tentativas por minuto por tenant
const recentAttempts = await ctx.db.auditLog.count({
    where: { tenantId, action: 'PARTNER_CODE_VALIDATION', createdAt: { gte: oneMinuteAgo } }
});
if (recentAttempts >= 10) throw TOO_MANY_REQUESTS;
```

Além disso, o nome do tenant parceiro é mascarado: `"Filmtech Detailing"` → `"Filmtech D."` (data minimization).

---

## 14. Prevenção de Open Redirect

No middleware, o parâmetro `redirect_url` é validado para ser same-origin:

```typescript
const target = new URL(redirectTo, request.url);
if (target.origin === request.nextUrl.origin) {
    return NextResponse.redirect(target);
}
// Caso contrário, redireciona para /dashboard
```

---

## 15. Segurança de Produção vs Desenvolvimento

Em produção (`NODE_ENV === 'production'`):
- Mensagens de erro do Prisma são sanitizadas para o cliente
- `console.log` e `console.debug` são removidos pelo compiler (apenas `error` e `warn` sobrevivem)
- PWA service worker ativo (desabilitado em desenvolvimento)
- Sentry captura erros silenciosamente

---

## Checklist de Segurança

- ✅ Todos os endpoints de mutação são autenticados e validados com Zod
- ✅ Isolamento de tenant em 100% das queries
- ✅ Rate limiting em todas as procedures públicas
- ✅ Tokens de aprovação one-time com expiração
- ✅ Assinaturas digitais com verificação de identidade
- ✅ Dados financeiros acessíveis apenas para MANAGER+
- ✅ Audit log de todas as ações críticas
- ✅ Cabeçalhos de segurança HTTP em todas as rotas
- ✅ Criptografia de dados sensíveis (PIX key)
- ✅ Webhooks protegidos com secrets
- ✅ Prevenção de open redirect
- ✅ Sanitização de inputs de texto livre
