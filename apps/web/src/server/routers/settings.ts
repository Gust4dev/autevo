import { z } from 'zod';
import { router, protectedProcedure, managerProcedure, ownerProcedure } from '../trpc';
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
                select: { name: true, logo: true, primaryColor: true, secondaryColor: true, pixKey: true, paymentTerms: true, phone: true, email: true, address: true, cnpj: true },
            });

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
});
