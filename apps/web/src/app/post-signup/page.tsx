"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Smart post-signup redirect:
 * - Invited member (has tenantId in metadata) → /dashboard
 * - New owner (no tenantId) → /activate
 *
 * Polls for Clerk metadata sync (async after webhook/createContext) before deciding.
 */
export default function PostSignupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 10; // 5 seconds total (10 × 500ms)

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const check = async () => {
      const tenantId = user.publicMetadata?.tenantId as string | undefined;

      if (tenantId) {
        // Invited member or returning user — go to dashboard
        router.replace("/dashboard");
        return;
      }

      attemptsRef.current += 1;

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        // Timed out — no tenantId means new owner, go to activate
        router.replace("/activate");
        return;
      }

      // Reload Clerk session to pick up metadata set by createContext
      await user.reload();
      setTimeout(check, 500);
    };

    check();
  }, [isLoaded, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Configurando seu acesso...</p>
      </div>
    </div>
  );
}
