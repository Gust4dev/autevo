import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

async function streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        stream.on('data', (data: any) => buffers.push(data));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
        stream.on('error', reject);
    });
}

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

        // Generate PDF Buffer purely via React-PDF (No Puppeteer/Chromium = Fast & Secure)
        // Since it's a .ts file and not .tsx, we invoke the component as a function directly.
        const pdfStream = await renderToStream(
            InspectionPDF({ data, qrCodeUrl, trackingUrl })
        );
        const pdfBuffer = await streamToBuffer(pdfStream);

        // 🚀 Upload to S3/Supabase Storage
        const fileName = `pdfs/os-${orderId}-${Date.now()}.pdf`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            CacheControl: 'max-age=31536000',
        }));

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
