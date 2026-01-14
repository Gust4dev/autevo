import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { sanitizeInput } from '@/lib/sanitize';
import { OrderStatus as PrismaOrderStatus, PaymentMethod } from '@prisma/client';

const validTransitions: Record<string, string[]> = {
    AGENDADO: ['EM_VISTORIA', 'CANCELADO'],
    EM_VISTORIA: ['EM_EXECUCAO', 'CANCELADO'],
    EM_EXECUCAO: ['AGUARDANDO_PAGAMENTO', 'CANCELADO'],
    AGUARDANDO_PAGAMENTO: ['CONCLUIDO'],
    CONCLUIDO: [],
    CANCELADO: [],
};

const MAX_PRICE = 99999999.99;
const MAX_PRICE_ERROR = 'O valor informado excede o limite permitido. Verifique se inseriu o preço corretamente (ex: 150.00 e não 15000).';

const orderItemSchema = z.object({
    serviceId: z.string().optional(),
    customName: z.string().optional(),
    price: z.number().min(0).max(MAX_PRICE, MAX_PRICE_ERROR),
    quantity: z.number().min(1).default(1),
    notes: z.string().optional(),
});

const orderProductSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
});

const orderCreateSchema = z.object({
    vehicleId: z.string(),
    scheduledAt: z.date(),
    assignedToId: z.string(),
    items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um serviço'),
    products: z.array(orderProductSchema).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().min(0).optional(),
}).refine((data) => {
    if (data.discountType === 'FIXED' && data.discountValue) {
        const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return data.discountValue <= subtotal;
    }
    return true;
}, {
    message: "O valor do desconto não pode ser maior que o subtotal dos serviços",
    path: ["discountValue"]
});

const orderUpdateSchema = z.object({
    scheduledAt: z.date().optional(),
    assignedToId: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().min(0).optional(),
    items: z.array(orderItemSchema).optional(),
});

const paymentSchema = z.object({
    orderId: z.string(),
    method: z.nativeEnum(PaymentMethod),
    amount: z.number().min(0).max(MAX_PRICE, MAX_PRICE_ERROR),
    paidAt: z.date().optional(),
    notes: z.string().optional(),
});

