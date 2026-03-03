import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
        }

        // 🛡️ SECURITY: Whitelist de domínios (Evitar SSRF para localhost ou cloud metadata)
        const ALLOWED_HOSTS = process.env.AWS_ENDPOINT ? [
            new URL(process.env.AWS_ENDPOINT).host,
            `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
            'autevo.s3.sa-east-1.amazonaws.com'
        ] : [];

        if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.some(host => parsedUrl.host.includes(host))) {
            return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
        }

        // 🛡️ SECURITY: Lidar com o tamanho antes de baixar pra evitar OOM/DDoS
        const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
        if (head) {
            const size = Number(head.headers.get('content-length'));
            const type = head.headers.get('content-type');

            const MAX_SIZE = 5 * 1024 * 1024; // 5MB MAX
            if (size > MAX_SIZE) {
                return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 413 });
            }
            if (type && !type.startsWith('image/')) {
                return NextResponse.json({ error: 'Not an image' }, { status: 415 });
            }
        }

        // Fetch the image from the external URL
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Autevo Proxy/1.0',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/png';

        // Double check on GET response length to be absolutely safe
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 413 });
        }

        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        return NextResponse.json({ dataUrl });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }
}
