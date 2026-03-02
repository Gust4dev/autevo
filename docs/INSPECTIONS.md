# 🔍 Autevo — Sistema de Vistorias Digitais

> **Última atualização:** Março 2026

---

## Visão Geral

O sistema de vistorias é o diferencial principal do Autevo para estéticas automotivas. Permite documentar o estado do veículo com fotos estruturadas, mapeamento de avarias, assinaturas digitais e geração de PDF — tudo mobile-first com suporte offline.

---

## Tipos de Vistoria

Cada OS pode ter até 3 vistorias, uma de cada tipo:

| Tipo | Label | Emoji | Obrigatoriedade Configurável |
|------|-------|-------|---------------------------|
| `entrada` | Entrada | 📥 | Sim (ENTRY ou BOTH) |
| `intermediaria` | Intermediária | 🔄 | Nunca obrigatória |
| `final` | Saída | ✅ | Sim (EXIT ou BOTH) |

A configuração de obrigatoriedade fica em `Tenant.inspectionRequired`:
- `NONE` — vistorias são opcionais
- `ENTRY` — vistoria de entrada obrigatória antes de concluir
- `EXIT` — vistoria de saída obrigatória antes de concluir
- `BOTH` — ambas obrigatórias

---

## Fluxo de Criação

```
1. Técnico abre a OS
2. Clica em "Iniciar Vistoria" → cria Inspection via inspection.create
3. Checklist é gerado automaticamente (generateChecklistItems())
4. Técnico fotografa cada item
5. Registra avarias encontradas
6. Conclui a vistoria (inspection.complete)
7. Assina digitalmente (staff) → ou cliente assina via link público
```

**Vistoria Final (Clone):** Quando `type = "final"`, se existir uma vistoria de entrada, a final é criada como clone — herdando todos os itens, fotos, status e avarias. O técnico pode então documentar o estado de saída comparando com a entrada.

---

## Checklist Padrão

Definido em `lib/ChecklistDefinition.ts`. São 14 itens obrigatórios por padrão:

### Exterior Geral (8 itens)
| Chave | Label | Obrigatório |
|-------|-------|-------------|
| `frente` | Frente Completa | ✅ |
| `traseira` | Traseira Completa | ✅ |
| `lateral_esquerda` | Lateral Esquerda | ✅ |
| `lateral_direita` | Lateral Direita | ✅ |
| `teto` | Teto | ✅ |
| `parabrisa` | Para-brisa | ✅ |
| `vidro_traseiro` | Vidro Traseiro | ✅ |
| `placa` | Placa | ✅ |

### Rodas e Pneus (4 itens)
| Chave | Label | Obrigatório |
|-------|-------|-------------|
| `roda_de` | Roda Dianteira Esquerda | ✅ |
| `roda_dd` | Roda Dianteira Direita | ✅ |
| `roda_te` | Roda Traseira Esquerda | ✅ |
| `roda_td` | Roda Traseira Direita | ✅ |

### Detalhes e Danos
Categoria livre, sem itens pré-definidos. Técnico adiciona avarias livres.

### Itens Pessoais (2 itens opcionais)
| Chave | Label | Obrigatório |
|-------|-------|-------------|
| `internos` | Pertences Internos | ❌ |
| `porta_malas` | Pertences no Porta-Malas | ❌ |

**Regra de conclusão:** Para concluir uma vistoria, todos os itens com `isRequired = true` devem ter `status ≠ "pendente"`.

---

## Status dos Itens

| Status | Descrição |
|--------|-----------|
| `pendente` | Ainda não avaliado |
| `ok` | Item em bom estado |
| `com_avaria` | Item com avaria documentada |

Quando `status = "com_avaria"`, os campos `damageType` e `severity` são obrigatórios.

---

## Tipos de Avaria

| Valor | Label |
|-------|-------|
| `arranhao` | Arranhão |
| `amassado` | Amassado |
| `trinca` | Trinca |
| `mancha` | Mancha |
| `risco` | Risco |
| `pintura` | Problema de Pintura |
| `outro` | Outro |

