/**
 * Definição do Checklist de Vistoria
 * 
 * Este arquivo contém a definição estática de todos os itens que devem ser
 * verificados durante uma vistoria de veículo.
 */

export interface ChecklistItem {
    key: string;
    label: string;
    required: boolean;
    description?: string;
}

export interface ChecklistCategory {
    key: string;
    label: string;
    critical: boolean; // Se true, mostra warning vermelho
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
        items: [], // Dinâmico - preenchido pelo usuário
    },
];

/**
 * Lista plana de todos os itens obrigatórios do checklist
 */
export const REQUIRED_CHECKLIST_ITEMS = INSPECTION_CHECKLIST
    .flatMap(category => category.items.filter(item => item.required))
    .map(item => item.key);

/**
 * Total de itens obrigatórios
 */
export const TOTAL_REQUIRED_ITEMS = REQUIRED_CHECKLIST_ITEMS.length;

/**
 * Gera a lista de itens para criar no banco ao iniciar uma vistoria
 */
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

/**
 * Labels dos tipos de vistoria
 */
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
