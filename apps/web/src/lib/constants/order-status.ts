import { OrderStatus } from '@prisma/client';

export interface OrderStatusConfig {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
    bgColor: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
    AGENDADO: {
        label: 'Agendado',
        variant: 'secondary',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    EM_VISTORIA: {
        label: 'Em Vistoria',
        variant: 'outline',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
    },
    EM_EXECUCAO: {
        label: 'Em Execução',
        variant: 'default',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    AGUARDANDO_PAGAMENTO: {
        label: 'Aguardando Pag.',
        variant: 'secondary',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    CONCLUIDO: {
        label: 'Concluído',
        variant: 'outline',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    CANCELADO: {
        label: 'Cancelado',
        variant: 'destructive',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
    },
};

export function getStatusConfig(status: string): OrderStatusConfig {
    return ORDER_STATUS_CONFIG[status as OrderStatus] || {
        label: status,
        variant: 'outline',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    };
}

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
    value: value as OrderStatus,
    label: config.label,
}));
