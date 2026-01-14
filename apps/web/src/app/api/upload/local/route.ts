import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, '');
        const filename = `${timestamp}-${safeName}.webp`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        return NextResponse.json({ success: true, url: `/uploads/${filename}` });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
