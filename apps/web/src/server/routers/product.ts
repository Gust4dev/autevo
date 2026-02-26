import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const productCreateSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    sku: z.string().optional(),
    unit: z.string().default('un'),
    costPrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    stock: z.number().min(0).default(0),
    minStock: z.number().min(0).default(5),
});

const productUpdateSchema = productCreateSchema.partial();

const productListSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
    lowStock: z.boolean().optional(),
});

export const productRouter = router({
    // List products with pagination
    list: protectedProcedure
        .input(productListSchema)
        .query(async ({ ctx, input }) => {
            const { page, limit, search, lowStock } = input;
            const skip = (page - 1) * limit;

            const where = {
                tenantId: ctx.tenantId!,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { sku: { contains: search, mode: 'insensitive' as const } },
                    ],
                }),
            };

            const [products, total] = await Promise.all([
                ctx.db.product.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { name: 'asc' },
                }),
                ctx.db.product.count({ where }),
            ]);

            // Filter low stock if needed
            const filteredProducts = lowStock
                ? products.filter((p) => p.stock <= p.minStock)
                : products;

            return {
                products: filteredProducts,
                pagination: {
                    page,
                    limit,
                    total: lowStock ? filteredProducts.length : total,
                    totalPages: Math.ceil((lowStock ? filteredProducts.length : total) / limit),
                },
            };
        }),

    // Get single product by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const product = await ctx.db.product.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    stockMovements: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!product) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Produto não encontrado',
                });
            }

            return product;
        }),

    // Create new product
    create: managerProcedure
        .input(productCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // Check for duplicate SKU if provided
            if (input.sku) {
                const existing = await ctx.db.product.findFirst({
                    where: {
                        tenantId: ctx.tenantId!,
                        sku: input.sku,
                    },
                });

                if (existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Já existe um produto com este SKU',
                    });
                }
            }

            const product = await ctx.db.product.create({
                data: {
                    ...input,
                    tenantId: ctx.tenantId!,
                },
            });

            return product;
        }),

    // Update product
    update: managerProcedure
        .input(
            z.object({
                id: z.string(),
                data: productUpdateSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.product.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Produto não encontrado',
                });
            }

            // Check for duplicate SKU if changing
            if (input.data.sku && input.data.sku !== existing.sku) {
                const duplicate = await ctx.db.product.findFirst({
                    where: {
                        tenantId: ctx.tenantId!,
                        sku: input.data.sku,
                        id: { not: input.id },
                    },
                });

                if (duplicate) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Já existe outro produto com este SKU',
                    });
                }
            }

            const product = await ctx.db.product.update({
                where: { id: input.id },
                data: input.data,
            });

            return product;
        }),

    // Adjust stock
    adjustStock: managerProcedure
        .input(
            z.object({
                id: z.string(),
                quantity: z.number(),
                type: z.enum(['ENTRADA', 'SAIDA_OS', 'AJUSTE']),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.product.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Produto não encontrado',
                });
            }

            const newStock = existing.stock + input.quantity;
            if (newStock < 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Estoque não pode ficar negativo',
                });
            }

            const [product] = await ctx.db.$transaction([
                ctx.db.product.update({
                    where: { id: input.id },
                    data: { stock: newStock },
                }),
                ctx.db.stockMovement.create({
                    data: {
                        tenantId: ctx.tenantId!,
                        productId: input.id,
                        quantity: input.quantity,
                        type: input.type,
                        notes: input.notes,
                        createdBy: ctx.user!.id,
                    },
                }),
            ]);

            if (input.type === 'ENTRADA' && input.quantity > 0) {
                await ctx.db.pendingRestock.updateMany({
                    where: {
                        productId: input.id,
                        tenantId: ctx.tenantId!,
                        resolved: false,
                    },
                    data: {
                        resolved: true,
                        resolvedAt: new Date(),
                    },
                });
            }

            return product;
        }),

    // Delete product
    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.product.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    _count: { select: { orderProducts: true } },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Produto não encontrado',
                });
            }

            if (existing._count.orderProducts > 0) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'Produto possui ordens vinculadas e não pode ser excluído',
                });
            }

            // Delete movements first, then product
            await ctx.db.stockMovement.deleteMany({
                where: { productId: input.id },
            });

            await ctx.db.product.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // Get low stock products count
    lowStockCount: protectedProcedure.query(async ({ ctx }) => {
        const products = await ctx.db.product.findMany({
            where: { tenantId: ctx.tenantId! },
            select: { stock: true, minStock: true },
        });

        return products.filter((p) => p.stock <= p.minStock).length;
    }),

    // List stock movements
    listMovements: managerProcedure
        .input(z.object({
            productId: z.string().optional(),
            limit: z.number().min(1).max(100).default(20),
            page: z.number().min(1).default(1),
        }))
        .query(async ({ ctx, input }) => {
            const { productId, limit, page } = input;
            const skip = (page - 1) * limit;

            const where: any = {
                product: { tenantId: ctx.tenantId! }
            };

            if (productId) {
                where.productId = productId;
            }

            const [movements, total] = await Promise.all([
                ctx.db.stockMovement.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        product: { select: { name: true, sku: true } },
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                ctx.db.stockMovement.count({ where }),
            ]);

            return {
                movements,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),
});
