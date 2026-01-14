import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.AWS_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

export async function uploadFile(
    file: Buffer | Uint8Array,
    filename: string,
    contentType: string
): Promise<string> {
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

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);

    let publicUrl: string;

    if (process.env.AWS_ENDPOINT?.includes('supabase.co')) {
        const baseUrl = process.env.AWS_ENDPOINT.replace('/s3', '/object/public');
        publicUrl = `${baseUrl}/${bucket}/${filename}`;
    } else {
        publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
    }

    return publicUrl;
}
