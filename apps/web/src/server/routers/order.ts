import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { sanitizeInput } from '@/lib/sanitize';
import { OrderStatus as PrismaOrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { sendPushToOwners, sendPushToMember } from '@/lib/push-notifications';

const validTransitions: Record<string, string[]> = {
    AGENDADO: ['EM_VISTORIA', 'CANCELADO'],
    EM_VISTORIA: ['EM_EXECUCAO', 'CANCELADO'],
    EM_EXECUCAO: ['AGUARDANDO_PAGAMENTO', 'CANCELADO'],
    AGUARDANDO_PAGAMENTO: ['CONCLUIDO', 'CANCELADO'],
    CONCLUIDO: [],
    CANCELADO: ['AGENDADO'],
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
    productId: z.string().optional(),
    customName: z.string().optional(),
    costPrice: z.number().min(0).optional(),
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
                            tenantId: ctx.tenantId!,
                            serviceId: item.serviceId,
                            customName: item.customName ? sanitizeInput(item.customName) : undefined,
                            price: item.price,
                            quantity: item.quantity,
                            notes: item.notes ? sanitizeInput(item.notes) : undefined,
                        })),
                    },
                    products: input.products ? {
                        create: input.products.map((product) => ({
                            tenantId: ctx.tenantId!,
                            productId: product.productId,
                            customName: product.customName ? sanitizeInput(product.customName) : undefined,
                            costPrice: product.costPrice,
                            quantity: product.quantity,
                        })),
                    } : undefined,
                },
            });

            // 📦 AUTOMATIC INVENTORY TEMPLATES
            // Fetch standard products for the services added
            const serviceIds = input.items.filter(i => i.serviceId).map(i => i.serviceId as string);
            if (serviceIds.length > 0) {
                const templates = await ctx.db.serviceProductTemplate.findMany({
                    where: { serviceId: { in: serviceIds } },
                    include: { product: true }
                });

                if (templates.length > 0) {
                    await ctx.db.orderProduct.createMany({
                        data: templates.map(t => ({
                            tenantId: ctx.tenantId!,
                            orderId: order.id,
                            productId: t.productId,
                            quantity: t.quantity,
                            costPrice: t.product.costPrice,
                            customName: t.product.name,
                        }))
                    });
                }
            }

            // Add manual products if any
            if (input.products && input.products.length > 0) {
                // Fetch costs for stock products
                const stockProductIds = input.products.filter(p => p.productId).map(p => p.productId as string);
                const stockProducts = await ctx.db.product.findMany({
                    where: { id: { in: stockProductIds } },
                    select: { id: true, costPrice: true, name: true }
                });

                await ctx.db.orderProduct.createMany({
                    data: input.products.map(p => {
                        const stockP = stockProducts.find(sp => sp.id === p.productId);
                        return {
                            tenantId: ctx.tenantId!,
                            orderId: order.id,
                            productId: p.productId,
                            quantity: p.quantity,
                            costPrice: p.costPrice || stockP?.costPrice || 0,
                            customName: p.customName || stockP?.name || 'Item Personalizado',
                        };
                    })
                });
            }

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

            // Push notification para owners/managers
            sendPushToOwners(ctx.tenantId!, {
                title: '🆕 Nova OS Criada',
                body: `OS #${order.code} - ${vehicle.plate}`,
                url: `/dashboard/orders/${order.id}`,
                tag: `new-order-${order.id}`,
            }, 'onNewOrder').catch(() => {
                // Silently fail - push is non-critical
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
                            commissions: true,
                        },
                    },
                    payments: true,
                    assignedTo: true,
                    createdBy: true,
                    products: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const paidAmount = order.payments.reduce(
                (sum: number, p: any) => sum + Number(p.amount),
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

            const where: Prisma.ServiceOrderWhereInput = {
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

            const where: Prisma.ServiceOrderWhereInput = {
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
                take: 5000,
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

            return { success: true };
        }),

    addProduct: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            productId: z.string().optional(),
            customName: z.string().optional(),
            costPrice: z.number().min(0).optional(),
            quantity: z.number().min(0.01),
        }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! }
            });

            if (!order) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'OS não encontrada' });
            }

            let costPrice = input.costPrice || 0;
            let name = input.customName || 'Item Personalizado';

            if (input.productId) {
                const product = await ctx.db.product.findFirst({
                    where: { id: input.productId, tenantId: ctx.tenantId! }
                });
                if (product) {
                    costPrice = input.costPrice !== undefined ? input.costPrice : Number(product.costPrice);
                    name = input.customName || product.name;
                }
            }

            const orderProduct = await ctx.db.orderProduct.create({
                data: {
                    tenantId: ctx.tenantId!,
                    orderId: input.orderId,
                    productId: input.productId,
                    customName: name,
                    costPrice: costPrice,
                    quantity: input.quantity,
                }
            });

            // If inventory already deducted, we should probably deduct this new one too?
            // For now, Phase 3 is about tracking CMV. Inventory deduction happens on status change.
            // If already deducted, we might need a separate logic or just deduct immediately.
            if (order.inventoryDeducted && input.productId) {
                await ctx.db.product.update({
                    where: { id: input.productId },
                    data: { stock: { decrement: input.quantity } }
                });

                await ctx.db.stockMovement.create({
                    data: {
                        tenantId: ctx.tenantId!,
                        productId: input.productId,
                        type: 'SAIDA_OS',
                        quantity: -input.quantity,
                        notes: `Adição manual na OS ${order.code} (Já executada)`,
                        createdBy: ctx.user!.id,
                        reference: `OS-${order.code}`,
                    }
                });
            }

            return orderProduct;
        }),

    updateProductQuantity: protectedProcedure
        .input(z.object({
            id: z.string(),
            quantity: z.number().min(0.01),
        }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.orderProduct.findFirst({
                where: { id: input.id },
                include: { order: true }
            });

            if (!item) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
            }

            const diff = input.quantity - item.quantity;

            // Update inventory if already deducted
            if (item.order.inventoryDeducted && item.productId) {
                await ctx.db.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: diff } }
                });

                await ctx.db.stockMovement.create({
                    data: {
                        tenantId: ctx.tenantId!,
                        productId: item.productId,
                        type: 'AJUSTE',
                        quantity: -diff,
                        notes: `Ajuste manual de quantidade na OS ${item.order.code}`,
                        createdBy: ctx.user!.id,
                        reference: `OS-${item.order.code}`,
                    }
                });
            }

            return await ctx.db.orderProduct.update({
                where: { id: input.id },
                data: { quantity: input.quantity }
            });
        }),

    removeProduct: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.orderProduct.findFirst({
                where: { id: input.id },
                include: { order: true }
            });

            if (!item) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
            }

            // Reverse inventory if already deducted
            if (item.order.inventoryDeducted && item.productId) {
                await ctx.db.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });

                await ctx.db.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'ENTRADA',
                        quantity: item.quantity,
                        notes: `Remoção manual na OS ${item.order.code} (Estorno)`,
                        createdBy: ctx.user!.id,
                        reference: `OS-${item.order.code}`,
                    }
                });
            }

            await ctx.db.orderProduct.delete({
                where: { id: input.id }
            });

            return { success: true };
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), data: orderUpdateSchema }))
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: Prisma.ServiceOrderWhereInput = { id: input.id, tenantId: ctx.tenantId! };

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
                        tenantId: ctx.tenantId!,
                        orderId: input.id,
                        serviceId: item.serviceId,
                        customName: item.customName ? sanitizeInput(item.customName) : undefined,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.notes ? sanitizeInput(item.notes) : undefined,
                    })),
                });

                // 📦 RE-CALCULATE INVENTORY TEMPLATES (only if inventory hasn't been deducted yet)
                if (!existing.inventoryDeducted) {
                    await ctx.db.orderProduct.deleteMany({
                        where: { orderId: input.id }
                    });

                    const serviceIds = input.data.items.filter(i => i.serviceId).map(i => i.serviceId as string);
                    if (serviceIds.length > 0) {
                        const templates = await ctx.db.serviceProductTemplate.findMany({
                            where: { serviceId: { in: serviceIds } },
                            include: { product: true }
                        });

                        if (templates.length > 0) {
                            await ctx.db.orderProduct.createMany({
                                data: templates.map(t => ({
                                    tenantId: ctx.tenantId!,
                                    orderId: input.id,
                                    productId: t.productId,
                                    quantity: t.quantity,
                                    costPrice: t.product.costPrice,
                                    customName: t.product.name,
                                }))
                            });
                        }
                    }
                }
            }

            // Calculate new totals
            // Use new items if provided, otherwise use existing
            const itemsToCalc = input.data.items
                ? input.data.items
                : existing.items.map((i: any) => ({
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

            // Notificar membro se foi (re)atribuído
            if (input.data.assignedToId && input.data.assignedToId !== existing.assignedToId) {
                sendPushToMember(input.data.assignedToId, {
                    title: '📋 OS Atribuída a Você',
                    body: `OS #${order.code} foi atribuída a você`,
                    url: `/dashboard/orders/${order.id}`,
                    tag: `assigned-${order.id}`,
                }, 'onAssignedToMe').catch(() => {
                    // Silently fail
                });
            }

            return order;
        }),

    updateStatus: protectedProcedure
        .input(z.object({
            id: z.string(),
            status: z.nativeEnum(PrismaOrderStatus),
        }))
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: Prisma.ServiceOrderWhereInput = { id: input.id, tenantId: ctx.tenantId! };

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

            // 🔒 BLOQUEIO: Verificar vistoria de saída antes de concluir (respeitando configuração do Tenant)
            if (input.status === 'CONCLUIDO') {
                const tenant = await ctx.db.tenant.findUnique({
                    where: { id: ctx.tenantId! },
                    select: { inspectionRequired: true }
                });

                const isExitRequired = tenant?.inspectionRequired === 'EXIT' || tenant?.inspectionRequired === 'BOTH';

                if (isExitRequired) {
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
                    ...(input.status === 'EM_EXECUCAO' && !existing.inventoryDeducted ? { inventoryDeducted: true } : {}),
                    ...timestamps,
                },
                include: {
                    products: true,
                    items: {
                        include: { service: true }
                    },
                    assignedTo: true,
                }
            });

            // 💰 SNAPSHOT DE COMISSÃO: Registrar valores quando a OS é concluída
            if (input.status === 'CONCLUIDO') {
                for (const item of order.items) {
                    // Valor da comissão: Prioridade para o Serviço (se > 0), depois o Técnico (User)
                    let commissionPercent = 0;
                    const servicePercent = item.service?.defaultCommissionPercent ? Number(item.service.defaultCommissionPercent) : 0;
                    const userPercent = order.assignedTo?.defaultCommissionPercent ? Number(order.assignedTo.defaultCommissionPercent) : 0;

                    if (servicePercent > 0) {
                        commissionPercent = servicePercent;
                    } else {
                        commissionPercent = userPercent;
                    }

                    const commissionValue = (Number(item.price) * item.quantity) * (commissionPercent / 100);

                    if (commissionValue > 0) {
                        await ctx.db.orderItemCommission.upsert({
                            where: { orderItemId: item.id },
                            create: {
                                tenantId: ctx.tenantId!,
                                orderItemId: item.id,
                                userId: order.assignedToId,
                                commissionValue,
                            },
                            update: {
                                commissionValue, // Update in case price/quantity changed before completion
                            }
                        });
                    }
                }
            }

            // 📦 GATILHO DE ESTOQUE: Baixa automática ao entrar em execução
            if (input.status === 'EM_EXECUCAO' && !existing.inventoryDeducted) {
                // Fetch products in this order
                const orderWithProducts = await ctx.db.serviceOrder.findUnique({
                    where: { id: input.id },
                    include: { products: true }
                });

                if (orderWithProducts?.products) {
                    for (const op of orderWithProducts.products) {
                        if (!op.productId) continue; // Skip custom items (no stock link)

                        const quantity = op.quantity;
                        const productId = op.productId;

                        // Update stock and create movement record in transaction
                        await ctx.db.$transaction([
                            ctx.db.product.update({
                                where: { id: productId },
                                data: { stock: { decrement: quantity } }
                            }),
                            ctx.db.stockMovement.create({
                                data: {
                                    tenantId: ctx.tenantId!,
                                    productId,
                                    quantity: -quantity,
                                    type: 'SAIDA_OS',
                                    reference: `OS-${order.code}`,
                                    notes: `Baixa automática: OS #${order.code} em execução`,
                                    createdBy: ctx.user!.id,
                                }
                            })
                        ]);
                    }
                }
            }

            // 🚫 GATILHO DE CANCELAMENTO: Estornar estoque e deletar comissões
            if (input.status === 'CANCELADO') {
                // 1. Deletar comissões (Snapshot de comissão é deletado se a OS for cancelada)
                await ctx.db.orderItemCommission.deleteMany({
                    where: {
                        orderItem: { orderId: order.id }
                    }
                });

                // 2. Estornar estoque se já tiver sido baixado
                if (existing.inventoryDeducted) {
                    const orderWithProducts = await ctx.db.serviceOrder.findUnique({
                        where: { id: input.id },
                        include: { products: true }
                    });

                    if (orderWithProducts?.products) {
                        for (const op of orderWithProducts.products) {
                            if (!op.productId) continue;

                            await ctx.db.$transaction([
                                ctx.db.product.update({
                                    where: { id: op.productId },
                                    data: { stock: { increment: op.quantity } }
                                }),
                                ctx.db.stockMovement.create({
                                    data: {
                                        tenantId: ctx.tenantId!,
                                        productId: op.productId,
                                        quantity: op.quantity,
                                        type: 'AJUSTE',
                                        reference: `OS-${order.code}`,
                                        notes: `Estorno automático: OS #${order.code} cancelada`,
                                        createdBy: ctx.user!.id,
                                    }
                                })
                            ]);
                        }
                    }

                    // Resetar flags no banco
                    await ctx.db.serviceOrder.update({
                        where: { id: order.id },
                        data: { inventoryDeducted: false }
                    });
                }
            }

            // 🛡️ AUDITORIA: Registrar mudança de status
            await ctx.db.auditLog.create({
                data: {
                    tenantId: ctx.tenantId!,
                    userId: ctx.user!.id,
                    action: 'UPDATE_STATUS',
                    entityType: 'ServiceOrder',
                    entityId: order.id,
                    oldValue: { status: existing.status } as any,
                    newValue: { status: order.status } as any,
                    metadata: { code: order.code } as any,
                }
            });

            // Notificar owners quando OS é concluída
            if (input.status === 'CONCLUIDO') {
                sendPushToOwners(ctx.tenantId!, {
                    title: '✅ OS Concluída',
                    body: `OS #${order.code} foi finalizada`,
                    url: `/dashboard/orders/${order.id}`,
                    tag: `completed-${order.id}`,
                }, 'onOrderCompleted').catch(() => {
                    // Silently fail
                });
            }

            // Notificar membro atribuído sobre mudança de status
            if (existing.assignedToId && existing.assignedToId !== ctx.user?.id) {
                const statusLabels: Record<string, string> = {
                    EM_VISTORIA: 'Em Vistoria',
                    EM_EXECUCAO: 'Em Execução',
                    AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
                    CONCLUIDO: 'Concluída',
                    CANCELADO: 'Cancelada',
                };
                sendPushToMember(existing.assignedToId, {
                    title: '🔄 Status Alterado',
                    body: `OS #${order.code}: ${statusLabels[input.status] || input.status}`,
                    url: `/dashboard/orders/${order.id}`,
                    tag: `status-${order.id}`,
                }, 'onMyOrderStatusChange').catch(() => {
                    // Silently fail
                });
            }

            return order;
        }),

    reopen: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.id, tenantId: ctx.tenantId! }
            });

            if (!order) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ordem de serviço não encontrada' });
            }

            if (order.status !== 'CANCELADO') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas ordens canceladas podem ser reabertas' });
            }

            const updatedOrder = await ctx.db.serviceOrder.update({
                where: { id: input.id },
                data: {
                    status: 'AGENDADO',
                    completedAt: null,
                }
            });

            // 🛡️ AUDITORIA: Registrar reabertura
            await ctx.db.auditLog.create({
                data: {
                    tenantId: ctx.tenantId!,
                    userId: ctx.user!.id,
                    action: 'REOPEN',
                    entityType: 'ServiceOrder',
                    entityId: order.id,
                    oldValue: { status: 'CANCELADO' } as any,
                    newValue: { status: 'AGENDADO' } as any,
                    metadata: { code: order.code } as any,
                }
            });

            return updatedOrder;
        }),

    getMyTasks: protectedProcedure
        .query(async ({ ctx }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + 7);
            endOfWeek.setHours(23, 59, 59, 999);

            const orders = await ctx.db.serviceOrder.findMany({
                where: {
                    tenantId: ctx.tenantId!,
                    assignedToId: ctx.user!.id,
                    status: {
                        notIn: ['CONCLUIDO', 'CANCELADO'],
                    },
                    scheduledAt: {
                        lte: endOfWeek,
                    },
                },
                orderBy: { scheduledAt: 'asc' },
                take: 20,
                include: {
                    vehicle: {
                        include: {
                            customer: { select: { id: true, name: true, phone: true } },
                        },
                    },
                    items: {
                        include: { service: { select: { name: true } } },
                    },
                },
            });

            const todayOrders = orders.filter(o => {
                const d = new Date(o.scheduledAt);
                return d >= today && d < new Date(today.getTime() + 86400000);
            });
            const upcomingOrders = orders.filter(o => {
                const d = new Date(o.scheduledAt);
                return d >= new Date(today.getTime() + 86400000);
            });

            return { todayOrders, upcomingOrders };
        }),

    addPayment: protectedProcedure
        .input(paymentSchema)
        .mutation(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const where: Prisma.ServiceOrderWhereInput = { id: input.orderId, tenantId: ctx.tenantId! };

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
                (sum: number, p: any) => sum + Number(p.amount),
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
                    tenantId: ctx.tenantId!,
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
                const tenant = await ctx.db.tenant.findUnique({
                    where: { id: ctx.tenantId! },
                    select: { inspectionRequired: true }
                });

                const isExitRequired = tenant?.inspectionRequired === 'EXIT' || tenant?.inspectionRequired === 'BOTH';
                let canComplete = !isExitRequired;

                if (isExitRequired) {
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
                        canComplete = true;
                    }
                }

                if (canComplete) {
                    const completedOrder = await ctx.db.serviceOrder.update({
                        where: { id: input.orderId },
                        data: {
                            status: 'CONCLUIDO',
                            completedAt: new Date(),
                        },
                        include: {
                            items: {
                                include: { service: true }
                            },
                            assignedTo: true,
                        }
                    });

                    // 💰 SNAPSHOT DE COMISSÃO: Registrar valores no fechamento automático por pagamento
                    for (const item of completedOrder.items) {
                        let commissionPercent = 0;
                        const servicePercent = item.service?.defaultCommissionPercent ? Number(item.service.defaultCommissionPercent) : 0;
                        const userPercent = completedOrder.assignedTo?.defaultCommissionPercent ? Number(completedOrder.assignedTo.defaultCommissionPercent) : 0;

                        if (servicePercent > 0) {
                            commissionPercent = servicePercent;
                        } else {
                            commissionPercent = userPercent;
                        }

                        const commissionValue = (Number(item.price) * item.quantity) * (commissionPercent / 100);

                        if (commissionValue > 0) {
                            await ctx.db.orderItemCommission.upsert({
                                where: { orderItemId: item.id },
                                create: {
                                    tenantId: ctx.tenantId!,
                                    orderItemId: item.id,
                                    userId: completedOrder.assignedToId,
                                    commissionValue,
                                },
                                update: {
                                    commissionValue,
                                }
                            });
                        }
                    }
                }
            }

            return payment;
        }),

    getStats: protectedProcedure
        .query(async ({ ctx }) => {
            const isMember = ctx.user?.role === 'MEMBER';
            const baseWhere: Prisma.ServiceOrderWhereInput = {
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
            const where: Prisma.ServiceOrderWhereInput = { tenantId: ctx.tenantId! };
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

    getPendingCommissions: protectedProcedure
        .input(z.object({
            userId: z.string().optional(),
            dateFrom: z.date().optional(),
            dateTo: z.date().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const isMember = ctx.user?.role === 'MEMBER';

            const where: any = {
                settlementId: null,
            };

            if (isMember) {
                where.userId = ctx.user!.id;
            } else if (input.userId) {
                where.userId = input.userId;
            }

            if (input.dateFrom || input.dateTo) {
                where.calculatedAt = {
                    gte: input.dateFrom,
                    lte: input.dateTo,
                };
            }

            return await ctx.db.orderItemCommission.findMany({
                where,
                include: {
                    user: true,
                    orderItem: {
                        include: {
                            order: true,
                            service: true,
                        }
                    }
                },
                orderBy: { calculatedAt: 'desc' }
            });
        }),

    createSettlement: protectedProcedure
        .input(z.object({
            userId: z.string(),
            commissionIds: z.array(z.string()).min(1),
            paymentMethod: z.string().optional(),
            paymentRef: z.string().optional(),
            periodStart: z.date(),
            periodEnd: z.date(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user?.role === 'MEMBER') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas gestores podem realizar acertos' });
            }

            const commissions = await ctx.db.orderItemCommission.findMany({
                where: {
                    id: { in: input.commissionIds },
                    userId: input.userId,
                    settlementId: null,
                }
            });

            if (commissions.length === 0) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhuma comissão pendente encontrada para este técnico' });
            }

            const totalPaid = commissions.reduce((acc, c) => acc + Number(c.commissionValue), 0);

            return await ctx.db.$transaction(async (tx) => {
                const settlement = await tx.commissionSettlement.create({
                    data: {
                        tenantId: ctx.tenantId!,
                        userId: input.userId,
                        totalPaid,
                        paymentMethod: input.paymentMethod,
                        paymentRef: input.paymentRef,
                        periodStart: input.periodStart,
                        periodEnd: input.periodEnd,
                        createdBy: ctx.user!.id,
                    }
                });

                await tx.orderItemCommission.updateMany({
                    where: { id: { in: input.commissionIds } },
                    data: { settlementId: settlement.id }
                });

                await (tx.auditLog as any).create({
                    data: {
                        tenantId: ctx.tenantId!,
                        userId: ctx.user!.id,
                        action: 'CREATE_SETTLEMENT',
                        entityType: 'CommissionSettlement',
                        entityId: settlement.id,
                        newValue: { totalPaid, userId: input.userId },
                    }
                }).catch(() => { });

                return settlement;
            });
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
                                inspectionSignature: true,
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
                        inspectionSignature: (order.tenant as any).inspectionSignature ?? true,
                    },
                    services: order.items.map((item: any) => ({
                        name: item.customName || item.service?.name || 'Serviço',
                        total: Number(item.price) * item.quantity,
                    })),
                    total: Number(order.total),
                    inspections: inspections.map((inspection: any) => {
                        const requiredItems = inspection.items.filter((i: any) => i.isRequired);
                        const completedRequired = requiredItems.filter((i: any) => i.status !== 'pendente').length;
                        const allRequiredCompleted = requiredItems.length > 0 && completedRequired === requiredItems.length;
                        const canSign = allRequiredCompleted && !inspection.signatureUrl && (order.tenant as any).inspectionSignature !== false;

                        return {
                            id: inspection.id,
                            type: inspection.type,
                            status: inspection.status,
                            signatureUrl: inspection.signatureUrl,
                            signedAt: inspection.signedAt,
                            createdAt: inspection.createdAt,
                            canSign,
                            items: inspection.items.map((item: any) => ({
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
                            damages: inspection.damages.map((d: any) => ({
                                id: d.id,
                                position: d.position,
                                damageType: d.damageType,
                                notes: d.notes,
                                photoUrl: d.photoUrl,
                            })),
                        };
                    }),
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
