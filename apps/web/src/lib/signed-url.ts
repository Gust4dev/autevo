import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./storage";

export async function getSignedFileUrl(
    keyOrUrl: string,
    expiresIn = 3600,
): Promise<string> {
    if (!keyOrUrl) return "";
    let key = keyOrUrl;

    // Retrocompatibilidade para URLs completas antigas (Supabase ou AWS)
    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        const bucket = process.env.AWS_BUCKET_NAME!;
        try {
            const urlObj = new URL(keyOrUrl);
            if (urlObj.pathname.includes(`/${bucket}/`)) {
                key = urlObj.pathname.split(`/${bucket}/`)[1];
            } else {
                key = urlObj.pathname.slice(1);
            }
        } catch (e) {
            return "";
        }
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
    });

    return getSignedUrl(s3 as any, command, { expiresIn });
}
