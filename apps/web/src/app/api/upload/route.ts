import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
];

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 100);
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        const mimeType = file.type.toLowerCase();
        const extension = file.name.toLowerCase().split('.').pop();
        const isHeic = extension === 'heic' || extension === 'heif';

        if (!ALLOWED_MIME_TYPES.includes(mimeType) && !isHeic) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Only images are allowed.' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const safeName = sanitizeFilename(file.name).replace(/\.[^/.]+$/, '');
        const filename = `${timestamp}-${safeName}.webp`;
        const contentType = file.type || 'image/webp';

        const publicUrl = await uploadFile(buffer, filename, contentType);

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json({
            success: false,
            error: 'Upload failed',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, { status: 500 });
    }
}

