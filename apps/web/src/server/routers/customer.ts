import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const customerCreateSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    phone: z.string().min(10, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    document: z.string().optional(),
    birthDate: z.date().optional(),
    instagram: z.string().optional(),
    notes: z.string().optional(),
    whatsappOptIn: z.boolean().default(true),
    // Quick vehicle registration
    vehicle: z.object({
        plate: z.string().min(7, 'Placa inválida'),
        brand: z.string().min(2, 'Marca obrigatória'),
        model: z.string().min(2, 'Modelo obrigatório'),
        color: z.string().min(2, 'Cor obrigatória'),
        year: z.number().optional(),
    }).optional(),
});

const customerUpdateSchema = customerCreateSchema.partial();

const customerListSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'phone']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const customerRouter = router({
    // List customers with pagination and search
    list: protectedProcedure
        .input(customerListSchema)
        .query(async ({ ctx, input }) => {
            const { page, limit, search, sortBy, sortOrder } = input;
            const skip = (page - 1) * limit;

            const where = {
                tenantId: ctx.tenantId!,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' as const } },
                    ],
                }),
            };

            const [customers, total] = await Promise.all([
                ctx.db.customer.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        _count: {
                            select: { vehicles: true },
                        },
                    },
                }),
                ctx.db.customer.count({ where }),
            ]);

            return {
                customers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),

    // Get single customer by ID with vehicles
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const customer = await ctx.db.customer.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    vehicles: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            _count: { select: { orders: true } },
                        },
                    },
                },
            });

            if (!customer) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Cliente não encontrado',
                });
            }

            // Calculate total spent by customer across all their orders (even if car was sold)
            const totalSpentAgg = await ctx.db.serviceOrder.aggregate({
                where: {
                    customerId: input.id,
                    tenantId: ctx.tenantId!,
                    status: { not: 'CANCELADO' } // Don't count cancelled orders
                },
                _sum: { total: true }
            });

            return {
                ...customer,
                totalSpent: Number(totalSpentAgg._sum.total) || 0
            };
        }),

    // Create new customer
    create: protectedProcedure
        .input(customerCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // Check for duplicate phone
            const existing = await ctx.db.customer.findFirst({
                where: {
                    tenantId: ctx.tenantId!,
                    phone: input.phone,
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Já existe um cliente com este telefone',
                });
            }

            try {
                const customer = await ctx.db.customer.create({
                    data: {
                        name: input.name,
                        phone: input.phone,
                        email: input.email || null,
                        document: input.document,
                        birthDate: input.birthDate,
                        instagram: input.instagram,
                        notes: input.notes,
                        whatsappOptIn: input.whatsappOptIn,
                        tenantId: ctx.tenantId!,
                        vehicles: input.vehicle ? {
                            create: {
                                ...input.vehicle,
                                tenantId: ctx.tenantId!,
                            }
                        } : undefined,
                    },
                });
                return customer;
            } catch (error: any) {
                // Handle duplicate vehicle plate error
                if (error.code === 'P2002' && error.meta?.target?.includes('plate')) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: `O veículo com placa ${input.vehicle?.plate} já está cadastrado no sistema.`,
                    });
                }
                throw error;
            }
        }),

    // Update customer
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: customerUpdateSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify customer belongs to tenant
            const existing = await ctx.db.customer.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Cliente não encontrado',
                });
            }

            // Check for duplicate phone if changing
            if (input.data.phone && input.data.phone !== existing.phone) {
                const duplicate = await ctx.db.customer.findFirst({
                    where: {
                        tenantId: ctx.tenantId!,
                        phone: input.data.phone,
                        id: { not: input.id },
                    },
                });

                if (duplicate) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Já existe outro cliente com este telefone',
                    });
                }
            }

            const customer = await ctx.db.customer.update({
                where: { id: input.id },
                data: {
                    ...input.data,
                    email: input.data.email || null,
                },
            });

            return customer;
        }),

    // Delete customer (manager only)
    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Verify customer belongs to tenant
            const existing = await ctx.db.customer.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    vehicles: {
                        include: {
                            _count: { select: { orders: true } },
                        },
                    },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Cliente não encontrado',
                });
            }

            // Check if customer has any orders
            const hasOrders = existing.vehicles.some((v) => v._count.orders > 0);
            if (hasOrders) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'Cliente possui ordens de serviço e não pode ser excluído',
                });
            }

            // Delete vehicles first, then customer
            await ctx.db.vehicle.deleteMany({
                where: { customerId: input.id },
            });

            await ctx.db.customer.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // Quick search for autocomplete
    search: protectedProcedure
        .input(z.object({ query: z.string().min(2) }))
        .query(async ({ ctx, input }) => {
            const customers = await ctx.db.customer.findMany({
                where: {
                    tenantId: ctx.tenantId!,
                    OR: [
                        { name: { contains: input.query, mode: 'insensitive' } },
                        { phone: { contains: input.query } },
                    ],
                },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    vehicles: {
                        take: 3,
                        select: {
                            id: true,
                            plate: true,
                            brand: true,
                            model: true,
                        },
                    },
                },
            });

            return customers;
        }),
});
