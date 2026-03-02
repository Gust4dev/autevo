import { NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { prisma } from '@autevo/database';
import { renderToStream } from '@react-pdf/renderer';
import { InspectionPDF } from '@/components/pdfs/InspectionPDF';
import QRCode from 'qrcode';

export const runtime = 'nodejs';
export const maxDuration = 60;

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

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
        const order = await prisma.serviceOrder.findUnique({
            where: { id: orderId },
            include: {
                vehicle: { select: { plate: true, model: true, brand: true, color: true, customer: { select: { name: true } } } },
                tenant: { select: { name: true, phone: true, logo: true, primaryColor: true, secondaryColor: true, inspectionSignature: true } },
                items: { select: { id: true, service: { select: { name: true } }, customName: true, price: true, quantity: true } },
                products: { select: { id: true, customName: true, quantity: true } },
                payments: { select: { id: true, amount: true, method: true, paidAt: true }, orderBy: { paidAt: 'asc' } }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
        }

        const inspections = await prisma.inspection.findMany({
            where: { orderId },
            include: {
                items: {
                    select: { id: true, category: true, itemKey: true, label: true, isRequired: true, isCritical: true, photoUrl: true, photos: true, status: true, damageType: true, severity: true, completedAt: true },
                    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
                },
                damages: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        const data = {
            id: order.id,
            status: order.status,
            customerName: order.vehicle.customer?.name?.split(' ')[0] || 'Cliente',
            vehicleName: `${order.vehicle.brand} ${order.vehicle.model}`,
            vehicleColor: order.vehicle.color || 'N/A',
            vehiclePlate: order.vehicle.plate ? order.vehicle.plate.substring(0, 3) + '****' : null,
            tenantContact: {
                name: order.tenant.name,
                whatsapp: order.tenant.phone,
                phone: order.tenant.phone,
                logo: order.tenant.logo,
                primaryColor: order.tenant.primaryColor || '#DC2626',
                secondaryColor: order.tenant.secondaryColor || '#1F2937',
                inspectionSignature: (order.tenant as any).inspectionSignature ?? true,
            },
            services: order.items.map((item: any) => ({ name: item.customName || item.service?.name || 'Serviço', total: Number(item.price) * item.quantity })),
            products: order.products.map((prod: any) => ({ name: prod.customName || 'Produto', quantity: prod.quantity })),
            payments: order.payments.map((pay: any) => ({ amount: Number(pay.amount), method: pay.method, paidAt: pay.paidAt })),
            subtotal: Number(order.subtotal || 0),
            discountType: order.discountType,
            discountValue: Number(order.discountValue || 0),
            total: Number(order.total),
            inspections: inspections.map((inspection: any) => {
                const requiredItems = inspection.items.filter((i: any) => i.isRequired);
                const completedRequired = requiredItems.filter((i: any) => i.status !== 'pendente').length;
                const allRequiredCompleted = requiredItems.length > 0 && completedRequired === requiredItems.length;
                const canSign = allRequiredCompleted && !inspection.signatureUrl && (order.tenant as any).inspectionSignature !== false;

                return {
                    id: inspection.id, type: inspection.type, status: inspection.status, signatureUrl: inspection.signatureUrl, signedAt: inspection.signedAt, createdAt: inspection.createdAt, canSign,
                    items: inspection.items.map((item: any) => ({ id: item.id, category: item.category, label: item.label, status: item.status, photoUrl: item.photoUrl, photos: item.photos || [], isCritical: item.isCritical, damageType: item.damageType, severity: item.severity })),
                    damages: inspection.damages.map((d: any) => ({ id: d.id, position: d.position, damageType: d.damageType, photoUrl: d.photoUrl })),
                };
            }),
        };

        // Generate tracking assets
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.os-saas.com';
        const trackingUrl = `${baseUrl}/tracking/${orderId}`;
        const qrCodeUrl = await QRCode.toDataURL(trackingUrl, { width: 300, margin: 2 });

        // Generate PDF stream via React-PDF (No Puppeteer/Chromium = Fast & Secure)
        const pdfStream = await renderToStream(
            InspectionPDF({ data, qrCodeUrl, trackingUrl })
        );

        // 🛡️ SECURITY: Scope PDF path by tenantId to prevent cross-tenant enumeration
        const tenantId = order.tenantId;
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

        // Generate Signed URL (valid for 15 minutes) instead of permanent public URL
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileName,
        });

        const signedUrl = await getSignedUrl(s3 as any, command, { expiresIn: 900 });

        // Save PDF file key to Order (Imutabilidade documental)
        await prisma.serviceOrder.update({
            where: { id: orderId },
            data: { pdfUrl: fileName }
        });

        return NextResponse.json({ url: signedUrl, success: true });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
