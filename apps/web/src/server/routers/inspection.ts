/* eslint-disable @typescript-eslint/no-require-imports */
import { z } from 'zod';
import { router, protectedProcedure, protectedProcedureNoRateLimit, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateChecklistItems, REQUIRED_CHECKLIST_ITEMS } from '@/lib/ChecklistDefinition';
import { uploadFile, UploadContext } from '@/lib/storage';

const inspectionTypeEnum = z.enum(['entrada', 'intermediaria', 'final']);
const inspectionStatusEnum = z.enum(['em_andamento', 'concluida']);
const itemStatusEnum = z.enum(['pendente', 'ok', 'com_avaria']);
const damageTypeEnum = z.enum(['arranhao', 'amassado', 'trinca', 'mancha', 'risco', 'pintura', 'outro']);
const severityEnum = z.enum(['leve', 'moderado', 'grave']);

export const itemUpdateSchema = z.object({
    itemId: z.string(),
    status: itemStatusEnum,
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
    damageType: damageTypeEnum.optional(),
    severity: severityEnum.optional(),
});

const damageCreateSchema = z.object({
    position: z.string(),
    damageType: damageTypeEnum,
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
});

export const inspectionRouter = router({
    list: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
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
                    _count: { select: { items: true, damages: true } },
                    items: {
                        where: { status: { not: 'pendente' } },
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return inspections.map(inspection => {
                const totalItems = inspection._count.items;
                const completedItems = inspection.items.length;
                const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                return {
                    id: inspection.id,
                    orderId: inspection.orderId,
                    type: inspection.type,
                    status: inspection.status,
                    createdAt: inspection.createdAt,
                    signedAt: inspection.signedAt,
                    _count: {
                        items: inspection._count.items,
                        damages: inspection._count.damages,
                    },
                    progress,
                    completedItems,
                };
            });
        }),

    getById: protectedProcedure
        .input(z.object({ inspectionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    items: {
                        orderBy: [
                            { category: 'asc' },
                            { createdAt: 'asc' },
                        ],
                    },
                    damages: true,
                    order: {
                        select: {
                            tenantId: true,
                            code: true,
                            vehicle: {
                                select: { plate: true, brand: true, model: true, color: true }
                            }
                        }
                    },
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const totalRequired = inspection.items.filter(i => i.isRequired).length;
            const completedRequired = inspection.items.filter(i => i.isRequired && i.status !== 'pendente').length;
            const progress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

            return {
                ...inspection,
                progress,
                totalRequired,
                completedRequired,
                canComplete: completedRequired === totalRequired,
            };
        }),

    getByOrderIdAndType: protectedProcedureNoRateLimit
        .input(z.object({
            orderId: z.string(),
            type: inspectionTypeEnum,
        }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const inspection = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: input.type,
                    }
                },
                include: {
                    items: {
                        orderBy: [
                            { category: 'asc' },
                            { createdAt: 'asc' },
                        ],
                    },
                    damages: true
                },
            });

            if (!inspection) return null;

            const definedItems = generateChecklistItems();
            const existingItemKeys = new Set(inspection.items.map(i => i.itemKey));
            const missingItems = definedItems.filter(i => !existingItemKeys.has(i.itemKey));

            if (missingItems.length > 0) {
                await ctx.db.inspectionItem.createMany({
                    data: missingItems.map(item => ({
                        tenantId: ctx.tenantId!,
                        inspectionId: inspection.id,
                        category: item.category,
                        itemKey: item.itemKey,
                        label: item.label,
                        isRequired: item.isRequired,
                        isCritical: item.isCritical,
                        status: 'pendente',
                    })),
                });

                // Refetch inspection to get new items
                return ctx.db.inspection.findUnique({
                    where: { id: inspection.id },
                    include: {
                        items: {
                            orderBy: [
                                { category: 'asc' },
                                { createdAt: 'asc' },
                            ],
                        },
                        damages: true
                    },
                });
            }

            return inspection;
        }),

    create: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            type: inspectionTypeEnum,
        }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const existing = await ctx.db.inspection.findUnique({
                where: {
                    orderId_type: {
                        orderId: input.orderId,
                        type: input.type,
                    }
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `Já existe uma vistoria do tipo "${input.type}" para esta OS`,
                });
            }

            let sourceInspectionId: string | null = null;

            if (input.type === 'final') {
                const entryInspection = await ctx.db.inspection.findUnique({
                    where: { orderId_type: { orderId: input.orderId, type: 'entrada' } },
                    include: { items: true, damages: true },
                });

                if (entryInspection) {
                    sourceInspectionId = entryInspection.id;

                    const inspection = await ctx.db.inspection.create({
                        data: {
                            tenantId: ctx.tenantId!,
                            orderId: input.orderId,
                            type: input.type,
                            status: 'em_andamento',
                            sourceInspectionId,
                            items: {
                                create: entryInspection.items.map((item: any) => ({
                                    tenantId: ctx.tenantId!,
                                    category: item.category,
                                    itemKey: item.itemKey,
                                    label: item.label,
                                    isRequired: item.isRequired,
                                    isCritical: item.isCritical,
                                    status: item.status,
                                    photoUrl: item.photoUrl,
                                    photos: item.photos,
                                    notes: item.notes,
                                    damageType: item.damageType,
                                    severity: item.severity,
                                })),
                            },
                            damages: {
                                create: entryInspection.damages.map((d: any) => ({
                                    tenantId: ctx.tenantId!,
                                    position: d.position,
                                    damageType: d.damageType,
                                    notes: d.notes,
                                    photoUrl: d.photoUrl,
                                })),
                            },
                        },
                        include: { items: true, damages: true },
                    });

                    return inspection;
                }
            }

            const checklistItems = generateChecklistItems();

            const inspection = await ctx.db.inspection.create({
                data: {
                    tenantId: ctx.tenantId!,
                    orderId: input.orderId,
                    type: input.type,
                    status: 'em_andamento',
                    sourceInspectionId,
                    items: {
                        create: checklistItems.map(item => ({
                            tenantId: ctx.tenantId!,
                            category: item.category,
                            itemKey: item.itemKey,
                            label: item.label,
                            isRequired: item.isRequired,
                            isCritical: item.isCritical,
                            status: 'pendente',
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            return inspection;
        }),

    updateItem: protectedProcedureNoRateLimit
        .input(itemUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.inspectionItem.findUnique({
                where: { id: input.itemId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true } } },
                    },
                },
            });

            if (!item || item.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Item não encontrado',
                });
            }

            if (item.inspection.status === 'concluida') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Não é possível editar uma vistoria já concluída',
                });
            }

            const updated = await ctx.db.inspectionItem.update({
                where: { id: input.itemId },
                data: {
                    status: input.status,
                    notes: input.notes,
                    damageType: input.status === 'com_avaria' ? input.damageType : null,
                    severity: input.status === 'com_avaria' ? input.severity : null,
                    completedAt: input.status !== 'pendente' ? new Date() : null,
                },
            });

            return updated;
        }),

    getPresignedUrl: protectedProcedureNoRateLimit
        .input(z.object({
            filename: z.string(),
            contentType: z.string(),
            orderId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

            const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'sa-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                },
            });

            const uniqueId = Math.random().toString(36).substring(2, 9);
            // Prefix keys with tenantId to prevent IDOR on S3 objects
            const key = `inspections/${ctx.tenantId}/${input.orderId}/${Date.now()}-${uniqueId}-${input.filename}`;

            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: key,
                ContentType: input.contentType,
            });

            const signedUrl = await getSignedUrl(s3Client as any, command, { expiresIn: 300 }); // 5 minutes validity

            const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

            return { signedUrl, publicUrl, key };
        }),

    addPhoto: protectedProcedureNoRateLimit
        .input(z.object({
            itemId: z.string(),
            photoBase64: z.string().optional(),
            photoUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.inspectionItem.findUnique({
                where: { id: input.itemId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true, code: true } } },
                    },
                },
            });

            if (!item || item.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
            }

            if (item.inspection.status === 'concluida') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vistoria já concluída' });
            }

            const { uploadFile } = await import('@/lib/storage');
            let publicUrl = '';
            // 🚀 FAST PATH: Client Direct Upload (Presigned URL)
            if (input.photoUrl) {
                publicUrl = input.photoUrl;
            }
            // 🐌 SLOW PATH: Fallback para uploads antigos/quebrados via Base64 (OOM Risk)
            else if (input.photoBase64?.startsWith('data:image')) {
                const base64Data = input.photoBase64.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const contentType = input.photoBase64.substring(5, input.photoBase64.indexOf(';'));
                const fileName = `inspection-${item.id}-${Date.now()}.${contentType.split('/')[1] || 'jpeg'}`;

                publicUrl = await uploadFile(buffer, fileName, contentType, {
                    tenantId: ctx.tenantId!,
                    orderId: item.inspection.order.code
                });
            } else if (input.photoBase64) {
                publicUrl = input.photoBase64;
            } else {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'photoUrl ou photoBase64 é obrigatório' });
            }

            const updatedPhotos = [...item.photos, publicUrl];

            const updated = await ctx.db.inspectionItem.update({
                where: { id: input.itemId },
                data: {
                    photos: updatedPhotos,
                    // Keep photoUrl as the first photo for backward compat
                    photoUrl: updatedPhotos[0],
                    // Auto-mark as pendente if it was empty before
                    status: item.status === 'pendente' ? 'pendente' : item.status,
                },
            });

            return updated;
        }),

    removePhoto: protectedProcedureNoRateLimit
        .input(z.object({
            itemId: z.string(),
            photoBase64: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.inspectionItem.findUnique({
                where: { id: input.itemId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true } } },
                    },
                },
            });

            if (!item || item.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
            }

            if (item.inspection.status === 'concluida') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vistoria já concluída' });
            }

            // Excluir orfão do S3 para evitar Technical Debt (Phase 4.8)
            const photoToRemove = input.photoBase64;
            if (photoToRemove && photoToRemove.includes('s3.') && photoToRemove.includes('amazonaws.com')) {
                try {
                    const { DeleteObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
                    const s3Client = new S3Client({
                        region: process.env.AWS_REGION || 'sa-east-1',
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                        },
                    });

                    // Extrair Key da URL (ex: https://meu-bucket.s3.sa-east-1.amazonaws.com/uploads/tenant/file.jpg)
                    const urlPath = new URL(photoToRemove).pathname;
                    const objectKey = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME!,
                        Key: objectKey,
                    }));
                } catch (err) {
                    console.error('Falha ao deletar orfão do S3 (removePhoto):', err);
                    // Silently fail para não impedir o cliente de continuar a UI process
                }
            }

            const updatedPhotos = item.photos.filter((p) => p !== input.photoBase64);

            const updated = await ctx.db.inspectionItem.update({
                where: { id: input.itemId },
                data: {
                    photos: updatedPhotos,
                    photoUrl: updatedPhotos[0] ?? null,
                },
            });

            return updated;
        }),

    updateVideo: protectedProcedureNoRateLimit
        .input(z.object({
            inspectionId: z.string(),
            videoUrl: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: { order: { select: { tenantId: true } } },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const updated = await ctx.db.inspection.update({
                where: { id: input.inspectionId },
                data: {
                    finalVideoUrl: input.videoUrl,
                },
            });

            return updated;
        }),

    addDamage: protectedProcedureNoRateLimit
        .input(z.object({
            inspectionId: z.string(),
            damage: damageCreateSchema,
        }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: { order: { select: { tenantId: true } } },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            let finalPhotoUrl = input.damage.photoUrl;

            // 🐌 SLOW PATH: Interceptar Base64 sendo salvo no BD e redirecionar pro S3
            if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image')) {
                const { uploadFile } = await import('@/lib/storage');
                const base64Data = finalPhotoUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const contentType = finalPhotoUrl.substring(5, finalPhotoUrl.indexOf(';'));
                const fileName = `damage-${input.inspectionId}-${Date.now()}.${contentType.split('/')[1] || 'jpeg'}`;

                finalPhotoUrl = await uploadFile(buffer, fileName, contentType, {
                    tenantId: ctx.tenantId!,
                    orderId: inspection.order.code || 'unknown'
                });
            }

            const damage = await ctx.db.inspectionDamage.create({
                data: {
                    tenantId: ctx.tenantId!,
                    inspectionId: input.inspectionId,
                    ...input.damage,
                    photoUrl: finalPhotoUrl,
                },
            });

            return damage;
        }),

    removeDamage: protectedProcedureNoRateLimit
        .input(z.object({ damageId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const damage = await ctx.db.inspectionDamage.findUnique({
                where: { id: input.damageId },
                include: {
                    inspection: {
                        include: { order: { select: { tenantId: true } } },
                    },
                },
            });

            if (!damage || damage.inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Dano não encontrado',
                });
            }

            await ctx.db.inspectionDamage.delete({
                where: { id: input.damageId },
            });

            return { success: true };
        }),

    complete: protectedProcedure
        .input(z.object({ inspectionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    items: true,
                    order: { select: { tenantId: true } },
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const pendingRequired = inspection.items.filter(
                item => item.isRequired && item.status === 'pendente'
            );

            if (pendingRequired.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Ainda faltam ${pendingRequired.length} itens obrigatórios para concluir a vistoria`,
                });
            }

            const updated = await ctx.db.inspection.update({
                where: { id: input.inspectionId },
                data: {
                    status: 'concluida',
                    signedAt: new Date(),
                },
            });

            return updated;
        }),

    canCompleteOrder: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.serviceOrder.findFirst({
                where: { id: input.orderId, tenantId: ctx.tenantId! },
                select: { id: true },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Ordem de serviço não encontrada',
                });
            }

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: ctx.tenantId! },
                select: { inspectionRequired: true },
            });

            const inspectionRequired = tenant?.inspectionRequired || 'NONE';

            const [exitInspection, entryInspection] = await Promise.all([
                ctx.db.inspection.findUnique({
                    where: { orderId_type: { orderId: input.orderId, type: 'final' } },
                    select: { id: true, status: true },
                }),
                ctx.db.inspection.findUnique({
                    where: { orderId_type: { orderId: input.orderId, type: 'entrada' } },
                    select: { id: true, status: true },
                }),
            ]);

            const hasCompletedExitInspection = exitInspection?.status === 'concluida';
            const hasCompletedEntryInspection = entryInspection?.status === 'concluida';

            const missingInspections: string[] = [];
            let canComplete = true;

            switch (inspectionRequired) {
                case 'ENTRY':
                    if (!hasCompletedEntryInspection) {
                        canComplete = false;
                        missingInspections.push('Vistoria de Entrada obrigatória não foi concluída');
                    }
                    break;
                case 'EXIT':
                    if (!hasCompletedExitInspection) {
                        canComplete = false;
                        missingInspections.push('Vistoria de Saída obrigatória não foi concluída');
                    }
                    break;
                case 'BOTH':
                    if (!hasCompletedEntryInspection) {
                        canComplete = false;
                        missingInspections.push('Vistoria de Entrada obrigatória não foi concluída');
                    }
                    if (!hasCompletedExitInspection) {
                        canComplete = false;
                        missingInspections.push('Vistoria de Saída obrigatória não foi concluída');
                    }
                    break;
                default:
                    break;
            }

            return {
                canComplete,
                hasCompletedExitInspection,
                hasCompletedEntryInspection,
                missingInspections,
                inspectionRequired,
            };
        }),

    saveSignature: protectedProcedure
        .input(z.object({
            inspectionId: z.string(),
            signatureBase64: z.string(), // data:image/png;base64,...
        }))
        .mutation(async ({ ctx, input }) => {
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    order: { select: { tenantId: true, code: true } },
                    items: { select: { id: true, itemKey: true, status: true, damageType: true, severity: true, notes: true } },
                    damages: { select: { id: true, position: true, damageType: true, notes: true } }
                },
            });

            if (!inspection || inspection.order.tenantId !== ctx.tenantId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            const base64Data = input.signatureBase64.replace(/^data:image\/\w+;base64,/, '');

            // 🛡️ Anti-OOM Limit: Prevenção de DoS em conversões Base64 (~5MB)
            const sizeInBytes = (base64Data.length * 3) / 4;
            if (sizeInBytes > 5 * 1024 * 1024) {
                throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Assinatura excede o limite de 5MB' });
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${inspection.order.code}-${inspection.type}-signature-${Date.now()}.png`;
            const uploadContext: UploadContext = {
                tenantId: ctx.tenantId!,
                orderId: inspection.order.code,
            };

            const signatureUrl = await uploadFile(buffer, fileName, 'image/png', uploadContext);

            // Geração de Hash Forense para integridade da assinatura
            const crypto = await import('crypto');
            const forensicPayload = {
                metadata: {
                    ipAddress: ctx.headers?.ipAddress || 'unknown',
                    userAgent: ctx.headers?.userAgent || 'unknown',
                    signedAt: new Date().toISOString(),
                    tenantId: ctx.tenantId!,
                    orderId: inspection.order.code,
                },
                items: inspection.items,
                damages: inspection.damages,
            };

            const documentHash = crypto.createHash('sha256').update(JSON.stringify(forensicPayload)).digest('base64');

            const updated = await ctx.db.inspection.update({
                where: { id: input.inspectionId },
                data: {
                    signatureUrl,
                    signedAt: new Date(),
                    signedVia: 'digital_canvas',
                    documentHash,
                },
            });

            return updated;
        }),

    savePublicSignature: publicProcedure
        .input(z.object({
            orderId: z.string(),
            inspectionId: z.string(),
            signatureBase64: z.string(),
            token: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // 🛡️ SECURITY: Fetch order first to compute HMAC
            const inspection = await ctx.db.inspection.findUnique({
                where: { id: input.inspectionId },
                include: {
                    items: { select: { id: true, itemKey: true, status: true, damageType: true, severity: true, notes: true, isRequired: true } },
                    damages: { select: { id: true, position: true, damageType: true, notes: true } },
                    order: {
                        select: {
                            id: true,
                            code: true,
                            tenantId: true,
                            status: true,
                        }
                    }
                },
            });

            if (!inspection) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Vistoria não encontrada',
                });
            }

            // Verify HMAC Token
            const crypto = require('crypto');
            const secret = process.env.NEXTAUTH_SECRET || process.env.CLERK_SECRET_KEY || 'default_secret';
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(`${inspection.order.id}:${inspection.order.tenantId}`);
            const expectedToken = hmac.digest('hex').substring(0, 16);

            if (input.token !== expectedToken) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada. Autentique-se novamente.' });
            }

            if (inspection.order.id !== input.orderId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Vistoria não pertence a esta OS ou o Inquilino é inválido',
                });
            }

            if (inspection.signatureUrl) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Esta vistoria já foi assinada',
                });
            }

            const pendingRequired = inspection.items.filter(
                item => item.isRequired && item.status === 'pendente'
            );

            if (pendingRequired.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Ainda faltam ${pendingRequired.length} itens obrigatórios para assinar`,
                });
            }

            const base64Data = input.signatureBase64.replace(/^data:image\/\w+;base64,/, '');

            // 🛡️ Anti-OOM Limit: Prevenção de DoS em conversões Base64 (~5MB)
            const sizeInBytes = (base64Data.length * 3) / 4;
            if (sizeInBytes > 5 * 1024 * 1024) {
                throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Assinatura excede o limite de 5MB' });
            }

            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${inspection.order.code}-${inspection.type}-signature-${Date.now()}.png`;
            const uploadContext: UploadContext = {
                tenantId: inspection.order.tenantId,
                orderId: inspection.order.code,
            };

            const signatureUrl = await uploadFile(buffer, fileName, 'image/png', uploadContext);

            // Geração de Hash Forense para validade jurídica da assinatura pública
            const cryptoModule = await import('crypto');
            const forensicPayload = {
                metadata: {
                    ipAddress: ctx.headers?.ipAddress || 'unknown',
                    userAgent: ctx.headers?.userAgent || 'unknown',
                    signedAt: new Date().toISOString(),
                    tenantId: inspection.order.tenantId,
                    orderId: inspection.order.code,
                },
                items: inspection.items,
                damages: inspection.damages,
            };

            const documentHash = cryptoModule.createHash('sha256').update(JSON.stringify(forensicPayload)).digest('base64');

            const updated = await ctx.db.$transaction(async (tx) => {
                const updatedInspection = await tx.inspection.update({
                    where: { id: input.inspectionId },
                    data: {
                        signatureUrl,
                        signedAt: new Date(),
                        signedVia: 'public_tracking',
                        status: 'concluida',
                        documentHash,
                    },
                });

                if (inspection.type === 'entrada') {
                    await tx.serviceOrder.update({
                        where: { id: inspection.order.id },
                        data: {
                            approvedAt: new Date(),
                            termsAcceptedAt: new Date(),
                            approvalDate: new Date(),
                            approvalToken: null,
                            approvalTokenExpiry: null,
                            // If the order was just waiting for approval, push it forward to scheduled/in-progress
                            ...(inspection.order.status === 'AGUARDANDO_APROVACAO' ? { status: 'AGENDADO' } : {})
                        },
                    });
                }

                return updatedInspection;
            });

            return updated;
        }),
});
