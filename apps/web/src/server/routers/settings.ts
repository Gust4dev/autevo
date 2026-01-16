import { z } from 'zod';
import { router, protectedProcedure, managerProcedure, authenticatedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { encrypt, decrypt } from '@/lib/encryption';

function safeDecrypt(value: string): string {
    try {
        if (value.includes(':')) {
            return decrypt(value);
        }
        return value;
    } catch {
        return value;
    }
}

const pixKeyPatterns = {
    cpf: /^\d{11}$/,
    cnpj: /^\d{14}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+55\d{10,11}$/,
    random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
};

const isValidPixKey = (key: string): boolean => {
    if (!key) return true;
    const cleaned = key.replace(/[.\-/() ]/g, '');
    return Object.values(pixKeyPatterns).some((pattern) => pattern.test(cleaned) || pattern.test(key));
};

const updateSettingsSchema = z.object({
    name: z.string().min(2, 'Nome muito curto').optional(),
    logo: z.string().optional().nullable(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
    pixKey: z.string().optional().nullable().refine(
        (val) => !val || isValidPixKey(val),
        { message: 'Chave Pix inválida. Use CPF, CNPJ, Email, Telefone (+55) ou Chave Aleatória.' }
    ),
    paymentTerms: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    contractTemplate: z.string().optional().nullable(),
    maxDailyCapacity: z.number().min(1).max(100).optional(),
    businessHours: z.string().optional().nullable(),
    inspectionRequired: z.enum(['NONE', 'ENTRY', 'EXIT', 'BOTH']).optional(),
    inspectionSignature: z.boolean().optional(),
    slug: z.string()
        .min(3, 'Link muito curto')
        .max(50, 'Link muito longo')
        .regex(/^[a-z0-9-]+$/, 'O link deve conter apenas letras minúsculas, números e hífens')
        .optional(),
});

export const settingsRouter = router({
    get: protectedProcedure.query(async ({ ctx }) => {
        const tenant = await ctx.db.tenant.findUnique({
            where: { id: ctx.tenantId! },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                pixKey: true,
                paymentTerms: true,
                contractTemplate: true,
                phone: true,
                email: true,
                address: true,
                cnpj: true,
                maxDailyCapacity: true,
                businessHours: true,
                inspectionRequired: true,
                inspectionSignature: true,
                status: true,
                plan: true,
            },
        });

        if (!tenant) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Tenant não encontrado',
            });
        }

        return {
            ...tenant,
            pixKey: tenant.pixKey ? safeDecrypt(tenant.pixKey) : null,
        };
    }),

    update: managerProcedure
        .input(updateSettingsSchema)
        .mutation(async ({ ctx, input }) => {
            const oldSettings = await ctx.db.tenant.findUnique({
                where: { id: ctx.tenantId! },
                select: { name: true, slug: true, logo: true, primaryColor: true, secondaryColor: true, pixKey: true, paymentTerms: true, phone: true, email: true, address: true, cnpj: true },
            });

            // Check slug uniqueness if changed
            if (input.slug && input.slug !== oldSettings?.slug) {
                const existing = await ctx.db.tenant.findUnique({
                    where: { slug: input.slug },
                    select: { id: true },
                });

                if (existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Este link já está sendo usado por outra oficina.',
                    });
                }
            }

            const tenant = await ctx.db.tenant.update({
                where: { id: ctx.tenantId! },
                data: {
                    name: input.name,
                    logo: input.logo,
                    primaryColor: input.primaryColor,
                    secondaryColor: input.secondaryColor,
                    pixKey: input.pixKey ? encrypt(input.pixKey) : null,
                    paymentTerms: input.paymentTerms,
                    contractTemplate: input.contractTemplate,
                    phone: input.phone,
                    email: input.email,
                    address: input.address,
                    cnpj: input.cnpj,
                    maxDailyCapacity: input.maxDailyCapacity,
                    businessHours: input.businessHours,
                    inspectionRequired: input.inspectionRequired,
                    inspectionSignature: input.inspectionSignature,
                    slug: input.slug,
                },
            });

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId: ctx.tenantId!,
                userId: ctx.user?.id,
                action: 'SETTINGS_UPDATE',
                entityType: 'Tenant',
                entityId: ctx.tenantId!,
                oldValue: oldSettings,
                newValue: { ...input, pixKey: input.pixKey ? '[ENCRYPTED]' : null },
            });

            return tenant;
        }),

    activateFreeTrial: authenticatedProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user.tenantId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No tenant found' });
        }

        const tenant = await ctx.db.tenant.findUnique({
            where: { id: ctx.user.tenantId },
            select: { status: true },
        });

        if (tenant?.status !== 'PENDING_ACTIVATION') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tenant not pending activation' });
        }

        const config = await ctx.db.systemConfig.findUnique({
            where: { key: 'trial_days_standard' },
        });

        const trialDays = config?.value ? parseInt(config.value) : 14;
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        await ctx.db.tenant.update({
            where: { id: ctx.user.tenantId },
            data: {
                status: 'TRIAL',
                trialStartedAt: now,
                trialEndsAt,
                isFoundingMember: false,
            },
        });

        const { createAuditLog } = await import('@/lib/audit');
        await createAuditLog({
            tenantId: ctx.user.tenantId,
            userId: ctx.user.id,
            action: 'ACTIVATE_FREE_TRIAL',
            entityType: 'Tenant',
            entityId: ctx.user.tenantId,
            oldValue: { status: tenant.status },
            newValue: { status: 'TRIAL', trialDays },
        });

        const clerk = await import('@clerk/nextjs/server').then((m) => m.clerkClient());
        if (ctx.user.clerkId) {
            await clerk.users.updateUser(ctx.user.clerkId, {
                publicMetadata: {
                    tenantId: ctx.user.tenantId,
                    role: ctx.user.role,
                    dbUserId: ctx.user.id,
                    tenantStatus: 'TRIAL',
                    trialEndsAt: trialEndsAt.toISOString(),
                    isFoundingMember: false,
                },
            });
        }

        return { success: true };
    }),
});