export const orderRouter = router({
    create: protectedProcedure
        .input(orderCreateSchema)
        .mutation(async ({ ctx, input }) => {
            const { subtotal, total } = calculateTotals(
                input.items,
                input.discountType,
                input.discountValue
            );

            // Fetch vehicle to get current owner
            const vehicle = await ctx.db.vehicle.findFirst({
                where: { id: input.vehicleId, deletedAt: null },
                select: { customerId: true, plate: true }
            });

            if (!vehicle) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Veículo não encontrado'
                });
            }

            const order = await ctx.db.serviceOrder.create({
                data: {
                    tenantId: ctx.tenantId!,
                    vehicleId: input.vehicleId,
                    customerId: vehicle.customerId, // Capture current owner
                    assignedToId: input.assignedToId,
                    createdById: ctx.user!.id,
                    scheduledAt: input.scheduledAt,
                    status: 'AGENDADO',
                    subtotal,
                    discountType: input.discountType,
                    discountValue: input.discountValue,
                    total,
                    code: `OS-${Date.now()}`,
                    items: {
                        create: input.items.map((item) => ({
                            serviceId: item.serviceId,
                            customName: item.customName ? sanitizeInput(item.customName) : undefined,
                            price: item.price,
                            quantity: item.quantity,
                            notes: item.notes ? sanitizeInput(item.notes) : undefined,
                        })),
                    },
                },
            });

            await ctx.db.notificationLog.create({
                data: {
                    tenantId: ctx.tenantId!,
                    orderId: order.id,
                    type: 'AGENDAMENTO_CONFIRMADO',
                    recipient: 'system', // Internal notification
                    channel: 'in_app',
                    message: `Nova OS #${order.code} criada para ${vehicle.plate}`,
                    status: 'pending',
                }
            });

            return order;
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.id, tenantId: ctx.tenantId! },
                include: {
                    vehicle: {
                        include: {
                            customer: true,
                        },
                    },
                    items: {
                        include: {
                            service: true,
                        },
                    },
                    payments: true,
                    assignedTo: true,
                    createdBy: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const paidAmount = order.payments.reduce(
                (sum, p) => sum + Number(p.amount),
                0
            );
            const balance = Number(order.total) - paidAmount;

            return {
                ...order,
                paidAmount,
                balance,
            };
        }),

    list: protectedProcedure
        .input(z.object({
            page: z.number().default(1),
            limit: z.number().default(10),
            search: z.string().optional(),
            status: z.array(z.nativeEnum(PrismaOrderStatus)).optional(),
            dateFrom: z.date().optional(),
            dateTo: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';

            const where: any = {
                tenantId: ctx.tenantId!,
                status: input.status && input.status.length > 0 ? { in: input.status } : undefined,
                OR: input.search ? [
                    { code: { contains: input.search, mode: 'insensitive' } },
                    { vehicle: { plate: { contains: input.search, mode: 'insensitive' } } },
                    { vehicle: { customer: { name: { contains: input.search, mode: 'insensitive' } } } },
                ] : undefined,
            };

            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            const [orders, count] = await Promise.all([
                ctx.db.serviceOrder.findMany({
                    where,
                    skip: (input.page - 1) * input.limit,
                    take: input.limit,
                    orderBy: {
                        scheduledAt: 'asc',
                    },
                    include: {
                        vehicle: {
                            include: {
                                customer: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                        items: {
                            include: {
                                service: {
                                    select: { name: true },
                                },
                            },
                        },
                        assignedTo: {
                            select: { name: true },
                        },
                    },
                }),
                ctx.db.serviceOrder.count({ where }),
            ]);

            return {
                orders,
                total: count,
                pages: Math.ceil(count / input.limit),
            };
        }),

    listAll: protectedProcedure
        .input(z.object({
            search: z.string().optional(),
            status: z.array(z.nativeEnum(PrismaOrderStatus)).optional(),
            dateFrom: z.date().optional(),
            dateTo: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';

            const where: any = {
                tenantId: ctx.tenantId!,
                status: input?.status && input.status.length > 0 ? { in: input.status } : undefined,
                OR: input?.search ? [
                    { code: { contains: input.search, mode: 'insensitive' } },
                    { vehicle: { plate: { contains: input.search, mode: 'insensitive' } } },
                    { vehicle: { customer: { name: { contains: input.search, mode: 'insensitive' } } } },
                ] : undefined,
                createdAt: (input?.dateFrom || input?.dateTo) ? {
                    gte: input.dateFrom,
                    lte: input.dateTo,
                } : undefined,
            };

            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            return ctx.db.serviceOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    vehicle: {
                        include: {
                            customer: { select: { name: true } },
                        },
                    },
                    assignedTo: { select: { name: true } },
                },
            });
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), data: orderUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: any = { id: input.id, tenantId: ctx.tenantId! };

            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            const existing = await ctx.db.serviceOrder.findFirst({
                where,
                include: { items: true },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            if (input.data.assignedToId) {
                const assignedUser = await ctx.db.user.findFirst({
                    where: { id: input.data.assignedToId, tenantId: ctx.tenantId! },
                });
                if (!assignedUser) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Responsável não encontrado',
                    });
                }
            }

            if (input.data.items) {
                // Delete existing items
                await ctx.db.orderItem.deleteMany({
                    where: { orderId: input.id },
                });

                // Create new items
                await ctx.db.orderItem.createMany({
                    data: input.data.items.map((item) => ({
                        orderId: input.id,
                        serviceId: item.serviceId,
                        customName: item.customName ? sanitizeInput(item.customName) : undefined,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.notes ? sanitizeInput(item.notes) : undefined,
                    })),
                });
            }

            // Calculate new totals
            // Use new items if provided, otherwise use existing
            const itemsToCalc = input.data.items
                ? input.data.items
                : existing.items.map((i) => ({
                    price: Number(i.price),
                    quantity: i.quantity,
                }));

            const { subtotal, total } = calculateTotals(
                itemsToCalc,
                input.data.discountType || existing.discountType || undefined,
                input.data.discountValue !== undefined
                    ? input.data.discountValue
                    : Number(existing.discountValue) || undefined
            );

            const order = await ctx.db.serviceOrder.update({
                where: { id: input.id },
                data: {
                    scheduledAt: input.data.scheduledAt,
                    assignedToId: input.data.assignedToId,
                    discountType: input.data.discountType,
                    discountValue: input.data.discountValue,
                    subtotal,
                    total,
                },
            });

            return order;
        }),

    updateStatus: protectedProcedure
        .input(z.object({
            id: z.string(),
            status: z.nativeEnum(PrismaOrderStatus),
        }))
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: any = { id: input.id, tenantId: ctx.tenantId! };

            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            const existing = await ctx.db.serviceOrder.findFirst({
                where,
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const allowedNext = validTransitions[existing.status] || [];
            if (!allowedNext.includes(input.status)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Não é possível mudar de ${existing.status} para ${input.status}`,
                });
            }

            // 🔒 BLOQUEIO: Verificar vistoria de saída antes de concluir
            if (input.status === 'CONCLUIDO') {
                const exitInspection = await ctx.db.inspection.findUnique({
                    where: {
                        orderId_type: {
                            orderId: input.id,
                            type: 'final',
                        },
                    },
                    select: { id: true, status: true },
                });

                if (!exitInspection || exitInspection.status !== 'concluida') {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'A OS só pode ser concluída após finalizar a Vistoria de Saída. Complete todos os itens obrigatórios da vistoria antes de concluir.',
                    });
                }
            }

            // Set timestamps based on status
            const timestamps: Record<string, Date> = {};
            if (input.status === 'EM_EXECUCAO' && !existing.startedAt) {
                timestamps.startedAt = new Date();
            }
            if (input.status === 'CONCLUIDO') {
                timestamps.completedAt = new Date();
            }

            const order = await ctx.db.serviceOrder.update({
                where: { id: input.id },
                data: {
                    status: input.status,
                    ...timestamps,
                },
            });

            return order;
        }),


    addPayment: protectedProcedure
        .input(paymentSchema)
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: any = { id: input.orderId, tenantId: ctx.tenantId! };

            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            const order = await ctx.db.serviceOrder.findFirst({
                where,
                include: { payments: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const orderTotal = Number(order.total);
            const currentPaid = order.payments.reduce(
                (sum, p) => sum + Number(p.amount),
                0
            );
            const balance = orderTotal - currentPaid;

            const EPSILON = 0.01;

            if (input.amount - balance > EPSILON) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Valor excede o saldo devedor de R$ ${balance.toFixed(2)}`,
                });
            }

            const payment = await ctx.db.payment.create({
                data: {
                    orderId: input.orderId,
                    method: input.method,
                    amount: input.amount,
                    paidAt: input.paidAt || new Date(),
                    receivedBy: ctx.user!.id,
                    notes: input.notes,
                },
            });

            const newTotalPaid = currentPaid + input.amount;
            const remaining = orderTotal - newTotalPaid;

            if (remaining < EPSILON) {
                const exitInspection = await ctx.db.inspection.findUnique({
                    where: {
                        orderId_type: {
                            orderId: input.orderId,
                            type: 'final',
                        },
                    },
                    select: { status: true },
                });

                if (exitInspection?.status === 'concluida') {
                    await ctx.db.serviceOrder.update({
                        where: { id: input.orderId },
                        data: {
                            status: 'CONCLUIDO',
                            completedAt: new Date(),
                        },
                    });
                }
            }

            return payment;
        }),

    getStats: protectedProcedure
        .query(async ({ ctx }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const baseWhere: any = {
                tenantId: ctx.tenantId!,
            };

            if (isMember) {
                baseWhere.assignedToId = ctx.user!.id;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [todayOrders, inProgress, monthRevenue] = await Promise.all([
                ctx.db.serviceOrder.count({
                    where: {
                        ...baseWhere,
                        scheduledAt: { gte: today, lt: tomorrow },
                    },
                }),
                ctx.db.serviceOrder.count({
                    where: {
                        ...baseWhere,
                        status: { in: ['EM_VISTORIA', 'EM_EXECUCAO'] },
                    },
                }),
                ctx.db.serviceOrder.aggregate({
                    where: {
                        ...baseWhere,
                        status: 'CONCLUIDO',
                        completedAt: {
                            gte: new Date(today.getFullYear(), today.getMonth(), 1),
                        },
                    },
                    _sum: { total: true },
                }),
            ]);

            return {
                todayOrders,
                inProgress,
                monthRevenue: Number(monthRevenue._sum.total) || 0,
            };
        }),

    getRecent: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: any = { tenantId: ctx.tenantId! };
            if (isMember) {
                where.assignedToId = ctx.user!.id;
            }

            const orders = await ctx.db.serviceOrder.findMany({
                where,
                take: input.limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    vehicle: {
                        include: {
                            customer: { select: { id: true, name: true } },
                        },
                    },
                    items: {
                        include: { service: { select: { name: true } } },
                    },
                },
            });

            return orders;
        }),

    getPublicStatus: publicProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                const order = await ctx.db.serviceOrder.findUnique({
                    where: { id: input.orderId },
                    include: {
                        vehicle: {
                            select: {
                                plate: true,
                                model: true,
                                brand: true,
                                color: true,
                                customer: {
                                    select: { name: true }
                                }
                            }
                        },
                        tenant: {
                            select: {
                                name: true,
                                phone: true,
                                logo: true,
                                primaryColor: true,
                                secondaryColor: true,
                            }
                        },
                        items: {
                            select: {
                                id: true,
                                service: { select: { name: true } },
                                customName: true,
                                price: true,
                                quantity: true,
                            }
                        }
                    }
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
                        items: {
                            orderBy: [
                                { category: 'asc' },
                                { createdAt: 'asc' },
                            ],
                        },
                        damages: true,
                    },
                    orderBy: { createdAt: 'asc' },
                });

                return {
                    id: order.id,
                    status: order.status,
                    customerName: order.vehicle.customer?.name?.split(' ')[0] || 'Cliente',
                    vehicleName: `${order.vehicle.brand} ${order.vehicle.model}`,
                    vehicleColor: order.vehicle.color || 'N/A',
                    vehiclePlate: order.vehicle.plate
                        ? order.vehicle.plate.substring(0, 3) + '****'
                        : null,
                    tenantContact: {
                        name: order.tenant.name,
                        whatsapp: order.tenant.phone,
                        phone: order.tenant.phone,
                        logo: order.tenant.logo,
                        primaryColor: order.tenant.primaryColor || '#DC2626',
                        secondaryColor: order.tenant.secondaryColor || '#1F2937',
                    },
                    services: order.items.map(item => ({
                        name: item.customName || item.service?.name || 'Serviço',
                        total: Number(item.price) * item.quantity,
                    })),
                    total: Number(order.total),
                    inspections: inspections.map(inspection => ({
                        id: inspection.id,
                        type: inspection.type,
                        status: inspection.status,
                        signatureUrl: inspection.signatureUrl,
                        signedAt: inspection.signedAt,
                        createdAt: inspection.createdAt,
                        items: inspection.items.map(item => ({
                            id: item.id,
                            category: item.category,
                            label: item.label,
                            status: item.status,
                            photoUrl: item.photoUrl,
                            notes: item.notes,
                            isCritical: item.isCritical,
                            damageType: item.damageType,
                            severity: item.severity,
                        })),
                        damages: inspection.damages.map(d => ({
                            id: d.id,
                            position: d.position,
                            damageType: d.damageType,
                            notes: d.notes,
                            photoUrl: d.photoUrl,
                        })),
                    })),
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Erro ao buscar status público',
                    cause: error
                });
            }
        }),
});

function calculateTotals(
    items: { price: number; quantity: number }[],
    discountType?: string | null,
    discountValue?: number | null
) {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    let total = subtotal;

    if (discountType && discountValue) {
        if (discountType === 'PERCENTAGE') {
            total -= subtotal * (discountValue / 100);
        } else if (discountType === 'FIXED') {
            total -= discountValue;
        }
    }

    return {
        subtotal,
        total: Math.max(0, total),
    };
}
