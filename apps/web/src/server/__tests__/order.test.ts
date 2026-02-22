import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers/_app';
import { prisma } from '@autevo/database';

const createTestCaller = (userContext: any) => {
    return appRouter.createCaller({
        db: prisma,
        user: userContext,
        tenantId: userContext.tenantId
    });
};

describe('Core Backend TRPC Contracts: Flow, Inventory, Commissions', () => {
    let tenantId: string;
    let userId: string;
    let caller: ReturnType<typeof createTestCaller>;

    // Global data references
    let customerId: string;
    let vehicleId: string;
    let productId: string;
    let serviceId: string;
    let orderId: string;

    beforeAll(async () => {
        // Clean previous test data safely
        await prisma.tenant.deleteMany({ where: { name: 'Oficina Teste Integration' } });

        // 1. Arrange: Create infrastructure
        const tenant = await prisma.tenant.create({
            data: { name: 'Oficina Teste Integration', cnpj: '00000', status: 'ACTIVE', inspectionRequired: 'NONE', slug: 'oficina-teste-order' }
        });
        tenantId = tenant.id;

        const user = await prisma.user.create({
            data: {
                name: 'Mecânico Teste',
                email: `test_${Date.now()}@oficina.com`,
                tenantId,
                role: 'OWNER',
                defaultCommissionPercent: 10
            }
        });
        userId = user.id;

        caller = createTestCaller(user);

        // Pre-create basic required entities via explicit Prisma access
        const customer = await prisma.customer.create({
            data: { tenantId, name: 'Cliente Teste', phone: '11999999999' }
        });
        customerId = customer.id;

        const vehicle = await prisma.vehicle.create({
            data: { tenantId, customerId, brand: 'TestBrand', model: 'Carro Teste', color: 'Preto', plate: 'TST1234' }
        });
        vehicleId = vehicle.id;

        const product = await prisma.product.create({
            data: { tenantId, name: 'Óleo Motor', stock: 10, salePrice: 50, costPrice: 30 }
        });
        productId = product.id;

        const service = await prisma.service.create({
            data: { tenantId, name: 'Troca de Óleo', basePrice: 100, defaultCommissionPercent: 15 }
        });
        serviceId = service.id;
    });

    afterAll(async () => {
        // Hard teardown of isolated tenant
        if (tenantId) {
            await prisma.tenant.delete({ where: { id: tenantId } });
        }
    });

    it('creates an Order pending execution', async () => {
        const order = await caller.order.create({
            vehicleId,
            scheduledAt: new Date(),
            assignedToId: userId,
            items: [
                { serviceId, quantity: 1, price: 100 }
            ]
        });

        expect(order).toBeDefined();
        expect(order.status).toBe('AGENDADO');
        orderId = order.id;
    });

    it('adds product to Order without deducting inventory yet', async () => {
        await caller.order.addProduct({
            orderId,
            productId,
            quantity: 3,
            costPrice: 50
        });

        // Update assignment or other info if needed without duplicating items unnecessarily
        await caller.order.update({
            id: orderId,
            data: {
                assignedToId: userId
            }
        });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        expect(product?.stock).toBe(10); // Inventory untouched during AGENDADO
    });

    it('deducts inventory strictly upon entering execution phase', async () => {
        // Must traverse the state machine correctly: AGENDADO -> EM_VISTORIA -> EM_EXECUCAO
        await caller.order.updateStatus({
            id: orderId,
            status: 'EM_VISTORIA'
        });

        await caller.order.updateStatus({
            id: orderId,
            status: 'EM_EXECUCAO'
        });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        // The order has 3 items of this product
        expect(product?.stock).toBe(7);

        const movement = await prisma.stockMovement.findFirst({
            where: { productId, tenantId }
        });
        expect(movement).toBeDefined();
        expect(movement?.type).toBe('SAIDA_OS');
    });

    it('cannot deduct inventory twice if already deducted', async () => {
        // Change back to AGENDADO and then EM_EXECUCAO to simulate back-and-forth
        // Valid Transitions: EM_EXECUCAO -> CANCELADO -> AGENDADO -> EM_VISTORIA -> EM_EXECUCAO
        await caller.order.updateStatus({ id: orderId, status: 'CANCELADO' });
        await caller.order.updateStatus({ id: orderId, status: 'AGENDADO' });
        await caller.order.updateStatus({ id: orderId, status: 'EM_VISTORIA' });
        await caller.order.updateStatus({ id: orderId, status: 'EM_EXECUCAO' });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        expect(product?.stock).toBe(7); // Must stay at 7
    });

    it('creates commission strictly upon completion based on service rules', async () => {
        // Valid Transitions to CONCLUIDO is from AGUARDANDO_PAGAMENTO
        // Current state: EM_EXECUCAO
        await caller.order.updateStatus({
            id: orderId,
            status: 'AGUARDANDO_PAGAMENTO'
        });

        await caller.order.updateStatus({
            id: orderId,
            status: 'CONCLUIDO'
        });

        const commission = await prisma.orderItemCommission.findFirst({
            where: { tenantId }
        });

        // The service costs 100 and yields 15% commission (overriding the user's 10%)
        expect(commission).toBeDefined();
        expect(commission?.commissionValue?.toNumber()).toBe(15);
    });

});
