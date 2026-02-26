import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@autevo/database';

// Opt out of Vercel Edge since Puppeteer needs Node.js runtime
export const runtime = 'nodejs';
// Increase max duration for PDF generation if on Vercel Pro (optional, ignored on Hobby)
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
        const { orderId, htmlContent } = body;

        if (!orderId || !htmlContent) {
            return NextResponse.json({ error: 'Missing orderId or htmlContent' }, { status: 400 });
        }

        // 🛡️ ZERO EGRESS COST: Injetar proxy params nas imagens do Supabase
        // Adiciona ?width=600&quality=80 para converter fotos de 5MB em ~50KB
        const optimizedHtml = htmlContent.replace(/src="([^"]+supabase\.co[^"]+)"/g, (match: string, url: string) => {
            if (url.includes('?')) return `src="${url}&width=600&quality=80"`;
            return `src="${url}?width=600&quality=80"`;
        });

        // Configuração segura para rodar no AWS Lambda / Vercel Serverless
        const isLocal = process.env.NODE_ENV === 'development';

        let browser;
        if (isLocal) {
            // No Windows Local, requer caminho do executável do Chrome
            // O usuário precisará ter o Chrome ou Edge instalado
            // Fallback para caminhos comuns
            const executablePath = process.platform === 'win32'
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                // @ts-expect-error
                : process.platform === 'linux' ? '/usr/bin/google-chrome' : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: executablePath,
                headless: true,
            });
        } else {
            // Ambiente Serverless
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        }

        const page = await browser.newPage();

        // Define o conteúdo HTML
        await page.setContent(optimizedHtml, { waitUntil: 'networkidle0' });

        // Gera o PDF (A4 via Puppeteer)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();

        // 🚀 Upload para S3/Supabase Storage
        const fileName = `pdfs/os-${orderId}-${Date.now()}.pdf`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            CacheControl: 'max-age=31536000',
            // ACL: 'public-read' // Em Supabase/S3 modernos, a ACL pública costuma ser via Bucket Policy, mas pode-se tentar public-read
        }));

        // Resolve a URL pública baseada no Endpoint
        const endpoint = process.env.AWS_ENDPOINT || '';
        const isSupabase = endpoint.includes('supabase.co');

        let publicUrl = '';
        if (isSupabase) {
            publicUrl = `${endpoint.replace('/s3', '/object/public')}/${process.env.AWS_BUCKET_NAME}/${fileName}`;
        } else {
            publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        }

        // Salvar a URL do PDF na OS (Imutabilidade documental)
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
