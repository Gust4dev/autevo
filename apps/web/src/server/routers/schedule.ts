import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { sanitizeInput } from '@/lib/sanitize';
import { OrderStatus } from '@autevo/database';

export const scheduleRouter = router({
    /**
     * Busca todas as ordens de serviço dentro de um mês específico.
     * Retorna dados mínimos para exibição no calendário.
     */
    getByMonth: protectedProcedure
        .input(
            z.object({
                month: z.number().min(0).max(11), // 0-indexed (Jan=0)
                year: z.number().min(2020).max(2100),
            })
        )
        .query(async ({ ctx, input }) => {
            const startOfMonth = new Date(input.year, input.month, 1);
            const endOfMonth = new Date(input.year, input.month + 1, 0, 23, 59, 59, 999);

            const orders = await ctx.db.serviceOrder.findMany({
                where: {
                    tenantId: ctx.tenantId!,
                    scheduledAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: {
                    id: true,
                    code: true,
                    status: true,
                    scheduledAt: true,
                    vehicle: {
                        select: {
                            model: true,
                            plate: true,
                        },
                    },
                    items: {
                        select: {
                            service: {
                                select: { name: true },
                            },
                            customName: true,
                        },
                        take: 1, // Apenas o primeiro serviço para preview
                    },
                },
                orderBy: {
                    scheduledAt: 'asc',
                },
            });

            return orders.map((order) => ({
                id: order.id,
                code: order.code,
                status: order.status,
                scheduledAt: order.scheduledAt,
                carModel: order.vehicle.model,
                plate: order.vehicle.plate,
                service: order.items[0]?.service?.name || order.items[0]?.customName || 'Serviço',
            }));
        }),

    /**
     * Busca dados públicos de um tenant pelo slug.
     */
    getPublicTenant: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findUnique({
                where: { slug: input.slug },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                    primaryColor: true,
                    secondaryColor: true,
                    businessHours: true,
                    services: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            basePrice: true,
                            estimatedTime: true,
                        },
                    },
                },
            });

            if (!tenant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Oficina não encontrada',
                });
            }

            return tenant;
        }),

    /**
     * Retorna datas disponíveis para os próximos 30 dias.
     */
    getAvailableDates: publicProcedure
        .input(z.object({ tenantId: z.string() }))
        .query(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findUnique({
                where: { id: input.tenantId },
                select: { maxDailyCapacity: true },
            });

            if (!tenant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant não encontrado' });

            const dates = [];
            const today = startOfDay(new Date());

            for (let i = 1; i <= 30; i++) {
                const date = addDays(today, i);
                const count = await ctx.db.serviceOrder.count({
                    where: {
                        tenantId: input.tenantId,
                        scheduledAt: {
                            gte: startOfDay(date),
                            lte: endOfDay(date),
                        },
                        status: { not: 'CANCELADO' },
                    },
                });

                dates.push({
                    date,
                    available: count < tenant.maxDailyCapacity,
                    remaining: Math.max(0, tenant.maxDailyCapacity - count),
                });
            }

            return dates;
        }),

    /**
     * Cria um agendamento público (sem login).
     */
    createPublicBooking: publicProcedure
        .input(z.object({
            tenantId: z.string(),
            serviceId: z.string(),
            scheduledAt: z.date(),
            customer: z.object({
                name: z.string().min(2),
                phone: z.string().min(10),
                email: z.string().email().optional(),
            }),
            vehicle: z.object({
                plate: z.string().min(7),
                model: z.string().min(2),
                brand: z.string().min(2),
                color: z.string(),
            }),
        }))
        .mutation(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findUnique({
                where: { id: input.tenantId },
                select: { maxDailyCapacity: true, name: true },
            });

            if (!tenant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Oficina não encontrada' });

            // 1. Verificar capacidade
            const count = await ctx.db.serviceOrder.count({
                where: {
                    tenantId: input.tenantId,
                    scheduledAt: {
                        gte: startOfDay(input.scheduledAt),
                        lte: endOfDay(input.scheduledAt),
                    },
                    status: { not: 'CANCELADO' },
                },
            });

            if (count >= tenant.maxDailyCapacity) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Desculpe, a agenda para este dia já está cheia. Por favor, escolha outra data.',
                });
            }

            // 2. Buscar ou Criar Cliente
            let customer = await ctx.db.customer.findFirst({
                where: {
                    tenantId: input.tenantId,
                    phone: input.customer.phone,
                },
            });

            if (customer) {
                customer = await ctx.db.customer.update({
                    where: { id: customer.id },
                    data: {
                        name: sanitizeInput(input.customer.name),
                        email: input.customer.email,
                    },
                });
            } else {
                customer = await ctx.db.customer.create({
                    data: {
                        tenantId: input.tenantId,
                        name: sanitizeInput(input.customer.name),
                        phone: input.customer.phone,
                        email: input.customer.email,
                    },
                });
            }

            // 3. Buscar ou Criar Veículo
            const vehicle = await ctx.db.vehicle.upsert({
                where: {
                    tenantId_plate: {
                        tenantId: input.tenantId,
                        plate: input.vehicle.plate.toUpperCase(),
                    },
                },
                update: {
                    model: sanitizeInput(input.vehicle.model),
                    brand: sanitizeInput(input.vehicle.brand),
                    color: sanitizeInput(input.vehicle.color),
                },
                create: {
                    tenantId: input.tenantId,
                    customerId: customer.id,
                    plate: input.vehicle.plate.toUpperCase(),
                    model: sanitizeInput(input.vehicle.model),
                    brand: sanitizeInput(input.vehicle.brand),
                    color: sanitizeInput(input.vehicle.color),
                },
            });

            // 4. Buscar serviço para obter o preço base
            const service = await ctx.db.service.findUnique({
                where: { id: input.serviceId },
            });

            if (!service) throw new TRPCError({ code: 'NOT_FOUND', message: 'Serviço não encontrado' });

            // 5. Criar Ordem de Serviço - Atribui ao funcionário com menos OS ativas
            const allStaff = await ctx.db.user.findMany({
                where: {
                    tenantId: input.tenantId,
                    role: { in: ['OWNER', 'MANAGER', 'MEMBER'] },
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                },
            });

            if (allStaff.length === 0) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nenhum responsável encontrado para a oficina' });
            }

            // Conta ordens ativas por funcionário
            const orderCounts = await ctx.db.serviceOrder.groupBy({
                by: ['assignedToId'],
                where: {
                    tenantId: input.tenantId,
                    assignedToId: { in: allStaff.map(s => s.id) },
                    status: { notIn: [OrderStatus.CONCLUIDO, OrderStatus.CANCELADO] },
                },
                _count: true,
            });

            // Mapeia contagens
            const countMap = new Map(orderCounts.map(c => [c.assignedToId, c._count]));

            // Seleciona o funcionário com menos ordens (ou 0 se não tiver nenhuma)
            const staff = allStaff.reduce((min, current) => {
                const minCount = countMap.get(min.id) || 0;
                const currentCount = countMap.get(current.id) || 0;
                return currentCount < minCount ? current : min;
            });

            const order = await ctx.db.serviceOrder.create({
                data: {
                    tenantId: input.tenantId,
                    customerId: customer.id,
                    vehicleId: vehicle.id,
                    assignedToId: staff.id,
                    createdById: staff.id, // System created, linked to manager
                    scheduledAt: input.scheduledAt,
                    status: 'AGENDADO',
                    subtotal: service.basePrice,
                    total: service.basePrice,
                    code: `AG-${Date.now().toString().slice(-6)}`,
                    items: {
                        create: {
                            serviceId: service.id,
                            price: service.basePrice,
                            quantity: 1,
                        },
                    },
                },
            });

            // 6. Notificação interna
            await ctx.db.notificationLog.create({
                data: {
                    tenantId: input.tenantId,
                    orderId: order.id,
                    type: 'AGENDAMENTO_CONFIRMADO',
                    recipient: 'system',
                    channel: 'in_app',
                    message: `Novo agendamento web para ${vehicle.plate} (${customer.name})`,
                    status: 'pending',
                }
            });

            return order;
        }),
});
