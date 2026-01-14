export interface ChecklistItem {
    key: string;
    label: string;
    required: boolean;
    description?: string;
}

export interface ChecklistCategory {
    key: string;
    label: string;
    critical: boolean;
    description?: string;
    items: ChecklistItem[];
}

export const INSPECTION_CHECKLIST: ChecklistCategory[] = [
    {
        key: 'exterior',
        label: 'Exterior Geral',
        critical: false,
        description: 'Fotos do exterior do veículo para documentação completa',
        items: [
            { key: 'frente', label: 'Frente Completa', required: true },
            { key: 'traseira', label: 'Traseira Completa', required: true },
            { key: 'lateral_esquerda', label: 'Lateral Esquerda', required: true },
            { key: 'lateral_direita', label: 'Lateral Direita', required: true },
            { key: 'teto', label: 'Teto', required: true },
            { key: 'parabrisa', label: 'Para-brisa', required: true },
            { key: 'vidro_traseiro', label: 'Vidro Traseiro', required: true },
            { key: 'placa', label: 'Placa', required: true },
        ],
    },
    {
        key: 'rodas',
        label: 'Rodas e Pneus',
        critical: false,
        items: [
            { key: 'roda_de', label: 'Roda Dianteira Esquerda', required: true },
            { key: 'roda_dd', label: 'Roda Dianteira Direita', required: true },
            { key: 'roda_te', label: 'Roda Traseira Esquerda', required: true },
            { key: 'roda_td', label: 'Roda Traseira Direita', required: true },
        ],
    },
    {
        key: 'detalhes',
        label: 'Detalhes e Danos',
        critical: false,
        description: 'Adicione fotos de danos pré-existentes ou detalhes importantes',
        items: [],
    },
    {
        key: 'items_pessoais',
        label: 'Itens Pessoais',
        critical: false,
        description: 'Verificação de pertences pessoais no veículo',
        items: [
            { key: 'internos', label: 'Pertences Internos', required: false },
            { key: 'porta_malas', label: 'Pertences no Porta-Malas', required: false },
        ],
    },
];

export const REQUIRED_CHECKLIST_ITEMS = INSPECTION_CHECKLIST
    .flatMap(category => category.items.filter(item => item.required))
    .map(item => item.key);

export const TOTAL_REQUIRED_ITEMS = REQUIRED_CHECKLIST_ITEMS.length;

export function generateChecklistItems(): Array<{
    category: string;
    itemKey: string;
    label: string;
    isRequired: boolean;
    isCritical: boolean;
}> {
    return INSPECTION_CHECKLIST.flatMap(category =>
        category.items.map(item => ({
            category: category.key,
            itemKey: item.key,
            label: item.label,
            isRequired: item.required,
            isCritical: category.critical,
        }))
    );
}

export const INSPECTION_TYPE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
    entrada: {
        label: 'Entrada',
        emoji: '📥',
        description: 'Vistoria obrigatória realizada na chegada do veículo'
    },
    intermediaria: {
        label: 'Intermediária',
        emoji: '🔄',
        description: 'Vistoria opcional durante a execução do serviço'
    },
    final: {
        label: 'Saída',
        emoji: '✅',
        description: 'Vistoria obrigatória antes de entregar o veículo'
    },
};

/**
 * Labels dos status de item
 */
export const ITEM_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'gray' },
    ok: { label: 'OK', color: 'green' },
    com_avaria: { label: 'Com Avaria', color: 'red' },
};

/**
 * Tipos de avaria
 */
export const DAMAGE_TYPE_OPTIONS = [
    { value: 'arranhao', label: 'Arranhão' },
    { value: 'amassado', label: 'Amassado' },
    { value: 'trinca', label: 'Trinca' },
    { value: 'mancha', label: 'Mancha' },
    { value: 'risco', label: 'Risco' },
    { value: 'pintura', label: 'Problema de Pintura' },
    { value: 'outro', label: 'Outro' },
] as const;

export const DAMAGE_TYPE_LABELS: Record<string, string> = {
    arranhao: 'Arranhão',
    amassado: 'Amassado',
    trinca: 'Trinca',
    mancha: 'Mancha',
    risco: 'Risco',
    pintura: 'Problema de Pintura',
    outro: 'Outro',
};

/**
 * Níveis de severidade
 */
export const SEVERITY_OPTIONS = [
    { value: 'leve', label: 'Leve', color: 'yellow' },
    { value: 'moderado', label: 'Moderado', color: 'orange' },
    { value: 'grave', label: 'Grave', color: 'red' },
] as const;

export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
    leve: { label: 'Leve', color: 'yellow' },
    moderado: { label: 'Moderado', color: 'orange' },
    grave: { label: 'Grave', color: 'red' },
};
