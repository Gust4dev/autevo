import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';

interface ValidatePartnerCodeBody {
    code: string;
}

export async function POST(request: Request) {
    try {
        const body: ValidatePartnerCodeBody = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código não informado' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                partnerCode: code.toUpperCase(),
            },
            select: {
                id: true,
                name: true,
                partnerCode: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ valid: false, error: 'Código de parceiro não encontrado' });
        }

        return NextResponse.json({
            valid: true,
            code: tenant.partnerCode,
            partnerName: tenant.name,
            partnerId: tenant.id,
        });
    } catch (error) {
        console.error('[Validate Partner Code Error]', error);
        return NextResponse.json({ valid: false, error: 'Erro ao validar código' }, { status: 500 });
    }
}
