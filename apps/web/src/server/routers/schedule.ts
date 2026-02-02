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
                    name: true,
                    phone: true,
                    email: true,
                    birthDate: true,
                    vehicles: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            plate: true,
                            brand: true,
                            model: true,
                            color: true,
                        },
                    },
                },
            });

            return customer;
        }),

    /**
     * Cria um agendamento público (sem login).
     */
    createPublicBooking: publicProcedure
        .input(z.object({
            tenantId: z.string(),
            serviceId: z.string(),
            scheduledAt: z.date(),
            existingCustomerId: z.string().optional(), // Se cliente já existe
            existingVehicleId: z.string().optional(),  // Se veículo já existe
            customer: z.object({
                document: z.string().optional().or(z.literal('')), // CPF opcional
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
            }).optional(), // Opcional se usar veículo existente
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

            // 3. Buscar Cliente existente
            // Se tem documento, busca por documento. Senão, busca por phone.
            let customer = await ctx.db.customer.findFirst({
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

            // Converter birthDate (formato "YYYY-MM-DD") para Date no fuso local
            // Evita bug de timezone onde new Date("YYYY-MM-DD") interpreta como UTC
            const birthDateData = input.customer.birthDate
                ? (() => {
                    const [year, month, day] = input.customer.birthDate.split('-').map(Number);
                    return new Date(year, month - 1, day);
                })()
                : undefined;

            // Converter email vazio para undefined
            const emailData = input.customer.email && input.customer.email.trim() !== ''
                ? input.customer.email
                : undefined;

            if (customer) {
                // Atualizar dados do cliente existente
                customer = await ctx.db.customer.update({
                    where: { id: customer.id },
                    data: {
                        name: sanitizeInput(input.customer.name),
                        phone: input.customer.phone,
                        email: emailData,
                        birthDate: birthDateData,
                        // Atualizar documento apenas se não tinha e foi informado agora
                        ...(cleanDoc && !customer.document ? { document: cleanDoc } : {}),
                    },
                });
            } else {
                // Criar novo cliente
                customer = await ctx.db.customer.create({
                    data: {
                        tenantId: input.tenantId,
                        document: cleanDoc || null, // null se não informado
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
                // Usar veículo existente
                const existingVehicle = await ctx.db.vehicle.findFirst({
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
                // Verificar se veículo com essa placa já existe
                const existingVehicle = await ctx.db.vehicle.findFirst({
                    where: {
                        tenantId: input.tenantId,
                        plate: input.vehicle.plate.toUpperCase(),
                        deletedAt: null,
                    },
                });

                if (existingVehicle) {
                    if (existingVehicle.customerId === customer.id) {
                        // Veículo pertence ao cliente atual - atualizar dados
                        const updatedVehicle = await ctx.db.vehicle.update({
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
                        // Veículo pertence a outro cliente - usar o existente mas manter dono
                        // (caso de família/empresa compartilhando veículo)
                        vehicleId = existingVehicle.id;
                        vehiclePlate = existingVehicle.plate;
                    }
                } else {
                    // Criar novo veículo
                    const newVehicle = await ctx.db.vehicle.create({
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
            const service = await ctx.db.service.findUnique({
                where: { id: input.serviceId },
            });

            if (!service) throw new TRPCError({ code: 'NOT_FOUND', message: 'Serviço não encontrado' });

            // 5. Criar Ordem de Serviço - Atribui ao funcionário com menos OS ativas
            // Busca usuários ATIVOS (status ACTIVE ou INVITED) E com isActive: true
            let allStaff = await ctx.db.user.findMany({
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

            // Fallback 1: busca qualquer usuário ativo (sem filtro de role ou status)
            if (allStaff.length === 0) {
                allStaff = await ctx.db.user.findMany({
                    where: {
                        tenantId: input.tenantId,
                        isActive: true,
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                });
            }

            // Fallback 2: busca QUALQUER usuário do tenant (último recurso)
            if (allStaff.length === 0) {
                allStaff = await ctx.db.user.findMany({
                    where: {
                        tenantId: input.tenantId,
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                });
            }

            // Se ainda assim não encontrar, erro crítico
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
                    vehicleId: vehicleId,
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

            // 6. Notificação interna (não bloqueia erro)
            try {
                await ctx.db.notificationLog.create({
                    data: {
                        tenantId: input.tenantId,
                        orderId: order.id,
                        type: 'AGENDAMENTO_CONFIRMADO',
                        recipient: 'system',
                        channel: 'in_app',
                        message: `Novo agendamento web para ${vehiclePlate} (${customer.name})`,
                        status: 'pending',
                    }
                });
            } catch (notifError) {
                console.error('Failed to create notification log:', notifError);
            }

            return order;
        }),
});
