import { NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { prisma } from '@autevo/database';
import { renderToStream } from '@react-pdf/renderer';
import { InspectionPDF } from '@/components/pdfs/InspectionPDF';
import { appRouter } from '@/server/routers/_app';
import QRCode from 'qrcode';

export const runtime = 'nodejs';
export const maxDuration = 60;

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'sa-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    forcePathStyle: true,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // 🛡️ SECURITY: Fetch data entirely server-side, never trusting client payload.
        // We use tRPC server-side caller to reuse the same robust public status logic.
        const caller = appRouter.createCaller({ db: prisma, user: null, tenantId: null });
        const data = await caller.order.getPublicStatus({ orderId });

        if (!data) {
            return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
        }

        // Generate tracking assets
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.os-saas.com';
        const trackingUrl = `${baseUrl}/tracking/${orderId}`;
        const qrCodeUrl = await QRCode.toDataURL(trackingUrl, { width: 300, margin: 2 });

        // Generate PDF stream via React-PDF (No Puppeteer/Chromium = Fast & Secure)
        const pdfStream = await renderToStream(
            InspectionPDF({ data, qrCodeUrl, trackingUrl })
        );

        // 🛡️ SECURITY: Scope PDF path by tenantId to prevent cross-tenant enumeration
        const orderRecord = await prisma.serviceOrder.findUnique({
            where: { id: orderId },
            select: { tenantId: true }
        });
        const tenantId = orderRecord?.tenantId || 'unknown';
        const fileName = `pdfs/${tenantId}/os-${orderId}-${Date.now()}.pdf`;

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: fileName,
                Body: Readable.fromWeb(pdfStream as any),
                ContentType: 'application/pdf',
                CacheControl: 'max-age=31536000',
            },
            queueSize: 4,
            partSize: 5 * 1024 * 1024,
        });

        await upload.done();

        const endpoint = process.env.AWS_ENDPOINT || '';
        const isSupabase = endpoint.includes('supabase.co');

        let publicUrl = '';
        if (isSupabase) {
            publicUrl = `${endpoint.replace('/s3', '/object/public')}/${process.env.AWS_BUCKET_NAME}/${fileName}`;
        } else {
            publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        }

        // Save PDF URL to Order (Imutabilidade documental)
        await prisma.serviceOrder.update({
            where: { id: orderId },
            data: { pdfUrl: publicUrl }
        });

        return NextResponse.json({ url: publicUrl, success: true });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
