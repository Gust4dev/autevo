import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
});

export interface UploadContext {
    tenantId: string;
    orderId?: string;
}

export async function uploadFile(
    file: Buffer | Uint8Array,
    filename: string,
    contentType: string,
    context?: UploadContext
): Promise<string> {
    const MAX_BYTE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.byteLength > MAX_BYTE_SIZE) {
        throw new Error("Tamanho limite de arquivo excedido (Máx: 10MB).");
    }

    const bucket = process.env.AWS_BUCKET_NAME;

    if (!bucket) {
        throw new Error('AWS_BUCKET_NAME is not defined');
    }
    if (!process.env.AWS_ENDPOINT) {
        throw new Error('AWS_ENDPOINT is not defined');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
        throw new Error('AWS_ACCESS_KEY_ID is not defined');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS_SECRET_ACCESS_KEY is not defined');
    }

    const fileKey = context
        ? `${context.tenantId}/${context.orderId || 'general'}/${filename}`
        : filename;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,
        Body: file,
        ContentType: contentType,
    });

    try {
        await s3.send(command);
    } catch (error: any) {
        throw error;
    }

    return fileKey;
}
