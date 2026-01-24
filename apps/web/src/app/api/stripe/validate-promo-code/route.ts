import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';

interface ValidatePromoCodeBody {
    code: string;
}

export async function POST(request: Request) {
    try {
        const body: ValidatePromoCodeBody = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código não informado' }, { status: 400 });
        }

        const promoCode = await prisma.promoCode.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
            },
            include: {
                referrerTenant: {
                    select: { name: true },
                },
            },
        });

        if (!promoCode) {
            return NextResponse.json({ valid: false, error: 'Código não encontrado' });
        }

        // Check expiration
        if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
            return NextResponse.json({ valid: false, error: 'Código expirado' });
        }

        // Check max uses
        if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
            return NextResponse.json({ valid: false, error: 'Código já atingiu o limite de uso' });
        }

        return NextResponse.json({
            valid: true,
            code: promoCode.code,
            discountPercent: promoCode.discountPercent,
            monthlyDuration: promoCode.monthlyDuration,
            yearlyDuration: promoCode.yearlyDuration,
            referrerName: promoCode.referrerTenant?.name || null,
        });
    } catch (error) {
        console.error('[Validate Promo Code Error]', error);
        return NextResponse.json({ valid: false, error: 'Erro ao validar código' }, { status: 500 });
    }
}
