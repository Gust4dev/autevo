import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    console.log(`[Upload API][${requestId}] ============ REQUEST STARTED ============`);
    console.log(`[Upload API][${requestId}] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Upload API][${requestId}] AWS_ENDPOINT defined: ${!!process.env.AWS_ENDPOINT}`);
    console.log(`[Upload API][${requestId}] AWS_ACCESS_KEY_ID defined: ${!!process.env.AWS_ACCESS_KEY_ID}`);
    console.log(`[Upload API][${requestId}] AWS_SECRET_ACCESS_KEY defined: ${!!process.env.AWS_SECRET_ACCESS_KEY}`);
    console.log(`[Upload API][${requestId}] AWS_BUCKET_NAME defined: ${!!process.env.AWS_BUCKET_NAME}`);
    console.log(`[Upload API][${requestId}] AWS_REGION defined: ${!!process.env.AWS_REGION}`);

    try {
        console.log(`[Upload API][${requestId}] Parsing formData...`);
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            console.error(`[Upload API][${requestId}] ERROR: No file in formData`);
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[Upload API][${requestId}] File received: name=${file.name}, type=${file.type}, size=${file.size} bytes`);

        console.log(`[Upload API][${requestId}] Converting to arrayBuffer...`);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        console.log(`[Upload API][${requestId}] Buffer created: ${buffer.length} bytes`);

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, '');
        // FORCE .webp extension for consistency if desired, or keep original
        const filename = `${timestamp}-${safeName}.webp`;
        const contentType = file.type || 'image/webp';

        console.log(`[Upload API][${requestId}] Generated filename: ${filename}`);
        console.log(`[Upload API][${requestId}] Content-Type: ${contentType}`);

        // Upload to S3/Supabase
        console.log(`[Upload API][${requestId}] Calling uploadFile()...`);
        const publicUrl = await uploadFile(buffer, filename, contentType);

        console.log(`[Upload API][${requestId}] SUCCESS! Public URL: ${publicUrl}`);
        console.log(`[Upload API][${requestId}] ============ REQUEST COMPLETED ============`);

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        console.error(`[Upload API][${requestId}] ============ UPLOAD FAILED ============`);
        console.error(`[Upload API][${requestId}] Error Name: ${errorName}`);
        console.error(`[Upload API][${requestId}] Error Message: ${errorMessage}`);
        console.error(`[Upload API][${requestId}] Stack Trace: ${errorStack}`);

        // Log additional S3-specific error properties if available
        if (error && typeof error === 'object') {
            const s3Error = error as Record<string, unknown>;
            if (s3Error.$metadata) {
                console.error(`[Upload API][${requestId}] S3 Metadata:`, JSON.stringify(s3Error.$metadata, null, 2));
            }
            if (s3Error.Code) {
                console.error(`[Upload API][${requestId}] S3 Error Code: ${s3Error.Code}`);
            }
            if (s3Error.$fault) {
                console.error(`[Upload API][${requestId}] Fault: ${s3Error.$fault}`);
            }
        }

        console.error(`[Upload API][${requestId}] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));

        return NextResponse.json({
            success: false,
            error: 'Upload failed',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, { status: 500 });
    }
}
