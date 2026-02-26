import { Prisma } from '@prisma/client';

export function tenantExtension(tenantId: string | null) {
    if (!Prisma.dmmf) {
        // [CRÍTICO] Fallback removido: Não podemos operar sem DMMF, ou vazaremos dados de múltiplos tenants.
        throw new Error("[SECURITY_FATAL] Prisma DMMF indisponível. Isolamento de Tenant comprometido. Abortando execução.");
    }

    // Models that EXPLICITLY have tenantId in schema.prisma
    const isolatedModels = Prisma.dmmf.datamodel.models
        .filter((m) => m.fields.some((f) => f.name === 'tenantId'))
        .map((m) => m.name);

    // Helper to deeply inject tenantId into Nested Connects
    const injectTenantIntoConnects = (data: any, currentModelName: string): any => {
        if (!data || typeof data !== 'object') return data;

        const modelDef = Prisma.dmmf.datamodel.models.find(m => m.name === currentModelName);
        if (!modelDef) return data;

        const newData = { ...data };

        for (const [key, value] of Object.entries(newData)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const fieldDef = modelDef.fields.find(f => f.name === key);

                // If it's a relation field
                if (fieldDef && fieldDef.kind === 'object') {
                    const targetModelName = fieldDef.type;
                    const targetIsIsolated = isolatedModels.includes(targetModelName);
                    const operationObj = value as any;

                    if (targetIsIsolated) {
                        // Handle connects
                        if (operationObj.connect) {
                            if (Array.isArray(operationObj.connect)) {
                                operationObj.connect = operationObj.connect.map((c: any) => ({ ...c, tenantId }));
                            } else {
                                operationObj.connect = { ...operationObj.connect, tenantId };
                            }
                        }

                        // Also inject tenantId in creates if omitted (though top level already does, nested might need it)
                        if (operationObj.create) {
                            if (Array.isArray(operationObj.create)) {
                                operationObj.create = operationObj.create.map((c: any) => ({
                                    ...injectTenantIntoConnects(c, targetModelName),
                                    tenantId
                                }));
                            } else {
                                operationObj.create = {
                                    ...injectTenantIntoConnects(operationObj.create, targetModelName),
                                    tenantId
                                };
                            }
                        }

                        if (operationObj.update) {
                            // Can be an array of updates or single update
                            if (Array.isArray(operationObj.update)) {
                                operationObj.update = operationObj.update.map((u: any) => ({
                                    ...u,
                                    data: injectTenantIntoConnects(u.data, targetModelName)
                                }));
                            } else if (operationObj.update.data) {
                                operationObj.update.data = injectTenantIntoConnects(operationObj.update.data, targetModelName);
                            } else {
                                operationObj.update = injectTenantIntoConnects(operationObj.update, targetModelName);
                            }
                        }
                    }
                }
            }
        }
        return newData;
    };

    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        if (!isolatedModels.includes(model)) {
                            return query(args);
                        }

                        // For tenant-specific models, inject tenantId filter
                        if (tenantId && ['findFirst', 'findUnique', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                            const newArgs = { ...args } as any;
                            newArgs.where = {
                                ...newArgs.where,
                                tenantId: tenantId,
                            };
                            return query(newArgs);
                        }

                        // For creation, ensure tenantId is injected and deep connects are verified
                        if (tenantId && (operation === 'create' || operation === 'createMany' || operation === 'update')) {
                            const newArgs = { ...args } as any;

                            if (newArgs.data) {
                                if (Array.isArray(newArgs.data)) {
                                    newArgs.data = newArgs.data.map((item: any) => ({
                                        ...injectTenantIntoConnects(item, model),
                                        tenantId: tenantId,
                                    }));
                                } else {
                                    newArgs.data = {
                                        ...injectTenantIntoConnects(newArgs.data, model),
                                        ...(operation !== 'update' ? { tenantId: tenantId } : {})
                                    };
                                }
                            }

                            return query(newArgs);
                        }

                        return query(args);
                    },
                },
            },
        });
    });
}
