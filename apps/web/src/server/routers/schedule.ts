/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { sanitizeInput } from '@/lib/sanitize';
import { OrderStatus } from '@autevo/database';
import { isValidCPF, cleanCPF } from '@/lib/cpf-validator';

export const scheduleRouter = router({
    /**
     * Busca todas as ordens de serviço dentro de um mês específico.
     * Retorna dados mínimos para exibição no calendário.
     */
    getByMonth: protectedProcedure
        .input(
            z.object({
                month: z.number().min(0).max(11),
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
                        take: 1,
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
                    phone: true,
                    cnpj: true,
                    address: true,
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

            const dates: any[] = [];
            const today = startOfDay(new Date());

            const startDate = addDays(today, 1);
            const endDate = addDays(today, 30);

            // 🛡️ SECURITY (P1-3): Prevent N+1 DoS by grouping counts in a single query
            const counts = await ctx.db.serviceOrder.groupBy({
                by: ['scheduledAt'],
                where: {
                    tenantId: input.tenantId,
                    scheduledAt: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
                    status: { not: 'CANCELADO' },
                },
                _count: { id: true },
            });

            const countMap = new Map<string, number>();
            for (const c of counts) {
                const dayKey = startOfDay(c.scheduledAt).toISOString();
                countMap.set(dayKey, (countMap.get(dayKey) || 0) + c._count.id);
            }

            for (let i = 1; i <= 30; i++) {
                const date = addDays(today, i);
                const dayKey = startOfDay(date).toISOString();
                const count = countMap.get(dayKey) || 0;

                dates.push({
                    date,
                    available: count < tenant.maxDailyCapacity,
                    remaining: Math.max(0, tenant.maxDailyCapacity - count),
                });
            }

            return dates;
        }),

    /**
     * Busca cliente existente por CPF/documento.
     * Retorna dados do cliente e seus veículos se encontrado.
     */
    lookupCustomerByDocument: publicProcedure
        .input(z.object({
            tenantId: z.string(),
            document: z.string().min(11).max(14),
        }))
        .query(async ({ ctx, input }) => {
            const cleanDoc = cleanCPF(input.document);

            if (!isValidCPF(cleanDoc)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'CPF inválido. Por favor, verifique o número digitado.',
                });
            }

            const customer = await ctx.db.customer.findFirst({
                where: {
                    tenantId: input.tenantId,
                    document: cleanDoc,
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            });

            if (!customer) {
                return { exists: false };
            }

            return {
                exists: true,
                id: customer.id,
                message: "Cliente localizado. Por segurança, os detalhes foram omitidos. Prosiga com o agendamento.",
            };
        }),

    /**
     * Cria um agendamento público (sem login).
     */
    createPublicBooking: publicProcedure
        .input(z.object({
            tenantId: z.string(),
            serviceId: z.string(),
            scheduledAt: z.date(),
            existingCustomerId: z.string().optional(),
            existingVehicleId: z.string().optional(),
            customer: z.object({
                document: z.string().optional().or(z.literal('')),
                name: z.string().min(2),
                phone: z.string().min(10),
                email: z.string().email().optional().or(z.literal('')),
                birthDate: z.string().optional(),
            }),
            vehicle: z.object({
                plate: z.string().min(7),
                model: z.string().min(2),
                brand: z.string().min(2),
                color: z.string(),
            }).optional(),
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

            // 2. Preparar documento (CPF)
            const cleanDoc = input.customer.document ? cleanCPF(input.customer.document) : '';

            // Validar CPF apenas se foi informado
            if (cleanDoc && !isValidCPF(cleanDoc)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'CPF inválido. Por favor, verifique o número digitado.',
                });
            }

            // Converter formatações fora da transação
            const birthDateData = input.customer.birthDate
                ? (() => {
                    const [year, month, day] = input.customer.birthDate.split('-').map(Number);
                    return new Date(year, month - 1, day);
                })()
                : undefined;

            const emailData = input.customer.email && input.customer.email.trim() !== ''
                ? input.customer.email
                : undefined;

            // 🛡️ SECURITY (P1-1): Wrap everything in an ACID Transaction
            return await ctx.db.$transaction(async (tx: any) => {
                // 1. Verificar capacidade dentro da transação para consistência
                const count = await tx.serviceOrder.count({
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

                // 3. Buscar Cliente existente
                let customer = await tx.customer.findFirst({
                    where: cleanDoc
                        ? {
                            tenantId: input.tenantId,
                            document: cleanDoc,
                            deletedAt: null,
                        }
                        : {
                            tenantId: input.tenantId,
                            phone: input.customer.phone,
                            deletedAt: null,
                        },
                });

                if (customer) {
                    if (cleanDoc && !customer.document) {
                        customer = await tx.customer.update({
                            where: { id: customer.id, tenantId: input.tenantId },
                            data: { document: cleanDoc }
                        });
                    }
                } else {
                    // Criar novo cliente
                    customer = await tx.customer.create({
                        data: {
                            tenantId: input.tenantId,
                            document: cleanDoc || null,
                            name: sanitizeInput(input.customer.name),
                            phone: input.customer.phone,
                            email: emailData,
                            birthDate: birthDateData,
                        },
                    });
                }

                // 4. Buscar ou Criar Veículo
                let vehicleId: string;
                let vehiclePlate: string;

                if (input.existingVehicleId) {
                    const existingVehicle = await tx.vehicle.findFirst({
                        where: {
                            id: input.existingVehicleId,
                            tenantId: input.tenantId,
                            deletedAt: null,
                        },
                    });

                    if (!existingVehicle) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Veículo selecionado não encontrado.',
                        });
                    }

                    vehicleId = existingVehicle.id;
                    vehiclePlate = existingVehicle.plate;
                } else if (input.vehicle) {
                    const existingVehicle = await tx.vehicle.findFirst({
                        where: {
                            tenantId: input.tenantId,
                            plate: input.vehicle.plate.toUpperCase(),
                            deletedAt: null,
                        },
                    });

                    if (existingVehicle) {
                        if (existingVehicle.customerId === customer.id) {
                            const updatedVehicle = await tx.vehicle.update({
                                where: { id: existingVehicle.id },
                                data: {
                                    model: sanitizeInput(input.vehicle.model),
                                    brand: sanitizeInput(input.vehicle.brand),
                                    color: sanitizeInput(input.vehicle.color),
                                },
                            });
                            vehicleId = updatedVehicle.id;
                            vehiclePlate = updatedVehicle.plate;
                        } else {
                            vehicleId = existingVehicle.id;
                            vehiclePlate = existingVehicle.plate;
                        }
                    } else {
                        const newVehicle = await tx.vehicle.create({
                            data: {
                                tenantId: input.tenantId,
                                customerId: customer.id,
                                plate: input.vehicle.plate.toUpperCase(),
                                model: sanitizeInput(input.vehicle.model),
                                brand: sanitizeInput(input.vehicle.brand),
                                color: sanitizeInput(input.vehicle.color),
                            },
                        });
                        vehicleId = newVehicle.id;
                        vehiclePlate = newVehicle.plate;
                    }
                } else {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Dados do veículo são obrigatórios.',
                    });
                }

                // 4. Buscar serviço para obter o preço base
                const service = await tx.service.findUnique({
                    where: { id: input.serviceId },
                });

                if (!service) throw new TRPCError({ code: 'NOT_FOUND', message: 'Serviço não encontrado' });

                let allStaff = await tx.user.findMany({
                    where: {
                        tenantId: input.tenantId,
                        role: { in: ['OWNER', 'MANAGER', 'MEMBER'] },
                        status: { in: ['ACTIVE', 'INVITED'] },
                        isActive: true,
                    },
                    select: {
                        id: true,
                    },
                });

                if (allStaff.length === 0) {
                    allStaff = await tx.user.findMany({
                        where: {
                            tenantId: input.tenantId,
                            isActive: true,
                        },
                        select: { id: true },
                        take: 1,
                    });
                }

                if (allStaff.length === 0) {
                    allStaff = await tx.user.findMany({
                        where: { tenantId: input.tenantId },
                        select: { id: true },
                        take: 1,
                    });
                }

                if (allStaff.length === 0) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nenhum responsável encontrado para a oficina' });
                }

                const orderCounts = await tx.serviceOrder.groupBy({
                    by: ['assignedToId'],
                    where: {
                        tenantId: input.tenantId,
                        assignedToId: { in: allStaff.map((s: any) => s.id) },
                        status: { notIn: [OrderStatus.CONCLUIDO, OrderStatus.CANCELADO] },
                    },
                    _count: true,
                });

                const countMap = new Map(orderCounts.map((c: any) => [c.assignedToId, c._count]));

                const staff = allStaff.reduce((min: any, current: any) => {
                    const minCount = countMap.get(min.id) || 0;
                    const currentCount = countMap.get(current.id) || 0;
                    return currentCount < minCount ? current : min;
                });

                const order = await tx.serviceOrder.create({
                    data: {
                        tenantId: input.tenantId,
                        customerId: customer.id,
                        vehicleId: vehicleId,
                        assignedToId: staff.id,
                        createdById: staff.id,
                        scheduledAt: input.scheduledAt,
                        status: 'AGENDADO',
                        subtotal: service.basePrice,
                        total: service.basePrice,
                        code: `AG-${Date.now().toString().slice(-6)}`,
                        items: {
                            create: {
                                tenantId: input.tenantId,
                                serviceId: service.id,
                                price: service.basePrice,
                                quantity: 1,
                            },
                        },
                    },
                });

                // 6. Notificação interna
                await tx.notificationLog.create({
                    data: {
                        tenantId: input.tenantId,
                        orderId: order.id,
                        type: 'AGENDAMENTO_CONFIRMADO',
                        recipient: 'system',
                        channel: 'in_app',
                        message: `Novo agendamento web para ${vehiclePlate} (${customer.name})`,
                        status: 'pending',
                    }
                }).catch(() => { });

                return order;
            });
        }),
});
