import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { sanitizeInput } from '@/lib/sanitize';
import { sendPushToOwners } from '@/lib/push-notifications';

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
                deletedAt: null,
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

    // List all customers for export (no pagination)
    listAll: managerProcedure
        .input(z.object({
            search: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const where = {
                tenantId: ctx.tenantId!,
                deletedAt: null,
                ...(input?.search && {
                    OR: [
                        { name: { contains: input.search, mode: 'insensitive' as const } },
                        { phone: { contains: input.search } },
                        { email: { contains: input.search, mode: 'insensitive' as const } },
                    ],
                }),
            };

            return ctx.db.customer.findMany({
                where,
                take: 5000,
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { vehicles: true },
                    },
                },
            });
        }),

    // Get single customer by ID with vehicles
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const customer = await ctx.db.customer.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                    deletedAt: null,
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
                    deletedAt: null,
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
                        name: sanitizeInput(input.name),
                        phone: input.phone,
                        email: input.email || null,
                        document: input.document,
                        birthDate: input.birthDate,
                        instagram: input.instagram,
                        notes: input.notes ? sanitizeInput(input.notes) : null,
                        whatsappOptIn: input.whatsappOptIn,
                        tenantId: ctx.tenantId!,
                        vehicles: input.vehicle ? {
                            create: {
                                ...input.vehicle,
                                plate: input.vehicle.plate.toUpperCase().trim(),
                                brand: sanitizeInput(input.vehicle.brand),
                                model: sanitizeInput(input.vehicle.model),
                                color: sanitizeInput(input.vehicle.color),
                                tenantId: ctx.tenantId!,
                            }
                        } : undefined,
                    },
                });

                // Notificar owners sobre novo cliente
                sendPushToOwners(ctx.tenantId!, {
                    title: '👤 Novo Cliente',
                    body: `${customer.name} foi cadastrado`,
                    url: `/dashboard/customers/${customer.id}`,
                    tag: `new-customer-${customer.id}`,
                }, 'onNewCustomer').catch(() => {
                    // Silently fail
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
                        deletedAt: null,
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
                    name: input.data.name ? sanitizeInput(input.data.name) : undefined,
                    notes: input.data.notes ? sanitizeInput(input.data.notes) : undefined,
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

            // Soft delete vehicles first, then customer
            await ctx.db.vehicle.updateMany({
                where: { customerId: input.id },
                data: { deletedAt: new Date() },
            });

            await ctx.db.customer.update({
                where: { id: input.id },
                data: { deletedAt: new Date() },
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
                    deletedAt: null,
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

    getBirthdays: protectedProcedure.query(async ({ ctx }) => {
        const customers = await ctx.db.customer.findMany({
            where: {
                tenantId: ctx.tenantId!,
                birthDate: { not: null },
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                birthDate: true,
                whatsappOptIn: true,
            },
        });

        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        type BirthdayStatus = 'passed' | 'today' | 'upcoming';

        const results: Array<{
            id: string;
            name: string;
            phone: string;
            birthDate: Date;
            whatsappOptIn: boolean;
            status: BirthdayStatus;
            daysFromToday: number;
        }> = [];

        customers.forEach((customer) => {
            if (!customer.birthDate) return;

            // Usar métodos UTC para evitar bug de timezone
            const bMonth = customer.birthDate.getUTCMonth();
            const bDay = customer.birthDate.getUTCDate();

            // Verificar de -2 dias (passados) até +10 dias (futuros)
            for (let i = -2; i <= 10; i++) {
                const checkDate = new Date(todayYear, todayMonth, todayDay + i);
                if (checkDate.getMonth() === bMonth && checkDate.getDate() === bDay) {
                    let status: BirthdayStatus;
                    if (i < 0) status = 'passed';
                    else if (i === 0) status = 'today';
                    else status = 'upcoming';

                    results.push({
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        birthDate: customer.birthDate,
                        whatsappOptIn: customer.whatsappOptIn,
                        status,
                        daysFromToday: i,
                    });
                    break;
                }
            }
        });

        // Ordenar: hoje primeiro, depois futuros por proximidade, depois passados
        return results.sort((a, b) => {
            if (a.status === 'today' && b.status !== 'today') return -1;
            if (b.status === 'today' && a.status !== 'today') return 1;
            if (a.status === 'upcoming' && b.status === 'passed') return -1;
            if (b.status === 'upcoming' && a.status === 'passed') return 1;
            return a.daysFromToday - b.daysFromToday;
        });
    }),
});
