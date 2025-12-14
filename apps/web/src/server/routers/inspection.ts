import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const damageTypeEnum = z.enum(['scratch', 'dent', 'crack', 'paint']);
const inspectionTypeEnum = z.enum(['entrada', 'pos_limpeza', 'final']);

const damageCreateSchema = z.object({
    position: z.string(), // Part name (e.g., "capo", "porta_dianteira_esq")
    x: z.number(),
    y: z.number(),
    z: z.number().default(0),
    normalX: z.number().default(0),
    normalY: z.number().default(1),
    normalZ: z.number().default(0),
    is3D: z.boolean().default(true),
    damageType: damageTypeEnum,
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
});

const damageUpdateSchema = z.object({
    damageType: damageTypeEnum.optional(),
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
                    _count: { select: { damages: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            return inspections;
        }),

    // Get single inspection by ID
    getById: protectedProcedure
        .input(z.object({ inspectionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    damages: true,
                    order: {
                        select: {
                            tenantId: true,
                            vehicle: {
                                select: { plate: true, brand: true, model: true }
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

            return inspection;
        }),

    // Get inspection by order ID and type (legacy support)
    getByOrderId: protectedProcedure
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

            // Return the most recent inspection for this order
            const inspection = await ctx.db.inspection.findFirst({
                where: { orderId: input.orderId },
                include: { damages: true },
                orderBy: { createdAt: 'desc' },
            });

            return inspection;
        }),

    // Create new inspection
    create: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                type: inspectionTypeEnum,
            })
        )
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
            const existing = await ctx.db.inspection.findFirst({
                where: {
                    orderId: input.orderId,
                    type: input.type,
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `Já existe uma vistoria do tipo "${input.type}" para esta OS`,
                });
            }

            const inspection = await ctx.db.inspection.create({
                data: {
                    orderId: input.orderId,
                    type: input.type,
                },
            });

            return inspection;
        }),

    // Add damage marker to existing inspection
    addDamage: protectedProcedure
        .input(
            z.object({
                inspectionId: z.string(),
                damage: damageCreateSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
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

    // Bulk add damages to existing inspection
    addDamages: protectedProcedure
        .input(
            z.object({
                inspectionId: z.string(),
                damages: z.array(damageCreateSchema),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
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

            const damages = await ctx.db.inspectionDamage.createMany({
                data: input.damages.map((damage) => ({
                    inspectionId: input.inspectionId,
                    ...damage,
                })),
            });

            return damages;
        }),

    // Update damage
    updateDamage: protectedProcedure
        .input(
            z.object({
                damageId: z.string(),
                data: damageUpdateSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify ownership through inspection -> order -> tenant
            const damage = await ctx.db.inspectionDamage.findUnique({
                where: { id: input.damageId },
                include: {
                    inspection: {
                        include: {
                            order: { select: { tenantId: true } },
                        },
                    },
                },
            });

            if (!damage || damage.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Dano não encontrado',
                });
            }

            const updatedDamage = await ctx.db.inspectionDamage.update({
                where: { id: input.damageId },
                data: input.data,
            });

            return updatedDamage;
        }),

    // Remove damage
    removeDamage: protectedProcedure
        .input(z.object({ damageId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
            const damage = await ctx.db.inspectionDamage.findUnique({
                where: { id: input.damageId },
                include: {
                    inspection: {
                        include: {
                            order: { select: { tenantId: true } },
                        },
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

    // Sign inspection
    sign: protectedProcedure
        .input(
            z.object({
                inspectionId: z.string(),
                signatureUrl: z.string(),
                signedVia: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    order: { select: { tenantId: true } },
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const signed = await ctx.db.inspection.update({
                where: { id: inspection.id },
                data: {
                    signatureUrl: input.signatureUrl,
                    signedAt: new Date(),
                    signedVia: input.signedVia || 'web',
                },
            });

            return signed;
        }),
});
