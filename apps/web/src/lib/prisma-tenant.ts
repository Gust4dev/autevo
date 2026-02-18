import { Prisma } from '@prisma/client';

export function tenantExtension(tenantId: string | null) {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        // Models that EXPLICITLY have tenantId in schema.prisma
                        const isolatedModels = [
                            'User',
                            'Customer',
                            'Vehicle',
                            'Service',
                            'Product',
                            'ServiceOrder',
                            'CommissionSettlement',
                            'NotificationLog',
                            'AuditLog',
                            'MessageTemplate',
                            'Subscription',
                            'PartnerCommission'
                        ];

                        if (!isolatedModels.includes(model)) {
                            return query(args);
                        }

                        // For tenant-specific models, inject tenantId filter
                        if (tenantId && ['findFirst', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                            const newArgs = { ...args } as any;
                            newArgs.where = {
                                ...newArgs.where,
                                tenantId: tenantId,
                            };
                            return query(newArgs);
                        }

                        // For creation, ensure tenantId is injected if not present
                        if (tenantId && (operation === 'create' || operation === 'createMany')) {
                            if (operation === 'create') {
                                const newArgs = { ...args } as any;
                                newArgs.data = {
                                    ...newArgs.data,
                                    tenantId: tenantId,
                                };
                                return query(newArgs);
                            }
                            if (operation === 'createMany') {
                                const newArgs = { ...args } as any;
                                if (Array.isArray(newArgs.data)) {
                                    newArgs.data = newArgs.data.map((item: any) => ({
                                        ...item,
                                        tenantId: tenantId,
                                    }));
                                } else {
                                    newArgs.data = {
                                        ...newArgs.data,
                                        tenantId: tenantId,
                                    };
                                }
                                return query(newArgs);
                            }
                        }

                        return query(args);
                    },
                },
            },
        });
    });
}
