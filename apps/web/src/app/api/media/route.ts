import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSignedFileUrl } from "@/lib/signed-url";

export async function GET(req: NextRequest) {
    const { userId } = await auth();

    // Permitir acesso público se houver token JWT de Tracking válido
    if (!userId) {
        const token = req.nextUrl.searchParams.get("token");
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validar JWT para acesso público
        const { jwtVerify } = await import("jose");
        const secretKey =
            process.env.NEXTAUTH_SECRET || process.env.CLERK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        try {
            await jwtVerify(token, new TextEncoder().encode(secretKey));
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
    }

    const key = req.nextUrl.searchParams.get("key");
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    try {
        const signedUrl = await getSignedFileUrl(key);
        return NextResponse.redirect(signedUrl, {
            status: 302,
            headers: {
                "Cache-Control": "public, s-maxage=1800, max-age=1800, stale-while-revalidate=60",
            },
        });
    } catch (err) {
        console.error("[MEDIA_PROXY_ERROR]", err);
        return NextResponse.json({ error: "Could not generate link" }, { status: 500 });
    }
}
