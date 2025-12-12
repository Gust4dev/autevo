import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const vehicleCreateSchema = z.object({
    plate: z.string().min(7, 'Placa inválida').max(8),
    brand: z.string().min(2, 'Marca obrigatória'),
    model: z.string().min(1, 'Modelo obrigatório'),
    color: z.string().min(2, 'Cor obrigatória'),
    year: z.number().min(1900).max(2030).optional(),
    customerId: z.string(),
});

const vehicleUpdateSchema = vehicleCreateSchema.omit({ customerId: true }).partial();

const vehicleListSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
    customerId: z.string().optional(),
});

export const vehicleRouter = router({
    // List vehicles with pagination
    list: protectedProcedure
        .input(vehicleListSchema)
        .query(async ({ ctx, input }) => {
            const { page, limit, search, customerId } = input;
            const skip = (page - 1) * limit;

            const where = {
                tenantId: ctx.tenantId!,
                ...(customerId && { customerId }),
                ...(search && {
                    OR: [
                        { plate: { contains: search, mode: 'insensitive' as const } },
                        { brand: { contains: search, mode: 'insensitive' as const } },
                        { model: { contains: search, mode: 'insensitive' as const } },
                    ],
                }),
            };

            const [vehicles, total] = await Promise.all([
                ctx.db.vehicle.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },
                        },
                        _count: {
                            select: { orders: true },
                        },
                    },
                }),
                ctx.db.vehicle.count({ where }),
            ]);

            return {
                vehicles,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),

    // Get single vehicle by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const vehicle = await ctx.db.vehicle.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    customer: true,
                    orders: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            items: {
                                include: { service: true },
                            },
                        },
                    },
                    _count: {
                        select: { orders: true },
                    },
                },
            });

            if (!vehicle) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Veículo não encontrado',
                });
            }

            return vehicle;
        }),

    // Create new vehicle
    create: protectedProcedure
        .input(vehicleCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // Verify customer belongs to tenant
            const customer = await ctx.db.customer.findFirst({
                where: {
                    id: input.customerId,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!customer) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Cliente não encontrado',
                });
            }

            // Check for duplicate plate in tenant
            const existing = await ctx.db.vehicle.findFirst({
                where: {
                    tenantId: ctx.tenantId!,
                    plate: input.plate.toUpperCase(),
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Já existe um veículo com esta placa',
                });
            }

            const vehicle = await ctx.db.vehicle.create({
                data: {
                    ...input,
                    plate: input.plate.toUpperCase(),
                    tenantId: ctx.tenantId!,
                },
            });

            return vehicle;
        }),

    // Update vehicle
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: vehicleUpdateSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify vehicle belongs to tenant
            const existing = await ctx.db.vehicle.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Veículo não encontrado',
                });
            }

            // Check for duplicate plate if changing
            if (input.data.plate && input.data.plate !== existing.plate) {
                const duplicate = await ctx.db.vehicle.findFirst({
                    where: {
                        tenantId: ctx.tenantId!,
                        plate: input.data.plate.toUpperCase(),
                        id: { not: input.id },
                    },
                });

                if (duplicate) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Já existe outro veículo com esta placa',
                    });
                }
            }

            const vehicle = await ctx.db.vehicle.update({
                where: { id: input.id },
                data: {
                    ...input.data,
                    plate: input.data.plate?.toUpperCase(),
                },
            });

            return vehicle;
        }),

    // Delete vehicle (manager only)
    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.vehicle.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    _count: { select: { orders: true } },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Veículo não encontrado',
                });
            }

            if (existing._count.orders > 0) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'Veículo possui ordens de serviço e não pode ser excluído',
                });
            }

            await ctx.db.vehicle.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // Quick search by plate for autocomplete
    searchByPlate: protectedProcedure
        .input(z.object({ plate: z.string().min(2) }))
        .query(async ({ ctx, input }) => {
            const vehicles = await ctx.db.vehicle.findMany({
                where: {
                    tenantId: ctx.tenantId!,
                    plate: { contains: input.plate, mode: 'insensitive' },
                },
                take: 10,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            });

            return vehicles;
        }),
});
