import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ============ STORAGE MODULE INITIALIZATION ============
const initLog = (msg: string) => console.log(`[Storage Init] ${msg}`);

initLog('Module loading...');
initLog(`Endpoint: ${process.env.AWS_ENDPOINT ?? 'UNDEFINED'}`);
initLog(`Region: ${process.env.AWS_REGION ?? 'UNDEFINED'}`);
initLog(`Bucket: ${process.env.AWS_BUCKET_NAME ?? 'UNDEFINED'}`);
initLog(`AccessKeyId: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.slice(0, 8) + '...' : 'UNDEFINED'}`);
initLog(`SecretAccessKey: ${process.env.AWS_SECRET_ACCESS_KEY ? '[REDACTED - ' + process.env.AWS_SECRET_ACCESS_KEY.length + ' chars]' : 'UNDEFINED'}`);

// Validate required environment variables at module load
const missingEnvVars: string[] = [];
if (!process.env.AWS_ENDPOINT) missingEnvVars.push('AWS_ENDPOINT');
if (!process.env.AWS_ACCESS_KEY_ID) missingEnvVars.push('AWS_ACCESS_KEY_ID');
if (!process.env.AWS_SECRET_ACCESS_KEY) missingEnvVars.push('AWS_SECRET_ACCESS_KEY');
if (!process.env.AWS_BUCKET_NAME) missingEnvVars.push('AWS_BUCKET_NAME');

if (missingEnvVars.length > 0) {
    console.error(`[Storage Init] ⚠️ CRITICAL: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize S3 Client (works with Supabase, R2, AWS, MinIO)
let s3Client: S3Client;
try {
    s3Client = new S3Client({
        region: process.env.AWS_REGION || 'auto',
        endpoint: process.env.AWS_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
    });
    initLog('S3Client created successfully');
} catch (err) {
    console.error('[Storage Init] FATAL: Failed to create S3Client:', err);
    throw err;
}

export async function uploadFile(
    file: Buffer | Uint8Array,
    filename: string,
    contentType: string
): Promise<string> {
    const uploadId = `s3-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const log = (msg: string) => console.log(`[Storage][${uploadId}] ${msg}`);
    const errorLog = (msg: string) => console.error(`[Storage][${uploadId}] ${msg}`);

    log('============ UPLOAD STARTED ============');
    log(`Filename: ${filename}`);
    log(`Content-Type: ${contentType}`);
    log(`File size: ${file.length} bytes`);

    const bucket = process.env.AWS_BUCKET_NAME;
    log(`Target bucket: ${bucket ?? 'UNDEFINED'}`);

    if (!bucket) {
        errorLog('FATAL: AWS_BUCKET_NAME is not defined');
        throw new Error('AWS_BUCKET_NAME is not defined');
    }

    // Double-check required env vars at upload time
    if (!process.env.AWS_ENDPOINT) {
        errorLog('FATAL: AWS_ENDPOINT is not defined at upload time');
        throw new Error('AWS_ENDPOINT is not defined');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
        errorLog('FATAL: AWS_ACCESS_KEY_ID is not defined at upload time');
        throw new Error('AWS_ACCESS_KEY_ID is not defined');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
        errorLog('FATAL: AWS_SECRET_ACCESS_KEY is not defined at upload time');
        throw new Error('AWS_SECRET_ACCESS_KEY is not defined');
    }

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file,
        ContentType: contentType,
        // ACL: 'public-read', // Supabase buckets are usually public via policy, but some providers need this
    });

    log(`PutObjectCommand created: Bucket=${bucket}, Key=${filename}`);
    log(`Sending to endpoint: ${process.env.AWS_ENDPOINT}`);

    try {
        log('Calling s3Client.send()...');
        const result = await s3Client.send(command);
        log(`S3 Response - HTTPStatusCode: ${result.$metadata?.httpStatusCode}`);
        log(`S3 Response - RequestId: ${result.$metadata?.requestId}`);
        log(`S3 Response - ETag: ${result.ETag}`);
    } catch (s3Error: unknown) {
        errorLog('============ S3 UPLOAD FAILED ============');

        if (s3Error instanceof Error) {
            errorLog(`Error Name: ${s3Error.name}`);
            errorLog(`Error Message: ${s3Error.message}`);
            errorLog(`Stack: ${s3Error.stack}`);
        }

        // Log S3-specific error details
        if (s3Error && typeof s3Error === 'object') {
            const errObj = s3Error as Record<string, unknown>;
            if (errObj.$metadata) {
                errorLog(`S3 Metadata: ${JSON.stringify(errObj.$metadata, null, 2)}`);
            }
            if (errObj.Code) {
                errorLog(`S3 Error Code: ${errObj.Code}`);
            }
            if (errObj.$fault) {
                errorLog(`S3 Fault: ${errObj.$fault}`);
            }
            if (errObj.$service) {
                errorLog(`S3 Service: ${errObj.$service}`);
            }
        }

        throw s3Error;
    }

    // Construct Public URL
    let publicUrl: string;

    if (process.env.AWS_ENDPOINT?.includes('supabase.co')) {
        const baseUrl = process.env.AWS_ENDPOINT.replace('/s3', '/object/public');
        publicUrl = `${baseUrl}/${bucket}/${filename}`;
        log(`Constructed Supabase public URL: ${publicUrl}`);
    } else {
        publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        log(`Constructed generic S3 URL: ${publicUrl}`);
    }

    log('============ UPLOAD COMPLETED ============');
    return publicUrl;
}
