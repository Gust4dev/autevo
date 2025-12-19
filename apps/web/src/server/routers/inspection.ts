import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateChecklistItems, REQUIRED_CHECKLIST_ITEMS } from '@/lib/ChecklistDefinition';

// Enums
const inspectionTypeEnum = z.enum(['entrada', 'intermediaria', 'final']);
const inspectionStatusEnum = z.enum(['em_andamento', 'concluida']);
const itemStatusEnum = z.enum(['pendente', 'ok', 'com_avaria']);
const damageTypeEnum = z.enum(['arranhao', 'amassado', 'trinca', 'mancha', 'risco', 'pintura', 'outro']);
const severityEnum = z.enum(['leve', 'moderado', 'grave']);

// Schemas
const itemUpdateSchema = z.object({
    itemId: z.string(),
    status: itemStatusEnum,
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
    damageType: damageTypeEnum.optional(),
    severity: severityEnum.optional(),
});

const damageCreateSchema = z.object({
    position: z.string(), // Parte do carro
    damageType: damageTypeEnum,
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
});

export const inspectionRouter = router({
    // List all inspections for an order
    list: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const inspections = await ctx.db.inspection.findMany({
                where: { orderId: input.orderId },
                include: {
                    _count: { select: { items: true, damages: true } },
                    items: {
                        where: { status: { not: 'pendente' } },
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Calculate progress for each inspection
            return inspections.map(inspection => {
                const totalItems = inspection._count.items;
                const completedItems = inspection.items.length;
                const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                return {
                    id: inspection.id,
                    orderId: inspection.orderId,
                    type: inspection.type,
                    status: inspection.status,
                    createdAt: inspection.createdAt,
                    signedAt: inspection.signedAt,
                    _count: {
                        items: inspection._count.items,
                        damages: inspection._count.damages,
                    },
                    progress,
                    completedItems,
                };
            });
        }),

    // Get single inspection by ID with all details
    getById: protectedProcedure
        .input(z.object({ inspectionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    items: {
                        orderBy: [
                            { category: 'asc' },
                            { createdAt: 'asc' },
                        ],
                    },
                    damages: true,
                    order: {
                        select: {
                            tenantId: true,
                            code: true,
                            vehicle: {
                                select: { plate: true, brand: true, model: true, color: true }
                            }
                        }
                    },
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            // Calculate progress
            const totalRequired = inspection.items.filter(i => i.isRequired).length;
            const completedRequired = inspection.items.filter(i => i.isRequired && i.status !== 'pendente').length;
            const progress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

            return {
                ...inspection,
                progress,
                totalRequired,
                completedRequired,
                canComplete: completedRequired === totalRequired,
            };
        }),

    // Get inspection by order ID and type
    getByOrderIdAndType: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            type: inspectionTypeEnum,
        }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const inspection = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: input.type,
                    }
                },
                include: {
                    items: {
                        orderBy: [
                            { category: 'asc' },
                            { createdAt: 'asc' },
                        ],
                    },
                    damages: true
                },
            });

            if (!inspection) return null;

            // Sync missing checklist items (if new items were added to definition)
            const definedItems = generateChecklistItems();
            const existingItemKeys = new Set(inspection.items.map(i => i.itemKey));
            const missingItems = definedItems.filter(i => !existingItemKeys.has(i.itemKey));

            if (missingItems.length > 0) {
                console.log(`Syncing ${missingItems.length} missing items for inspection ${inspection.id}`);

                await ctx.db.inspectionItem.createMany({
                    data: missingItems.map(item => ({
                        inspectionId: inspection.id,
                        category: item.category,
                        itemKey: item.itemKey,
                        label: item.label,
                        isRequired: item.isRequired,
                        isCritical: item.isCritical,
                        status: 'pendente',
                    })),
                });

                // Refetch inspection to get new items
                return ctx.db.inspection.findUnique({
                    where: { id: inspection.id },
                    include: {
                        items: {
                            orderBy: [
                                { category: 'asc' },
                                { createdAt: 'asc' },
                            ],
                        },
                        damages: true
                    },
                });
            }

            return inspection;
        }),

    // Create new inspection with checklist items
    create: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            type: inspectionTypeEnum,
        }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            // Check if inspection of this type already exists
            const existing = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: input.type,
                    }
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `Já existe uma vistoria do tipo "${input.type}" para esta OS`,
                });
            }

            // Create inspection with all checklist items
            const checklistItems = generateChecklistItems();

            const inspection = await ctx.db.inspection.create({
                data: {
                    orderId: input.orderId,
                    type: input.type,
                    status: 'em_andamento',
                    items: {
                        create: checklistItems.map(item => ({
                            category: item.category,
                            itemKey: item.itemKey,
                            label: item.label,
                            isRequired: item.isRequired,
                            isCritical: item.isCritical,
                            status: 'pendente',
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            return inspection;
        }),

    // Update a checklist item (add photo, change status)
    updateItem: protectedProcedure
        .input(itemUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.inspectionItem.findUnique({
                where: { id: input.itemId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true } } },
                    },
                },
            });

            if (!item || item.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Item não encontrado',
                });
            }

            if (item.inspection.status === 'concluida') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Não é possível editar uma vistoria já concluída',
                });
            }

            const updated = await ctx.db.inspectionItem.update({
                where: { id: input.itemId },
                data: {
                    status: input.status,
                    photoUrl: input.photoUrl,
                    notes: input.notes,
                    damageType: input.status === 'com_avaria' ? input.damageType : null,
                    severity: input.status === 'com_avaria' ? input.severity : null,
                    completedAt: input.status !== 'pendente' ? new Date() : null,
                },
            });

            return updated;
        }),

    // Update final video URL
    updateVideo: protectedProcedure
        .input(z.object({
            inspectionId: z.string(),
            videoUrl: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: { order: { select: { tenantId: true } } },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const updated = await ctx.db.inspection.update({
                where: { id: input.inspectionId },
                data: {
                    finalVideoUrl: input.videoUrl,
                },
            });

            return updated;
        }),

    // Add a damage/detail entry
    addDamage: protectedProcedure
        .input(z.object({
            inspectionId: z.string(),
            damage: damageCreateSchema,
        }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: { order: { select: { tenantId: true } } },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const damage = await ctx.db.inspectionDamage.create({
                data: {
                    inspectionId: input.inspectionId,
                    ...input.damage,
                },
            });

            return damage;
        }),

    // Remove a damage entry
    removeDamage: protectedProcedure
        .input(z.object({ damageId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const damage = await ctx.db.inspectionDamage.findUnique({
                where: { id: input.damageId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true } } },
                    },
                },
            });

            if (!damage || damage.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Dano não encontrado',
                });
            }

            await ctx.db.inspectionDamage.delete({
                where: { id: input.damageId },
            });

            return { success: true };
        }),

    // Complete an inspection (validates all required items are done)
    complete: protectedProcedure
        .input(z.object({ inspectionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    items: true,
                    order: { select: { tenantId: true } },
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            // Check if all required items are completed
            const pendingRequired = inspection.items.filter(
                item => item.isRequired && item.status === 'pendente'
            );

            if (pendingRequired.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Ainda faltam ${pendingRequired.length} itens obrigatórios para concluir a vistoria`,
                });
            }

            const updated = await ctx.db.inspection.update({
                where: { id: input.inspectionId },
                data: {
                    status: 'concluida',
                    signedAt: new Date(),
                },
            });

            return updated;
        }),

    // Check if order can be completed (has completed exit inspection)
    canCompleteOrder: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            // Check for completed exit inspection
            const exitInspection = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: 'final',
                    },
                },
                select: { id: true, status: true },
            });

            const hasCompletedExitInspection = exitInspection?.status === 'concluida';

            // Check for completed entry inspection
            const entryInspection = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: 'entrada',
                    },
                },
                select: { id: true, status: true },
            });

            const hasCompletedEntryInspection = entryInspection?.status === 'concluida';

            return {
                canComplete: hasCompletedExitInspection,
                hasCompletedExitInspection,
                hasCompletedEntryInspection,
                missingInspections: !hasCompletedExitInspection
                    ? ['Vistoria de Saída obrigatória não foi concluída']
                    : [],
            };
        }),

});