## Níveis de Severidade

| Valor | Label | Cor |
|-------|-------|-----|
| `leve` | Leve | Amarelo |
| `moderado` | Moderado | Laranja |
| `grave` | Grave | Vermelho |

---

## Fotos

Cada `InspectionItem` suporta múltiplas fotos:

- `photos: String[]` — array de URLs/base64 de todas as fotos
- `photoUrl: String?` — URL da primeira foto (compatibilidade legada)

**Upload de foto:**
```
Câmera/Galeria → base64 → inspection.addPhoto →
S3 (ou base64 em offline) → URL salva no array photos
```

**Suporte HEIC:** A lib `heic2any` converte fotos HEIC (iPhone) para JPEG antes do upload.

**Offline:** O `UploadQueue` (`lib/UploadQueue.ts`) enfileira uploads pendentes quando offline e processa quando a conexão retorna.

---

## Avarias Livres (InspectionDamage)

Além do checklist estruturado, o técnico pode registrar avarias em posições específicas do veículo:

```typescript
// Campos de InspectionDamage
{
    position: string;    // "para-choque dianteiro", "porta traseira esq."
    damageType: string;  // arranhao, amassado, etc.
    photoUrl?: string;   // foto opcional
    notes?: string;      // observações
}
```

---

## Assinaturas Digitais

Dois canais de assinatura:

### Staff (Assinatura Interna)
- `inspection.saveSignature` — autenticado
- Canvas digital → PNG → upload S3 → `signatureUrl`
- `signedVia = "digital_canvas"`

### Cliente (Assinatura Pública via Tracking)
- `inspection.savePublicSignature` — público, sem login
- Verificação de identidade: últimos 8+ dígitos do telefone
- `signedVia = "public_tracking"`
- Ao assinar vistoria de entrada com status `AGUARDANDO_APROVACAO`, a OS avança para `AGENDADO`

**Assinatura = Conclusão:** Quando o cliente assina via tracking, a vistoria é automaticamente marcada como `concluida`.

---

## Suporte Offline

O sistema de vistorias é projetado para funcionar offline:

1. **Cache da aplicação:** Service worker caches a UI e as últimas vistorias via NetworkFirst
2. **UploadQueue:** Fotos capturadas offline são enfileiradas em IndexedDB
3. **Sync flag:** `Inspection.pendingSync = true` marca vistorias com dados não sincronizados
4. **`OfflineUploadBanner`:** Componente que mostra status de sync ao usuário

```
[Modo Offline]
  → Técnico tira fotos → armazena em base64 localmente
  → UploadQueue persiste em IndexedDB

[Conexão retorna]
  → UploadQueue processa → faz upload para S3
  → Atualiza Inspection.lastSyncedAt
  → pendingSync = false
```

---

## PDF de Vistoria

O componente `InspectionPDF.tsx` gera um PDF com:
- Dados da OS e veículo
- Checklist com status de cada item
- Fotos de avarias
- Assinatura digital
- Timestamp e dados do tenant

Disponível via `/api/pdf` com os parâmetros de vistoria.

---

## Verificação de Completude para Conclusão de OS

Antes de marcar uma OS como `CONCLUIDO`, o sistema verifica (`inspection.canCompleteOrder`):

```typescript
switch (inspectionRequired) {
    case 'ENTRY': // exige apenas entrada concluída
    case 'EXIT':  // exige apenas saída concluída
    case 'BOTH':  // exige ambas concluídas
    case 'NONE':  // não exige nenhuma
}
```

A resposta inclui `missingInspections: string[]` com mensagens de erro claras para o usuário.

---

## Endpoints Públicos de Vistoria

O `tracking/[orderId]` permite ao cliente:
- Ver fotos da vistoria de entrada
- Assinar digitalmente (verificação por telefone)
- Acompanhar status da OS em tempo real

**Sem login necessário** — o link é compartilhado via WhatsApp ou SMS.
